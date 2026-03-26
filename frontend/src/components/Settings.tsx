import React from 'react'

const PRESETS = [
    { label: 'Black',    value: '#000000' },
    { label: 'GitHub',   value: '#0d1117' },
    { label: 'VS Code',  value: '#1e1e1e' },
    { label: 'Midnight', value: '#0a0a1a' },
    { label: 'Forest',   value: '#001a00' },
    { label: 'Navy',     value: '#000d1a' },
]

interface Props {
    termBgColor: string
    onTermBgColorChange: (color: string) => void
    onClose: () => void
}

export default function Settings({ termBgColor, onTermBgColorChange, onClose }: Props) {
    return (
        <div className="modal">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content modal-sm">
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="btn-close" onClick={onClose}><i className="ri-close-line"></i></button>
                </div>
                <div className="modal-body">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Terminal Background</label>
                        <div className="color-picker-row">
                            <input
                                type="color"
                                value={termBgColor}
                                onChange={e => onTermBgColorChange(e.target.value)}
                                className="color-input"
                            />
                            <span className="color-value">{termBgColor}</span>
                        </div>
                        <div className="color-presets">
                            {PRESETS.map(p => (
                                <button
                                    key={p.value}
                                    className={'color-preset' + (termBgColor === p.value ? ' active' : '')}
                                    style={{ background: p.value }}
                                    title={p.label}
                                    onClick={() => onTermBgColorChange(p.value)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    )
}
