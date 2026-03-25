//go:build windows

package pty

import "os"

func setWinsize(f *os.File, cols, rows uint16) {
	// Windows ConPTY handles resize differently; no-op here as
	// creack/pty uses ConPTY on Windows which manages sizing internally.
}

func killProcess(p *os.Process) {
	p.Kill()
}
