package pty

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
	"github.com/odair/multi-ssh/internal/model"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Session represents an active PTY session
type Session struct {
	cmd  *exec.Cmd
	ptmx *os.File
	mu   sync.Mutex
	done chan struct{}
}

// Manager manages PTY sessions
type Manager struct {
	sessions map[string]*Session
	mu       sync.Mutex
}

// NewManager creates a new PTY session manager
func NewManager() *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
	}
}

// HandleWebSocket handles WebSocket connections for terminal I/O
func (m *Manager) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	connID := r.URL.Query().Get("id")
	if connID == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer ws.Close()

	m.mu.Lock()
	session, exists := m.sessions[connID]
	m.mu.Unlock()

	if !exists {
		ws.WriteMessage(websocket.TextMessage, []byte("\r\nSession not found.\r\n"))
		return
	}

	// PTY -> WebSocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := session.ptmx.Read(buf)
			if err != nil {
				if err != io.EOF {
					log.Printf("PTY read error: %v", err)
				}
				ws.WriteMessage(websocket.TextMessage, []byte("\r\n\033[90m— Session ended —\033[0m\r\n"))
				return
			}
			if err := ws.WriteMessage(websocket.BinaryMessage, buf[:n]); err != nil {
				return
			}
		}
	}()

	// WebSocket -> PTY
	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			break
		}

		// Handle resize messages: \x01 + JSON
		if len(msg) > 0 && msg[0] == 1 {
			// Resize: \x01{cols},{rows}
			var cols, rows uint16
			fmt.Sscanf(string(msg[1:]), "%d,%d", &cols, &rows)
			if cols > 0 && rows > 0 {
				setWinsize(session.ptmx, cols, rows)
			}
			continue
		}

		_, err = session.ptmx.Write(msg)
		if err != nil {
			break
		}
	}

	// Cleanup
	m.StopSession(connID)
}

// StartSession starts a new PTY session for an SSH connection
func (m *Manager) StartSession(id string, conn model.Connection) error {
	m.StopSession(id) // Stop any existing session

	sshArgs := conn.SSHArgs()

	var cmd *exec.Cmd
	if conn.Password != "" {
		// Use sshpass for password authentication
		args := append([]string{"-p", conn.Password, "ssh"}, sshArgs...)
		cmd = exec.Command("sshpass", args...)
	} else {
		cmd = exec.Command("ssh", sshArgs...)
	}
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("failed to start PTY: %w", err)
	}

	session := &Session{
		cmd:  cmd,
		ptmx: ptmx,
		done: make(chan struct{}),
	}

	m.mu.Lock()
	m.sessions[id] = session
	m.mu.Unlock()

	// Wait for process to exit in background
	go func() {
		cmd.Wait()
		close(session.done)
	}()

	return nil
}

// StopSession stops and cleans up a PTY session
func (m *Manager) StopSession(id string) {
	m.mu.Lock()
	session, exists := m.sessions[id]
	if exists {
		delete(m.sessions, id)
	}
	m.mu.Unlock()

	if !exists {
		return
	}

	session.ptmx.Close()
	if session.cmd.Process != nil {
		killProcess(session.cmd.Process)
	}
}
