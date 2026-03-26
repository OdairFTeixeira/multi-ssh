import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    GetConnections, AddConnection, UpdateConnection, DeleteConnection,
    StartSSHSession, StopSSHSession, GetWSPort,
} from '../wailsjs/go/main/App'
import { model } from '../wailsjs/go/models'
import { Pane, SplitMode } from './types'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import Modal from './components/Modal'
import DeleteModal from './components/DeleteModal'

type Connection = model.Connection

export default function App() {
    const [connections, setConnections] = useState<Connection[]>([])
    const [panes, setPanes] = useState<Pane[]>([{ selectedIndex: -1, sessionId: null }])
    const [activePaneIndex, setActivePaneIndex] = useState(0)
    const [splitMode, setSplitMode] = useState<SplitMode>('none')
    const [wsPort, setWsPort] = useState(0)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState(-1)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [search, setSearch] = useState('')

    const termFitRefs = useRef<Array<(() => void) | null>>([null, null])

    const activePane = panes[activePaneIndex] ?? panes[0]
    const selectedIndex = activePane?.selectedIndex ?? -1
    const currentSessionId = activePane?.sessionId ?? null

    useEffect(() => {
        GetWSPort().then(setWsPort)
        loadConnections()
    }, [])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT') {
                if (e.key === 'Escape') {
                    if (modalOpen) closeModal()
                    else if (deleteModalOpen) setDeleteModalOpen(false)
                    else { target.blur(); setSearch('') }
                }
                return
            }
            if (currentSessionId && target.closest?.('.terminal-inner')) return

            switch (e.key) {
                case 'Escape':
                    if (modalOpen) closeModal()
                    else if (deleteModalOpen) setDeleteModalOpen(false)
                    break
                case 'n': openAddModal(); break
                case '/':
                    e.preventDefault()
                    ;(document.querySelector('#searchInput') as HTMLInputElement)?.focus()
                    break
                case 'ArrowDown': case 'j':
                    e.preventDefault()
                    if (connections.length) selectConnection(Math.min(selectedIndex + 1, connections.length - 1))
                    break
                case 'ArrowUp': case 'k':
                    e.preventDefault()
                    if (connections.length) selectConnection(Math.max(selectedIndex - 1, 0))
                    break
                case 'Enter':
                    if (selectedIndex >= 0 && !currentSessionId) connectPane(activePaneIndex)
                    break
                case 'e':
                    if (selectedIndex >= 0) openEditModal(selectedIndex)
                    break
                case 'd': case 'Delete':
                    if (selectedIndex >= 0) setDeleteModalOpen(true)
                    break
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [connections, selectedIndex, currentSessionId, modalOpen, deleteModalOpen, activePaneIndex])

    async function loadConnections() {
        try {
            const list = await GetConnections() || []
            setConnections(list)
            setPanes(prev => prev.map(p => ({
                ...p,
                selectedIndex:
                    p.selectedIndex < 0 && list.length > 0 ? 0 :
                    p.selectedIndex >= list.length ? list.length - 1 :
                    p.selectedIndex,
            })))
        } catch (e) {
            console.error('Load failed:', e)
        }
    }

    const selectConnection = useCallback((i: number) => {
        setPanes(prev => {
            const next = [...prev]
            const pane = next[activePaneIndex]
            if (!pane) return prev
            if (pane.selectedIndex !== i && pane.sessionId) {
                StopSSHSession(pane.sessionId)
                next[activePaneIndex] = { selectedIndex: i, sessionId: null }
            } else {
                next[activePaneIndex] = { ...pane, selectedIndex: i }
            }
            return next
        })
    }, [activePaneIndex])

    const connectPane = useCallback(async (paneIdx: number) => {
        const pane = panes[paneIdx]
        if (!pane || pane.selectedIndex < 0 || pane.sessionId) return
        try {
            const sessionId = await StartSSHSession(pane.selectedIndex)
            setPanes(prev => {
                const next = [...prev]
                if (next[paneIdx]) next[paneIdx] = { ...next[paneIdx], sessionId }
                return next
            })
        } catch (e) {
            console.error('Connect failed:', e)
        }
    }, [panes])

    const doubleClickConnect = useCallback(async (i: number) => {
        const pane = panes[activePaneIndex]
        if (pane?.sessionId) StopSSHSession(pane.sessionId)
        setPanes(prev => {
            const next = [...prev]
            next[activePaneIndex] = { selectedIndex: i, sessionId: null }
            return next
        })
        try {
            const sessionId = await StartSSHSession(i)
            setPanes(prev => {
                const next = [...prev]
                if (next[activePaneIndex]) {
                    next[activePaneIndex] = { ...next[activePaneIndex], selectedIndex: i, sessionId }
                }
                return next
            })
        } catch (e) {
            console.error('Connect failed:', e)
        }
    }, [activePaneIndex, panes])

    const disconnectPane = useCallback((paneIdx: number) => {
        const pane = panes[paneIdx]
        if (pane?.sessionId) StopSSHSession(pane.sessionId)
        setPanes(prev => {
            const next = [...prev]
            if (next[paneIdx]) next[paneIdx] = { ...next[paneIdx], sessionId: null }
            return next
        })
    }, [panes])

    const onSessionEnded = useCallback((paneIdx: number) => {
        setPanes(prev => {
            const next = [...prev]
            if (next[paneIdx]) next[paneIdx] = { ...next[paneIdx], sessionId: null }
            return next
        })
    }, [])

    const splitPane = useCallback(async (mode: 'horizontal' | 'vertical') => {
        setSplitMode(mode)
        const connIdx = panes[0]?.selectedIndex ?? -1
        let sessionId: string | null = null
        if (connIdx >= 0) {
            try { sessionId = await StartSSHSession(connIdx) } catch { /* ignore */ }
        }
        setPanes(prev => {
            if (prev.length >= 2) return prev
            return [...prev, { selectedIndex: connIdx, sessionId }]
        })
    }, [panes])

    const unsplit = useCallback(() => {
        const second = panes[1]
        if (second?.sessionId) StopSSHSession(second.sessionId)
        setSplitMode('none')
        setPanes(prev => [prev[0]])
        setActivePaneIndex(0)
    }, [panes])

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(v => !v)
        setTimeout(() => { termFitRefs.current.forEach(fn => fn?.()) }, 210)
    }, [])

    const handleFitReady = useCallback((paneIdx: number, fn: () => void) => {
        termFitRefs.current[paneIdx] = fn
    }, [])

    function openAddModal() { setEditingIndex(-1); setModalOpen(true) }
    function openEditModal(i: number) { setEditingIndex(i); setModalOpen(true) }
    function closeModal() { setModalOpen(false); setEditingIndex(-1) }

    async function saveConnection(formData: Connection) {
        try {
            if (editingIndex >= 0) {
                await UpdateConnection(editingIndex, formData)
            } else {
                await AddConnection(formData)
            }
            const sel = editingIndex
            closeModal()
            await loadConnections()
            if (sel >= 0) setPanes(prev => {
                const next = [...prev]
                next[activePaneIndex] = { ...next[activePaneIndex], selectedIndex: sel }
                return next
            })
        } catch (e) {
            console.error('Save error:', e)
        }
    }

    async function deleteConnection() {
        if (selectedIndex < 0) return
        try {
            panes.forEach(p => { if (p.sessionId) StopSSHSession(p.sessionId) })
            await DeleteConnection(selectedIndex)
            setDeleteModalOpen(false)
            setPanes([{ selectedIndex: -1, sessionId: null }])
            setSplitMode('none')
            setActivePaneIndex(0)
            await loadConnections()
        } catch (e) {
            console.error('Delete error:', e)
        }
    }

    const selectedConn = selectedIndex >= 0 ? connections[selectedIndex] : null

    return (
        <div id="app">
            <Sidebar
                connections={connections}
                selectedIndex={selectedIndex}
                search={search}
                collapsed={sidebarCollapsed}
                onSelect={selectConnection}
                onDoubleClick={doubleClickConnect}
                onAdd={openAddModal}
                onToggleCollapse={toggleSidebar}
                onSearchChange={setSearch}
            />

            <main id="mainContent">
                {connections.length === 0 ? (
                    <div className="empty-state" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
                        <div className="empty-icon"><i className="ri-terminal-box-line"></i></div>
                        <h2>No connections</h2>
                        <p>Add a server to get started.</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <i className="ri-add-line"></i> New Connection
                        </button>
                    </div>
                ) : (
                    <Workspace
                        panes={panes}
                        activePaneIndex={activePaneIndex}
                        splitMode={splitMode}
                        connections={connections}
                        wsPort={wsPort}
                        onActivatePane={setActivePaneIndex}
                        onConnectPane={connectPane}
                        onDisconnectPane={disconnectPane}
                        onSessionEnded={onSessionEnded}
                        onSplit={splitPane}
                        onUnsplit={unsplit}
                        onEdit={() => selectedIndex >= 0 && openEditModal(selectedIndex)}
                        onDelete={() => setDeleteModalOpen(true)}
                        onFitReady={handleFitReady}
                    />
                )}
            </main>

            {modalOpen && (
                <Modal
                    editingIndex={editingIndex}
                    connection={editingIndex >= 0 ? connections[editingIndex] : null}
                    onClose={closeModal}
                    onSave={saveConnection}
                />
            )}

            {deleteModalOpen && (
                <DeleteModal
                    connectionName={selectedConn?.name ?? ''}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={deleteConnection}
                />
            )}
        </div>
    )
}
