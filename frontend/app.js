// Multi SSH — Desktop App
(function () {
    'use strict';

    // ── State ──
    let connections = [];
    let selectedIndex = -1;
    let editingIndex = -1;
    let currentSessionId = null;
    let wsPort = 0;
    let term = null;
    let fitAddon = null;
    let ws = null;
    let termDataDisposable = null;

    // ── DOM ──
    const $ = (s) => document.querySelector(s);
    const connectionList = $('#connectionList');
    const emptyState = $('#emptyState');
    const workspace = $('#workspace');
    const searchInput = $('#searchInput');
    const connCount = $('#connCount');
    const modal = $('#modal');
    const deleteModal = $('#deleteModal');

    // ── Init ──
    async function init() {
        wsPort = await window.go.main.App.GetWSPort();
        await loadConnections();
        bindEvents();
    }

    // ── Data ──
    async function loadConnections() {
        try {
            connections = await window.go.main.App.GetConnections() || [];
            render();
        } catch (e) {
            console.error('Load failed:', e);
        }
    }

    // ── Render ──
    function render() {
        renderList(searchInput.value);
        connCount.textContent = `${connections.length} connection${connections.length !== 1 ? 's' : ''}`;

        if (connections.length === 0) {
            emptyState.style.display = 'flex';
            workspace.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            if (selectedIndex < 0) selectedIndex = 0;
            if (selectedIndex >= connections.length) selectedIndex = connections.length - 1;
            showWorkspace(selectedIndex);
        }
    }

    function renderList(filter = '') {
        connectionList.innerHTML = '';
        const q = filter.toLowerCase();

        // Group connections
        const groups = {};
        connections.forEach((c, i) => {
            if (q && !matches(c, q)) return;
            const g = c.group || 'Ungrouped';
            if (!groups[g]) groups[g] = [];
            groups[g].push({ c, i });
        });

        const sorted = Object.keys(groups).sort((a, b) => {
            if (a === 'Ungrouped') return 1;
            if (b === 'Ungrouped') return -1;
            return a.localeCompare(b);
        });

        for (const gName of sorted) {
            const label = document.createElement('div');
            label.className = 'group-label';
            label.textContent = gName;
            connectionList.appendChild(label);

            for (const { c, i } of groups[gName]) {
                const el = document.createElement('div');
                el.className = 'conn-item' + (i === selectedIndex ? ' active' : '');
                el.innerHTML = `
                    <div class="conn-dot"></div>
                    <div class="conn-info">
                        <div class="conn-name">${esc(c.name)}</div>
                        <div class="conn-host">${esc(c.user || 'root')}@${esc(c.host)}</div>
                    </div>`;
                el.addEventListener('click', () => selectConnection(i));
                el.addEventListener('dblclick', () => { selectConnection(i); connect(); });
                connectionList.appendChild(el);
            }
        }

        if (connectionList.children.length === 0 && q) {
            connectionList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:12px;">No results</div>`;
        }
    }

    function matches(c, q) {
        return (c.name || '').toLowerCase().includes(q)
            || (c.host || '').toLowerCase().includes(q)
            || (c.group || '').toLowerCase().includes(q)
            || (c.description || '').toLowerCase().includes(q);
    }

    function selectConnection(i) {
        // Disconnect previous session if switching connections
        if (selectedIndex !== i && currentSessionId) {
            disconnect();
        }
        selectedIndex = i;
        render();
    }

    function showWorkspace(i) {
        if (i < 0 || i >= connections.length) return;
        workspace.style.display = 'flex';

        const c = connections[i];
        const port = c.port || 22;

        $('#detailName').textContent = c.name;
        $('#topbarHost').textContent = `${c.user || 'root'}@${c.host}:${port}`;
        $('#detailHost').textContent = c.host;
        $('#detailPort').textContent = port;
        $('#detailUser').textContent = c.user || 'root';

        const keyPill = $('#keyPill');
        if (c.identity_key) {
            keyPill.style.display = 'flex';
            $('#detailKey').textContent = c.identity_key;
        } else {
            keyPill.style.display = 'none';
        }

        // Show/hide connect/disconnect
        if (currentSessionId) {
            $('#btnConnect').style.display = 'none';
            $('#btnDisconnect').style.display = 'flex';
        } else {
            $('#btnConnect').style.display = 'flex';
            $('#btnDisconnect').style.display = 'none';
        }

        // Lazy-init terminal once workspace is visible
        if (!term) {
            // Use requestAnimationFrame to ensure DOM is laid out
            requestAnimationFrame(() => {
                initTerminal();
            });
        } else {
            // Re-fit in case size changed
            requestAnimationFrame(() => {
                try { fitAddon.fit(); } catch (e) {}
            });
        }
    }

    // ── Terminal ──
    function initTerminal() {
        if (term) return;
        term = new Terminal({
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            theme: {
                background: '#000000',
                foreground: '#f5f5f7',
                cursor: '#f5f5f7',
                selectionBackground: 'rgba(10, 132, 255, 0.3)',
                black:   '#1c1c1e',
                red:     '#ff453a',
                green:   '#30d158',
                yellow:  '#ffd60a',
                blue:    '#0a84ff',
                magenta: '#bf5af2',
                cyan:    '#64d2ff',
                white:   '#f5f5f7',
                brightBlack:   '#636366',
                brightRed:     '#ff6961',
                brightGreen:   '#4cd964',
                brightYellow:  '#ffcc00',
                brightBlue:    '#409cff',
                brightMagenta: '#da8aff',
                brightCyan:    '#70d7ff',
                brightWhite:   '#ffffff',
            },
        });

        fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);

        try {
            const webLinksAddon = new WebLinksAddon.WebLinksAddon();
            term.loadAddon(webLinksAddon);
        } catch (e) { /* optional */ }

        term.open($('#terminal'));
        setTimeout(() => {
            try { fitAddon.fit(); } catch (e) {}
        }, 100);

        // Resize observer
        const ro = new ResizeObserver(() => {
            if (fitAddon) {
                try { fitAddon.fit(); } catch (e) { /* ignore */ }
                sendResize();
            }
        });
        ro.observe($('#terminalContainer'));
    }

    function ensureTerminal() {
        return new Promise((resolve) => {
            if (term) { resolve(); return; }
            initTerminal();
            // Give xterm a moment to render
            setTimeout(resolve, 150);
        });
    }

    async function connect() {
        if (selectedIndex < 0 || currentSessionId) return;

        await ensureTerminal();

        term.clear();
        term.write('\x1b[90mConnecting...\x1b[0m\r\n');
        $('#terminalPlaceholder').style.display = 'none';

        try {
            const sessionId = await window.go.main.App.StartSSHSession(selectedIndex);
            currentSessionId = sessionId;

            const wsUrl = `ws://127.0.0.1:${wsPort}/ws/terminal?id=${sessionId}`;
            ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                term.clear();
                sendResize();
                term.focus();
            };

            ws.onmessage = (e) => {
                if (e.data instanceof ArrayBuffer) {
                    term.write(new Uint8Array(e.data));
                } else {
                    term.write(e.data);
                }
            };

            ws.onclose = () => {
                currentSessionId = null;
                showWorkspace(selectedIndex);
            };

            ws.onerror = () => {
                term.write('\r\n\x1b[31mConnection error.\x1b[0m\r\n');
                currentSessionId = null;
                showWorkspace(selectedIndex);
            };

            // Dispose previous listener if any
            if (termDataDisposable) {
                termDataDisposable.dispose();
                termDataDisposable = null;
            }
            termDataDisposable = term.onData((data) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });

            showWorkspace(selectedIndex);
        } catch (e) {
            term.write(`\r\n\x1b[31mFailed: ${e}\x1b[0m\r\n`);
        }
    }

    function disconnect() {
        if (currentSessionId) {
            window.go.main.App.StopSSHSession(currentSessionId);
        }
        if (termDataDisposable) {
            termDataDisposable.dispose();
            termDataDisposable = null;
        }
        if (ws) {
            ws.close();
            ws = null;
        }
        currentSessionId = null;
        if (term) {
            term.reset();
        }
        $('#terminalPlaceholder').style.display = 'flex';
        showWorkspace(selectedIndex);
    }

    function sendResize() {
        if (!ws || ws.readyState !== WebSocket.OPEN || !term) return;
        const msg = '\x01' + term.cols + ',' + term.rows;
        ws.send(msg);
    }

    // ── Modal ──
    function openAddModal() {
        editingIndex = -1;
        $('#modalTitle').textContent = 'New Connection';
        clearForm();
        $('#formPort').value = '22';
        modal.style.display = 'flex';
        setTimeout(() => $('#formName').focus(), 50);
    }

    function openEditModal(i) {
        editingIndex = i;
        const c = connections[i];
        $('#modalTitle').textContent = 'Edit Connection';
        $('#formName').value = c.name || '';
        $('#formHost').value = c.host || '';
        $('#formPort').value = c.port || 22;
        $('#formUser').value = c.user || '';
        $('#formKey').value = c.identity_key || '';
        $('#formPassword').value = c.password || '';
        $('#formGroup').value = c.group || '';
        $('#formDescription').value = c.description || '';
        $('#formTags').value = (c.tags || []).join(', ');
        modal.style.display = 'flex';
        setTimeout(() => $('#formName').focus(), 50);
    }

    function closeModal() {
        modal.style.display = 'none';
        clearForm();
    }

    function clearForm() {
        ['formName','formHost','formPort','formUser','formKey','formPassword','formGroup','formDescription','formTags']
            .forEach(id => { const el = $(`#${id}`); el.value = id === 'formPort' ? '22' : ''; });
    }

    async function saveConnection() {
        const name = $('#formName').value.trim();
        const host = $('#formHost').value.trim();
        if (!name || !host) return;

        const tags = $('#formTags').value.trim();
        const conn = {
            name,
            host,
            port: parseInt($('#formPort').value) || 22,
            user: $('#formUser').value.trim() || 'root',
            identity_key: $('#formKey').value.trim(),
            password: $('#formPassword').value,
            group: $('#formGroup').value.trim(),
            description: $('#formDescription').value.trim(),
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        };

        try {
            if (editingIndex >= 0) {
                await window.go.main.App.UpdateConnection(editingIndex, conn);
            } else {
                await window.go.main.App.AddConnection(conn);
            }
            closeModal();
            const sel = editingIndex >= 0 ? editingIndex : -1;
            await loadConnections();
            if (sel >= 0) selectConnection(sel);
            else if (connections.length > 0) selectConnection(connections.length - 1);
        } catch (e) {
            console.error('Save error:', e);
        }
    }

    // ── Delete ──
    function openDeleteModal() {
        if (selectedIndex < 0) return;
        $('#deleteConnName').textContent = connections[selectedIndex].name;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() { deleteModal.style.display = 'none'; }

    async function deleteConnection() {
        if (selectedIndex < 0) return;
        try {
            disconnect();
            await window.go.main.App.DeleteConnection(selectedIndex);
            closeDeleteModal();
            selectedIndex = -1;
            await loadConnections();
        } catch (e) {
            console.error('Delete error:', e);
        }
    }

    // ── Events ──
    function bindEvents() {
        searchInput.addEventListener('input', e => renderList(e.target.value));

        $('#btnAdd').addEventListener('click', openAddModal);
        $('#btnAddEmpty').addEventListener('click', openAddModal);
        $('#btnConnect').addEventListener('click', connect);
        $('#btnDisconnect').addEventListener('click', disconnect);
        $('#btnEdit').addEventListener('click', () => { if (selectedIndex >= 0) openEditModal(selectedIndex); });
        $('#btnDelete').addEventListener('click', openDeleteModal);

        $('#modalClose').addEventListener('click', closeModal);
        $('#modalBackdrop').addEventListener('click', closeModal);
        $('#btnCancel').addEventListener('click', closeModal);
        $('#btnSave').addEventListener('click', saveConnection);

        $('#deleteModalBackdrop').addEventListener('click', closeDeleteModal);
        $('#btnDeleteCancel').addEventListener('click', closeDeleteModal);
        $('#btnDeleteConfirm').addEventListener('click', deleteConnection);

        $('#connectionForm').addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); saveConnection(); }
        });

        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT') {
                if (e.key === 'Escape') {
                    if (modal.style.display !== 'none') closeModal();
                    else if (deleteModal.style.display !== 'none') closeDeleteModal();
                    else { e.target.blur(); searchInput.value = ''; renderList(); }
                }
                return;
            }

            // Don't capture keys while terminal is focused
            if (currentSessionId && document.activeElement?.closest('#terminal')) return;

            switch (e.key) {
                case 'Escape':
                    if (modal.style.display !== 'none') closeModal();
                    else if (deleteModal.style.display !== 'none') closeDeleteModal();
                    break;
                case 'n': openAddModal(); break;
                case '/': e.preventDefault(); searchInput.focus(); break;
                case 'ArrowDown': case 'j':
                    e.preventDefault();
                    if (connections.length) selectConnection(Math.min(selectedIndex + 1, connections.length - 1));
                    break;
                case 'ArrowUp': case 'k':
                    e.preventDefault();
                    if (connections.length) selectConnection(Math.max(selectedIndex - 1, 0));
                    break;
                case 'Enter':
                    if (selectedIndex >= 0 && !currentSessionId) connect();
                    break;
                case 'e':
                    if (selectedIndex >= 0) openEditModal(selectedIndex);
                    break;
                case 'd': case 'Delete':
                    if (selectedIndex >= 0) openDeleteModal();
                    break;
            }
        });
    }

    // ── Helpers ──
    function esc(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // ── Start ──
    document.addEventListener('DOMContentLoaded', init);
})();
