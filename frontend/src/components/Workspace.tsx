import React from 'react'
import { Connection, Pane, SplitMode } from '../types'
import PaneView from './Pane'

interface Props {
    panes: Pane[]
    activePaneIndex: number
    splitMode: SplitMode
    connections: Connection[]
    wsPort: number
    onActivatePane: (i: number) => void
    onConnectPane: (i: number) => void
    onDisconnectPane: (i: number) => void
    onSessionEnded: (i: number) => void
    onSplit: (mode: 'horizontal' | 'vertical') => void
    onUnsplit: () => void
    onEdit: () => void
    onDelete: () => void
    onFitReady: (paneIdx: number, fn: () => void) => void
}

export default function Workspace({
    panes, activePaneIndex, splitMode, connections, wsPort,
    onActivatePane, onConnectPane, onDisconnectPane, onSessionEnded,
    onSplit, onUnsplit, onEdit, onDelete, onFitReady,
}: Props) {
    const activePane = panes[activePaneIndex] ?? panes[0]
    const activeConn = activePane && activePane.selectedIndex >= 0
        ? connections[activePane.selectedIndex]
        : null

    const isSplit = splitMode !== 'none'
    const flexDir = splitMode === 'vertical' ? 'column' : 'row'

    return (
        <div id="workspace">
            {/* Topbar — shows active pane connection */}
            <div className="topbar" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
                <div className="topbar-info">
                    {activeConn ? (
                        <>
                            <h1>{activeConn.name}</h1>
                            <span className="topbar-host">
                                {activeConn.user || 'root'}@{activeConn.host}:{activeConn.port || 22}
                            </span>
                        </>
                    ) : (
                        <h1 style={{ color: 'var(--text-dim)', fontWeight: 400 }}>Select a connection</h1>
                    )}
                </div>
                <div className="topbar-actions" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
                    {/* Connect / Disconnect for active pane */}
                    {!isSplit && (
                        activePane?.sessionId ? (
                            <button className="btn-icon" title="Disconnect" onClick={() => onDisconnectPane(activePaneIndex)}>
                                <i className="ri-stop-fill"></i>
                            </button>
                        ) : (
                            <button className="btn-icon" title="Connect" disabled={!activeConn} onClick={() => onConnectPane(activePaneIndex)}>
                                <i className="ri-play-fill"></i>
                            </button>
                        )
                    )}

                    {/* Split controls */}
                    {!isSplit ? (
                        <>
                            <button className="btn-icon" title="Split side by side" onClick={() => onSplit('horizontal')}>
                                <i className="ri-layout-column-line"></i>
                            </button>
                            <button className="btn-icon" title="Split top / bottom" onClick={() => onSplit('vertical')}>
                                <i className="ri-layout-row-line"></i>
                            </button>
                        </>
                    ) : (
                        <button className="btn-icon" title="Close split" onClick={onUnsplit}>
                            <i className="ri-layout-fill"></i>
                        </button>
                    )}

                    <button className="btn-icon" title="Edit" disabled={!activeConn} onClick={onEdit}>
                        <i className="ri-settings-3-line"></i>
                    </button>
                    <button className="btn-icon btn-icon-danger" title="Delete" disabled={!activeConn} onClick={onDelete}>
                        <i className="ri-delete-bin-6-line"></i>
                    </button>
                </div>
            </div>

            {/* Info row — active pane connection details */}
            {activeConn && (
                <div className="info-row">
                    <div className="info-pill">
                        <span className="info-label">Host</span>
                        <span className="info-value">{activeConn.host}</span>
                    </div>
                    <div className="info-pill">
                        <span className="info-label">Port</span>
                        <span className="info-value">{activeConn.port || 22}</span>
                    </div>
                    <div className="info-pill">
                        <span className="info-label">User</span>
                        <span className="info-value">{activeConn.user || 'root'}</span>
                    </div>
                    {activeConn.identity_key && (
                        <div className="info-pill">
                            <span className="info-label">Key</span>
                            <span className="info-value">{activeConn.identity_key}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Pane container */}
            <div className="split-container" style={{ flexDirection: flexDir }}>
                {panes.map((pane, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && (
                            <div className={`split-divider ${splitMode === 'vertical' ? 'horizontal' : 'vertical'}`} />
                        )}
                        <PaneView
                            connection={pane.selectedIndex >= 0 ? connections[pane.selectedIndex] : null}
                            sessionId={pane.sessionId}
                            isActive={idx === activePaneIndex}
                            isSplit={isSplit}
                            wsPort={wsPort}
                            paneIndex={idx}
                            onActivate={() => onActivatePane(idx)}
                            onConnect={() => onConnectPane(idx)}
                            onDisconnect={() => onDisconnectPane(idx)}
                            onSessionEnded={() => onSessionEnded(idx)}
                            onClose={onUnsplit}
                            onFitReady={(fn) => onFitReady(idx, fn)}
                        />
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
