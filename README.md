# Multi SSH

A beautiful desktop SSH connection manager built with Go + Wails.

![License](https://img.shields.io/github/license/odair/multi-ssh)
![Go](https://img.shields.io/badge/go-1.21%2B-00ADD8?logo=go)
![Wails](https://img.shields.io/badge/wails-v2-red?logo=go)
![Platform](https://img.shields.io/badge/platform-linux%20%7C%20windows-blue)

## Features

- **Dark UI** — Modern desktop interface with Apple-inspired dark theme
- **Connection Management** — Add, edit, delete SSH connections with full metadata
- **Search & Filter** — Instantly search by name, host, group, or description
- **Groups** — Organize connections into logical groups with collapsible sections
- **Tags** — Tag connections for easy categorization
- **Identity Keys** — SSH key-based authentication support
- **Password Auth** — Password-based auth via `sshpass`
- **Embedded Terminal** — Full xterm.js terminal directly in the app
- **Keyboard-driven** — Vim-style navigation, no mouse required
- **YAML Config** — Human-readable config at `~/.multi-ssh/connections.yaml`
- **Native Performance** — Go backend + native WebKit (no Electron)

## Screenshots

> _Screenshots coming soon. Run `make dev` to see it live._

## Installation

### Download a Release

Download the latest binary from the [Releases](../../releases) page.

**Linux:**
```bash
chmod +x multi-ssh
sudo mv multi-ssh /usr/local/bin/
```

### Build from Source

#### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| Go | 1.21+ | [go.dev](https://go.dev/dl/) |
| Wails CLI | v2 | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| **Linux only** — GTK3 + WebKit | — | See below |
| **Optional** — sshpass | any | `sudo apt install sshpass` (for password auth) |

**Linux system dependencies:**

```bash
# Debian / Ubuntu
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora / RHEL
sudo dnf install gtk3-devel webkit2gtk4.1-devel

# Arch Linux
sudo pacman -S webkit2gtk-4.1
```

#### Build

```bash
git clone https://github.com/odair/multi-ssh.git
cd multi-ssh
go mod tidy
make build        # produces build/bin/multi-ssh
make install      # install to /usr/local/bin
```

#### Development

```bash
make dev          # hot-reload dev server (wails dev)
```

## Usage

### First Run

On first launch, the app creates `~/.multi-ssh/connections.yaml` with default settings. You can also copy the example config:

```bash
cp configs/connections.example.yaml ~/.multi-ssh/connections.yaml
```

### Configuration

`~/.multi-ssh/connections.yaml`:

```yaml
settings:
  default_user: root
  default_port: 22
  default_identity_key: ""

connections:
  - name: "Web Server"
    host: "192.168.1.100"
    port: 22
    user: "deploy"
    identity_key: "~/.ssh/id_rsa"
    password: ""
    group: "Production"
    description: "Main web server"
    tags: [web, nginx]
```

> **Note:** Passwords are stored in plain text. Prefer SSH key authentication.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` or `j` / `k` | Navigate connections |
| `Enter` | Connect |
| `n` | New connection |
| `e` | Edit selected |
| `d` or `Delete` | Delete selected |
| `/` | Focus search |
| `Esc` | Close modal / clear search |

## Roadmap

- [x] Desktop app with Wails
- [x] SSH connection management (CRUD)
- [x] Embedded PTY terminal via xterm.js
- [x] Dark theme UI
- [x] Groups, tags, search
- [ ] Import from `~/.ssh/config`
- [ ] SCP file transfer UI
- [ ] SSH tunneling / port forwarding
- [ ] Multiple simultaneous sessions (tabs)
- [ ] Session logging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.21+, Wails v2 |
| Terminal | creack/pty, gorilla/websocket |
| Config | gopkg.in/yaml.v3 |
| Frontend | Vanilla JS / HTML / CSS |
| Terminal UI | xterm.js v5 |
| Icons | Remix Icon v4 |

## Troubleshooting

**App won't start on Linux:**
Make sure WebKit2GTK is installed. The exact package name varies:
- `libwebkit2gtk-4.0-dev` (Ubuntu 22.04 and earlier)
- `libwebkit2gtk-4.1-dev` (Ubuntu 24.04+)

**Password auth not working:**
Install `sshpass`: `sudo apt install sshpass`

**Terminal renders blank:**
Try resizing the window to trigger a re-fit.

**Connection refused / timeout:**
Use the "Test" button in the connection form to diagnose connectivity before connecting.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

To report a security vulnerability, please follow the process described in [SECURITY.md](SECURITY.md).

## License

MIT License — see [LICENSE](LICENSE) for details.
