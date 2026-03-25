package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os/exec"

	"github.com/odair/multi-ssh/internal/config"
	"github.com/odair/multi-ssh/internal/model"
	ptyMgr "github.com/odair/multi-ssh/internal/pty"
)

// App struct - exposed to frontend via Wails bindings
type App struct {
	ctx       context.Context
	configMgr *config.Manager
	pty       *ptyMgr.Manager
	wsPort    int
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		pty: ptyMgr.NewManager(),
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	mgr, err := config.NewManager()
	if err != nil {
		fmt.Printf("Error initializing config: %s\n", err)
		return
	}
	a.configMgr = mgr

	// Start WebSocket server on a random available port
	a.startWebSocketServer()
}

func (a *App) startWebSocketServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws/terminal", a.pty.HandleWebSocket)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		fmt.Printf("Failed to start WS server: %s\n", err)
		return
	}
	a.wsPort = listener.Addr().(*net.TCPAddr).Port
	fmt.Printf("WebSocket server on port %d\n", a.wsPort)

	go http.Serve(listener, mux)
}

// GetWSPort returns the WebSocket server port for the frontend
func (a *App) GetWSPort() int {
	return a.wsPort
}

// GetConnections returns all SSH connections
func (a *App) GetConnections() ([]model.Connection, error) {
	cfg, err := a.configMgr.Load()
	if err != nil {
		return nil, err
	}
	return cfg.Connections, nil
}

// GetSettings returns app settings
func (a *App) GetSettings() (model.Settings, error) {
	cfg, err := a.configMgr.Load()
	if err != nil {
		return model.Settings{}, err
	}
	return cfg.Settings, nil
}

// AddConnection adds a new SSH connection
func (a *App) AddConnection(conn model.Connection) error {
	return a.configMgr.AddConnection(conn)
}

// UpdateConnection updates an existing SSH connection
func (a *App) UpdateConnection(index int, conn model.Connection) error {
	return a.configMgr.UpdateConnection(index, conn)
}

// DeleteConnection deletes an SSH connection by index
func (a *App) DeleteConnection(index int) error {
	return a.configMgr.DeleteConnection(index)
}

// StartSSHSession starts an embedded PTY SSH session
func (a *App) StartSSHSession(index int) (string, error) {
	cfg, err := a.configMgr.Load()
	if err != nil {
		return "", err
	}

	if index < 0 || index >= len(cfg.Connections) {
		return "", fmt.Errorf("invalid connection index: %d", index)
	}

	conn := cfg.Connections[index]
	if conn.Port == 0 {
		conn.Port = 22
	}

	sessionID := fmt.Sprintf("session-%d", index)
	if err := a.pty.StartSession(sessionID, conn); err != nil {
		return "", err
	}

	return sessionID, nil
}

// StopSSHSession stops an embedded PTY SSH session
func (a *App) StopSSHSession(sessionID string) {
	a.pty.StopSession(sessionID)
}

// TestConnection tests if an SSH connection can be established
func (a *App) TestConnection(index int) error {
	cfg, err := a.configMgr.Load()
	if err != nil {
		return err
	}

	if index < 0 || index >= len(cfg.Connections) {
		return fmt.Errorf("invalid connection index: %d", index)
	}

	conn := cfg.Connections[index]
	args := conn.SSHArgs()
	args = append([]string{"-o", "ConnectTimeout=5", "-o", "BatchMode=yes"}, args...)
	args = append(args, "exit")

	cmd := exec.Command("ssh", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("connection failed: %s - %s", err, string(output))
	}
	return nil
}

// GetConnectionGroups returns a list of unique group names
func (a *App) GetConnectionGroups() ([]string, error) {
	cfg, err := a.configMgr.Load()
	if err != nil {
		return nil, err
	}

	groupSet := make(map[string]bool)
	for _, conn := range cfg.Connections {
		if conn.Group != "" {
			groupSet[conn.Group] = true
		}
	}

	groups := make([]string, 0, len(groupSet))
	for g := range groupSet {
		groups = append(groups, g)
	}
	return groups, nil
}
