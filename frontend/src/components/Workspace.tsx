import React from 'react'
import { model } from '../../wailsjs/go/models'
import Terminal from './Terminal'

type Connection = model.Connection

interface Props {
    connection: Connection | null
    currentSessionId: string | null
    wsPort: number
    onConnect: () => void
    onDisconnect: () => void
    onSessionEnded: () => void
    onEdit: () => void
    onDelete: () => void
    onFitReady: (fn: () => void) => void
}

export default function Workspace({ connection, currentSessionId, wsPort, onConnect, onDisconnect, onSessionEnded, onEdit, onDelete, onFitReady }: Props) {
    if (!connection) return null

    const port = connection.port || 22

    return (
        <div id="workspace">
            <div className="topbar" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
                <div className="topbar-info">
                    <h1>{connection.name}</h1>
                    <span className="topbar-host">{connection.user || 'root'}@{connection.host}:{port}</span>
                </div>
                <div className="topbar-actions" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
                    {!currentSessionId ? (
                        <button className="btn-icon" title="Connect" onClick={onConnect}>
                            <i className="ri-play-fill"></i>
                        </button>
                    ) : (
                        <button className="btn-icon" title="Disconnect" onClick={onDisconnect}>
                            <i className="ri-stop-fill"></i>
                        </button>
                    )}
                    <button className="btn-icon" title="Edit" onClick={onEdit}>
                        <i className="ri-settings-3-line"></i>
                    </button>
                    <button className="btn-icon btn-icon-danger" title="Delete" onClick={onDelete}>
                        <i className="ri-delete-bin-6-line"></i>
                    </button>
                </div>
            </div>

            <div className="info-row">
                <div className="info-pill">
                    <span className="info-label">Host</span>
                    <span className="info-value">{connection.host}</span>
                </div>
                <div className="info-pill">
                    <span className="info-label">Port</span>
                    <span className="info-value">{port}</span>
                </div>
                <div className="info-pill">
                    <span className="info-label">User</span>
                    <span className="info-value">{connection.user || 'root'}</span>
                </div>
                {connection.identity_key && (
                    <div className="info-pill">
                        <span className="info-label">Key</span>
                        <span className="info-value">{connection.identity_key}</span>
                    </div>
                )}
            </div>

            <Terminal
                sessionId={currentSessionId}
                wsPort={wsPort}
                onDisconnected={onSessionEnded}
                onFitReady={onFitReady}
            />
        </div>
    )
}
