import React from 'react'
import { Connection } from '../types'
import Terminal from './Terminal'

interface Props {
    connection: Connection | null
    sessionId: string | null
    isActive: boolean
    showHeader: boolean
    wsPort: number
    paneIndex: number
    paneCount: number
    cellStyle?: React.CSSProperties
    termBgColor: string
    onActivate: () => void
    onConnect: () => void
    onDisconnect: () => void
    onSessionEnded: () => void
    onClose: () => void
    onFitReady: (fn: () => void) => void
}

export default function Pane({
    connection, sessionId, isActive, showHeader, wsPort, cellStyle, termBgColor,
    onActivate, onConnect, onDisconnect, onSessionEnded, onClose, onFitReady,
}: Props) {
    return (
        <div
            className={`pane-cell${isActive && showHeader ? ' active-pane' : ''}`}
            style={cellStyle}
            onClick={!isActive ? onActivate : undefined}
        >
            {showHeader && (
                <div className="pane-header">
                    <span className="pane-name">
                        {connection
                            ? `${connection.user || 'root'}@${connection.host}:${connection.port || 22}`
                            : 'No connection'}
                    </span>
                    {sessionId ? (
                        <button className="btn-icon-xs" title="Disconnect"
                            onClick={e => { e.stopPropagation(); onDisconnect() }}>
                            <i className="ri-stop-fill"></i>
                        </button>
                    ) : (
                        <button className="btn-icon-xs" title="Connect" disabled={!connection}
                            onClick={e => { e.stopPropagation(); onConnect() }}>
                            <i className="ri-play-fill"></i>
                        </button>
                    )}
                    <button className="btn-icon-xs" title="Close pane"
                        onClick={e => { e.stopPropagation(); onClose() }}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            )}
            <Terminal
                sessionId={sessionId}
                wsPort={wsPort}
                bgColor={termBgColor}
                onDisconnected={onSessionEnded}
                onFitReady={onFitReady}
            />
        </div>
    )
}
