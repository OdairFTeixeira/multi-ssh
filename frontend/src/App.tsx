import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GetConnections, AddConnection, UpdateConnection, DeleteConnection, StartSSHSession, StopSSHSession, GetWSPort } from '../wailsjs/go/main/App'
import { model } from '../wailsjs/go/models'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import Modal from './components/Modal'
import DeleteModal from './components/DeleteModal'

type Connection = model.Connection

export default function App() {
    const [connections, setConnections] = useState<Connection[]>([])
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [wsPort, setWsPort] = useState<number>(0)
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [editingIndex, setEditingIndex] = useState<number>(-1)
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
    const [search, setSearch] = useState<string>('')

    const termFitRef = useRef<(() => void) | null>(null)

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
            if (currentSessionId && target.closest?.('#terminal')) return

            switch (e.key) {
                case 'Escape':
                    if (modalOpen) closeModal()
                    else if (deleteModalOpen) setDeleteModalOpen(false)
                    break
                case 'n': openAddModal(); break
                case '/': e.preventDefault(); (document.querySelector('#searchInput') as HTMLInputElement)?.focus(); break
                case 'ArrowDown': case 'j':
                    e.preventDefault()
                    if (connections.length) selectConnection(Math.min(selectedIndex + 1, connections.length - 1))
                    break
                case 'ArrowUp': case 'k':
                    e.preventDefault()
                    if (connections.length) selectConnection(Math.max(selectedIndex - 1, 0))
                    break
                case 'Enter':
                    if (selectedIndex >= 0 && !currentSessionId) connect()
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
    }, [connections, selectedIndex, currentSessionId, modalOpen, deleteModalOpen])

    async function loadConnections() {
        try {
            const list = await GetConnections() || []
            setConnections(list)
            setSelectedIndex(i => {
                if (i < 0 && list.length > 0) return 0
                if (i >= list.length) return list.length - 1
                return i
            })
        } catch (e) {
            console.error('Load failed:', e)
        }
    }

    const selectConnection = useCallback((i: number) => {
        setSelectedIndex(prev => {
            if (prev !== i && currentSessionId) disconnect()
            return i
        })
    }, [currentSessionId])

    const connect = useCallback(async () => {
        if (selectedIndex < 0 || currentSessionId) return
        try {
            const sessionId = await StartSSHSession(selectedIndex)
            setCurrentSessionId(sessionId)
        } catch (e) {
            console.error('Connect failed:', e)
        }
    }, [selectedIndex, currentSessionId])

    const disconnect = useCallback(() => {
        if (currentSessionId) StopSSHSession(currentSessionId)
        setCurrentSessionId(null)
    }, [currentSessionId])

    const onSessionEnded = useCallback(() => {
        setCurrentSessionId(null)
    }, [])

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(v => !v)
        setTimeout(() => termFitRef.current?.(), 210)
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
            if (sel >= 0) setSelectedIndex(sel)
        } catch (e) {
            console.error('Save error:', e)
        }
    }

    async function deleteConnection() {
        if (selectedIndex < 0) return
        try {
            disconnect()
            await DeleteConnection(selectedIndex)
            setDeleteModalOpen(false)
            setSelectedIndex(-1)
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
                onDoubleClick={(i) => { selectConnection(i); connect() }}
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
                        connection={selectedConn}
                        currentSessionId={currentSessionId}
                        wsPort={wsPort}
                        onConnect={connect}
                        onDisconnect={disconnect}
                        onSessionEnded={onSessionEnded}
                        onEdit={() => selectedIndex >= 0 && openEditModal(selectedIndex)}
                        onDelete={() => setDeleteModalOpen(true)}
                        onFitReady={(fn) => { termFitRef.current = fn }}
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
