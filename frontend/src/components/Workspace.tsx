import React from 'react'
import { Connection, Pane, Orientation } from '../types'
import PaneView from './Pane'

interface Props {
    panes: Pane[]
    activePaneIndex: number
    orientation: Orientation
    connections: Connection[]
    wsPort: number
    onActivatePane: (i: number) => void
    onConnectPane: (i: number) => void
    onDisconnectPane: (i: number) => void
    onSessionEnded: (i: number) => void
    onAddPane: () => void
    onRemovePane: (i: number) => void
    onToggleOrientation: () => void
    onEdit: () => void
    onDelete: () => void
    onFitReady: (paneIdx: number, fn: () => void) => void
}

function getGridStyle(count: number, orientation: Orientation): React.CSSProperties {
    if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
    if (count === 2) {
        return orientation === 'horizontal'
            ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
            : { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' }
    }
    // 3 or 4: 2x2 grid
    return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
}

function getPaneCellStyle(count: number, idx: number): React.CSSProperties {
    // 3-pane layout: pane 0 spans the left column (both rows)
    if (count === 3 && idx === 0) return { gridRow: '1 / 3' }
    return {}
}

export default function Workspace({
    panes, activePaneIndex, orientation, connections, wsPort,
    onActivatePane, onConnectPane, onDisconnectPane, onSessionEnded,
    onAddPane, onRemovePane, onToggleOrientation,
    onEdit, onDelete, onFitReady,
}: Props) {
    const activePane = panes[activePaneIndex] ?? panes[0]
    const activeConn = activePane && activePane.selectedIndex >= 0
        ? connections[activePane.selectedIndex]
        : null
    const count = panes.length
    const isSplit = count > 1

    return (
        <div id="workspace">
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
                    {/* Connect / Disconnect — only when single pane */}
                    {!isSplit && (
                        activePane?.sessionId ? (
                            <button className="btn-icon" title="Disconnect" onClick={() => onDisconnectPane(0)}>
                                <i className="ri-stop-fill"></i>
                            </button>
                        ) : (
                            <button className="btn-icon" title="Connect" disabled={!activeConn} onClick={() => onConnectPane(0)}>
                                <i className="ri-play-fill"></i>
                            </button>
                        )
                    )}

                    {/* Orientation toggle — only when exactly 2 panes */}
                    {count === 2 && (
                        <button className="btn-icon" title={orientation === 'horizontal' ? 'Switch to vertical split' : 'Switch to horizontal split'} onClick={onToggleOrientation}>
                            <i className={orientation === 'horizontal' ? 'ri-layout-row-line' : 'ri-layout-column-line'}></i>
                        </button>
                    )}

                    {/* Add pane */}
                    <button className="btn-icon" title="Add terminal pane" disabled={count >= 4} onClick={onAddPane}>
                        <i className="ri-add-box-line"></i>
                    </button>

                    <button className="btn-icon" title="Edit connection" disabled={!activeConn} onClick={onEdit}>
                        <i className="ri-settings-3-line"></i>
                    </button>
                    <button className="btn-icon btn-icon-danger" title="Delete connection" disabled={!activeConn} onClick={onDelete}>
                        <i className="ri-delete-bin-6-line"></i>
                    </button>
                </div>
            </div>

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

            <div className="pane-grid" style={getGridStyle(count, orientation)}>
                {panes.map((pane, idx) => (
                    <PaneView
                        key={idx}
                        connection={pane.selectedIndex >= 0 ? connections[pane.selectedIndex] : null}
                        sessionId={pane.sessionId}
                        isActive={idx === activePaneIndex}
                        showHeader={isSplit}
                        wsPort={wsPort}
                        paneIndex={idx}
                        paneCount={count}
                        cellStyle={getPaneCellStyle(count, idx)}
                        onActivate={() => onActivatePane(idx)}
                        onConnect={() => onConnectPane(idx)}
                        onDisconnect={() => onDisconnectPane(idx)}
                        onSessionEnded={() => onSessionEnded(idx)}
                        onClose={() => onRemovePane(idx)}
                        onFitReady={(fn) => onFitReady(idx, fn)}
                    />
                ))}
            </div>
        </div>
    )
}
