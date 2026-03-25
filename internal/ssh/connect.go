package ssh

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/odair/multi-ssh/internal/model"
)

// Connect establishes an SSH connection to the given host
// It takes over the terminal completely (stdin, stdout, stderr)
func Connect(conn model.Connection) error {
	args := conn.SSHArgs()

	cmd := exec.Command("ssh", args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Printf("\n🔗 Connecting to %s (%s@%s:%d)...\n\n",
		conn.Name, conn.User, conn.Host, conn.Port)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("SSH connection failed: %w", err)
	}

	return nil
}

// TestConnection tests if the SSH connection can be established
func TestConnection(conn model.Connection) error {
	args := conn.SSHArgs()
	args = append(args, "-o", "ConnectTimeout=5", "-o", "BatchMode=yes", "exit")

	cmd := exec.Command("ssh", args...)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}
	return nil
}
