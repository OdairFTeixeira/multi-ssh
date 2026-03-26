import React from 'react'
import { Connection } from '../types'
import Terminal from './Terminal'

interface Props {
    connection: Connection | null
    sessionId: string | null
    isActive: boolean
    isSplit: boolean
    wsPort: number
    paneIndex: number
    onActivate: () => void
    onConnect: () => void
    onDisconnect: () => void
    onSessionEnded: () => void
    onClose: () => void
    onFitReady: (fn: () => void) => void
}

export default function Pane({
    connection, sessionId, isActive, isSplit, wsPort,
    onActivate, onConnect, onDisconnect, onSessionEnded, onClose, onFitReady,
}: Props) {
    return (
        <div
            className={`split-pane${isSplit && isActive ? ' active-pane' : ''}`}
            onClick={!isActive ? onActivate : undefined}
        >
            {isSplit && (
                <div className="pane-header">
                    <span className="pane-name">
                        {connection
                            ? `${connection.user || 'root'}@${connection.host}:${connection.port || 22}`
                            : 'No connection selected'}
                    </span>
                    {sessionId ? (
                        <button
                            className="btn-icon-xs"
                            title="Disconnect"
                            onClick={e => { e.stopPropagation(); onDisconnect() }}
                        >
                            <i className="ri-stop-fill"></i>
                        </button>
                    ) : (
                        <button
                            className="btn-icon-xs"
                            title="Connect"
                            disabled={!connection}
                            onClick={e => { e.stopPropagation(); onConnect() }}
                        >
                            <i className="ri-play-fill"></i>
                        </button>
                    )}
                    <button
                        className="btn-icon-xs"
                        title="Close pane"
                        onClick={e => { e.stopPropagation(); onClose() }}
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            )}
            <Terminal
                sessionId={sessionId}
                wsPort={wsPort}
                onDisconnected={onSessionEnded}
                onFitReady={onFitReady}
            />
        </div>
    )
}
