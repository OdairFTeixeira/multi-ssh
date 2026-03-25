import React from 'react'

interface Props {
    connectionName: string
    onClose: () => void
    onConfirm: () => void
}

export default function DeleteModal({ connectionName, onClose, onConfirm }: Props) {
    return (
        <div className="modal">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content modal-sm">
                <div className="modal-header">
                    <h2>Delete Connection</h2>
                </div>
                <div className="modal-body">
                    <p>Delete <strong>{connectionName}</strong>? This can't be undone.</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    )
}
