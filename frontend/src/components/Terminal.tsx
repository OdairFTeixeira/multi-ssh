import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
    sessionId: string | null
    wsPort: number
    onDisconnected: () => void
    onFitReady: (fn: () => void) => void
}

export default function Terminal({ sessionId, wsPort, onDisconnected, onFitReady }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<XTerm | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const dataListenerRef = useRef<{ dispose: () => void } | null>(null)
    const sendResizeRef = useRef<() => void>(() => {})
    const [showPlaceholder, setShowPlaceholder] = useState<boolean>(true)

    // Initialize xterm once on mount
    useEffect(() => {
        const term = new XTerm({
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            theme: {
                background:    '#000000',
                foreground:    '#f5f5f7',
                cursor:        '#f5f5f7',
                selectionBackground: 'rgba(10, 132, 255, 0.3)',
                black:         '#1c1c1e',
                red:           '#ff453a',
                green:         '#30d158',
                yellow:        '#ffd60a',
                blue:          '#0a84ff',
                magenta:       '#bf5af2',
                cyan:          '#64d2ff',
                white:         '#f5f5f7',
                brightBlack:   '#636366',
                brightRed:     '#ff6961',
                brightGreen:   '#4cd964',
                brightYellow:  '#ffcc00',
                brightBlue:    '#409cff',
                brightMagenta: '#da8aff',
                brightCyan:    '#70d7ff',
                brightWhite:   '#ffffff',
            },
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)

        try { term.loadAddon(new WebLinksAddon()) } catch { /* optional */ }

        term.open(containerRef.current!)
        setTimeout(() => { try { fitAddon.fit() } catch { /* ignore */ } }, 100)

        xtermRef.current = term
        fitAddonRef.current = fitAddon
        onFitReady(() => { try { fitAddon.fit() } catch { /* ignore */ } })

        const ro = new ResizeObserver(() => {
            try { fitAddon.fit() } catch { /* ignore */ }
            sendResizeRef.current()
        })
        ro.observe(containerRef.current!.parentElement!)

        return () => {
            ro.disconnect()
            term.dispose()
            xtermRef.current = null
            fitAddonRef.current = null
        }
    }, [])

    // Connect / disconnect based on sessionId
    useEffect(() => {
        if (!sessionId || !wsPort) return

        const term = xtermRef.current
        if (!term) return

        term.clear()
        term.write('\x1b[90mConnecting...\x1b[0m\r\n')
        setShowPlaceholder(false)

        const socket = new WebSocket(`ws://127.0.0.1:${wsPort}/ws/terminal?id=${sessionId}`)
        socket.binaryType = 'arraybuffer'
        wsRef.current = socket

        socket.onopen = () => {
            term.clear()
            sendResizeRef.current()
            term.focus()
        }

        socket.onmessage = (e: MessageEvent) => {
            if (e.data instanceof ArrayBuffer) {
                term.write(new Uint8Array(e.data))
            } else {
                term.write(e.data as string)
            }
        }

        socket.onclose = () => {
            setShowPlaceholder(true)
            onDisconnected()
        }

        socket.onerror = () => {
            term.write('\r\n\x1b[31mConnection error.\x1b[0m\r\n')
        }

        sendResizeRef.current = () => {
            if (socket.readyState === WebSocket.OPEN && xtermRef.current) {
                socket.send('\x01' + xtermRef.current.cols + ',' + xtermRef.current.rows)
            }
        }

        if (dataListenerRef.current) dataListenerRef.current.dispose()
        dataListenerRef.current = term.onData((data: string) => {
            if (socket.readyState === WebSocket.OPEN) socket.send(data)
        })

        return () => {
            sendResizeRef.current = () => {}
            socket.onclose = null
            socket.close()
            wsRef.current = null
            if (dataListenerRef.current) {
                dataListenerRef.current.dispose()
                dataListenerRef.current = null
            }
            setShowPlaceholder(true)
            xtermRef.current?.reset()
        }
    }, [sessionId, wsPort])

    return (
        <div className="terminal-container">
            {showPlaceholder && (
                <div className="terminal-placeholder">
                    <i className="ri-terminal-line"></i>
                    <span>Press <kbd>▶</kbd> to connect</span>
                </div>
            )}
            <div className="terminal-inner" ref={containerRef}></div>
        </div>
    )
}
