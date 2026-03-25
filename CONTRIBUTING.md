# Contributing

Thank you for your interest in contributing to multi-ssh!

## Getting Started

1. Fork the repository and clone your fork
2. Follow the [build from source](README.md#build-from-source) instructions
3. Run `make dev` to start the hot-reload development server
4. Make your changes
5. Run `make fmt` and `make vet` before submitting

## Project Structure

```
multi-ssh/
├── main.go                 # Wails entry point
├── app.go                  # Go methods exposed to the frontend
├── internal/
│   ├── config/             # YAML config read/write
│   ├── model/              # Connection and Settings structs
│   ├── ssh/                # SSH connectivity test
│   └── pty/                # PTY session manager + WebSocket bridge
└── frontend/
    ├── index.html          # UI layout
    ├── app.js              # All frontend logic
    └── style.css           # Dark theme styles
```

See [CLAUDE.md](CLAUDE.md) for a detailed architecture description.

## Guidelines

- Keep the frontend in vanilla JS/HTML/CSS — no frameworks
- Follow existing Go code style (`go fmt` enforced)
- Prefer editing existing files over creating new ones
- Keep changes focused — one concern per PR
- Update the README if you add user-facing features

## Submitting a PR

1. Open an issue first for non-trivial changes so we can discuss the approach
2. Keep commits logical and descriptive
3. Fill out the pull request template
4. Ensure `make vet` and `make fmt` pass

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include your OS, multi-ssh version, and steps to reproduce.
