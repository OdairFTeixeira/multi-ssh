import React, { useState, useEffect, useRef } from 'react'
import { Connection } from '../types'

interface FormState {
    name: string
    host: string
    port: number | string
    user: string
    identity_key: string
    password: string
    group: string
    description: string
    tags: string
}

interface Props {
    editingIndex: number
    connection: Connection | null
    onClose: () => void
    onSave: (c: Connection) => void
}

const EMPTY: FormState = { name: '', host: '', port: 22, user: '', identity_key: '', password: '', group: '', description: '', tags: '' }

export default function Modal({ editingIndex, connection, onClose, onSave }: Props) {
    const [form, setForm] = useState<FormState>(EMPTY)
    const nameRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (connection) {
            setForm({
                name:         connection.name || '',
                host:         connection.host || '',
                port:         connection.port || 22,
                user:         connection.user || '',
                identity_key: connection.identity_key || '',
                password:     connection.password || '',
                group:        connection.group || '',
                description:  connection.description || '',
                tags:         (connection.tags || []).join(', '),
            })
        } else {
            setForm(EMPTY)
        }
        setTimeout(() => nameRef.current?.focus(), 50)
    }, [editingIndex])

    function set(field: keyof FormState) {
        return (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(f => ({ ...f, [field]: e.target.value }))
    }

    function handleSave() {
        if (!form.name.trim() || !form.host.trim()) return
        const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
        onSave({
            name:         form.name.trim(),
            host:         form.host.trim(),
            port:         parseInt(String(form.port)) || 22,
            user:         form.user.trim() || 'root',
            identity_key: form.identity_key.trim(),
            password:     form.password,
            group:        form.group.trim(),
            description:  form.description.trim(),
            tags,
        })
    }

    return (
        <div className="modal">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editingIndex >= 0 ? 'Edit Connection' : 'New Connection'}</h2>
                    <button className="btn-close" onClick={onClose}><i className="ri-close-line"></i></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name <span className="req">*</span></label>
                            <input ref={nameRef} value={form.name} onChange={set('name')} placeholder="Production API" required autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group">
                            <label>Group</label>
                            <input value={form.group} onChange={set('group')} placeholder="Production" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group f2">
                            <label>Host <span className="req">*</span></label>
                            <input value={form.host} onChange={set('host')} placeholder="192.168.1.100" required autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group f1">
                            <label>Port</label>
                            <input type="number" value={form.port} onChange={set('port')} placeholder="22" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>User</label>
                            <input value={form.user} onChange={set('user')} placeholder="root" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group">
                            <label>Identity Key</label>
                            <input value={form.identity_key} onChange={set('identity_key')} placeholder="~/.ssh/id_rsa" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>
                            Password{' '}
                            <span className="hint warn">
                                <i className="ri-error-warning-line"></i> insecure — stored in plain text
                            </span>
                        </label>
                        <input type="password" value={form.password} onChange={set('password')} placeholder="Leave empty to use key or prompt" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input value={form.description} onChange={set('description')} placeholder="Main web server" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                    </div>
                    <div className="form-group">
                        <label>Tags <span className="hint">comma separated</span></label>
                        <input value={form.tags} onChange={set('tags')} placeholder="web, nginx" autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleSave()} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    )
}
