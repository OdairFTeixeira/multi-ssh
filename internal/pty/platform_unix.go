//go:build !windows

package pty

import (
	"os"
	"syscall"
	"unsafe"
)

func setWinsize(f *os.File, cols, rows uint16) {
	ws := struct {
		Rows uint16
		Cols uint16
		X    uint16
		Y    uint16
	}{
		Rows: rows,
		Cols: cols,
	}
	syscall.Syscall(
		syscall.SYS_IOCTL,
		f.Fd(),
		syscall.TIOCSWINSZ,
		uintptr(unsafe.Pointer(&ws)),
	)
}

func killProcess(p *os.Process) {
	p.Signal(syscall.SIGTERM)
}
