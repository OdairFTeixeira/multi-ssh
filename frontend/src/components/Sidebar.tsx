import React from 'react'
import { Connection } from '../types'

interface Props {
    connections: Connection[]
    selectedIndex: number
    search: string
    collapsed: boolean
    onSelect: (i: number) => void
    onDoubleClick: (i: number) => void
    onAdd: () => void
    onToggleCollapse: () => void
    onSearchChange: (v: string) => void
    onOpenSettings: () => void
}

function matches(c: Connection, q: string): boolean {
    return (c.name || '').toLowerCase().includes(q)
        || (c.host || '').toLowerCase().includes(q)
        || (c.group || '').toLowerCase().includes(q)
        || (c.description || '').toLowerCase().includes(q)
}

export default function Sidebar({ connections, selectedIndex, search, collapsed, onSelect, onDoubleClick, onAdd, onToggleCollapse, onSearchChange, onOpenSettings }: Props) {
    const q = search.toLowerCase()

    const groups: Record<string, { c: Connection; i: number }[]> = {}
    connections.forEach((c, i) => {
        if (q && !matches(c, q)) return
        const g = c.group || 'Ungrouped'
        if (!groups[g]) groups[g] = []
        groups[g].push({ c, i })
    })

    const sortedGroups = Object.keys(groups).sort((a, b) => {
        if (a === 'Ungrouped') return 1
        if (b === 'Ungrouped') return -1
        return a.localeCompare(b)
    })

    return (
        <aside id="sidebar" className={collapsed ? 'collapsed' : ''}>
            <div className="sidebar-header" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
                <span className="app-title">Multi SSH</span>
                <button
                    id="btnToggleSidebar"
                    onClick={onToggleCollapse}
                    title="Toggle sidebar"
                    style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
                >
                    <i className="ri-sidebar-fold-line"></i>
                </button>
            </div>

            <div className="sidebar-search">
                <input
                    id="searchInput"
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>

            <nav className="connection-list">
                {sortedGroups.map(gName => (
                    <React.Fragment key={gName}>
                        <div className="group-label">{gName}</div>
                        {groups[gName].map(({ c, i }) => (
                            <div
                                key={i}
                                className={'conn-item' + (i === selectedIndex ? ' active' : '')}
                                onClick={() => onSelect(i)}
                                onDoubleClick={() => onDoubleClick(i)}
                            >
                                <div className="conn-dot"></div>
                                <div className="conn-info">
                                    <div className="conn-name">{c.name}</div>
                                    <div className="conn-host">{c.user || 'root'}@{c.host}</div>
                                </div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
                {sortedGroups.length === 0 && q && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                        No results
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <button className="btn-add" id="btnAdd" title="New Connection" onClick={onAdd}>
                    <i className="ri-add-line"></i>
                </button>
                <span className="conn-count">
                    {connections.length} connection{connections.length !== 1 ? 's' : ''}
                </span>
                <button className="btn-settings" title="Settings" onClick={onOpenSettings}>
                    <i className="ri-settings-3-line"></i>
                </button>
            </div>
        </aside>
    )
}
