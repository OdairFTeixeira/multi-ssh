# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | Yes       |

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report vulnerabilities privately via GitHub's [Security Advisories](../../security/advisories/new) feature, or email the maintainer directly.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You can expect an acknowledgement within 72 hours and a resolution or mitigation plan within 14 days.

## Known Security Considerations

- **Plain-text passwords**: Passwords stored in `connections.yaml` are not encrypted. Use SSH key authentication whenever possible.
- **Local WebSocket**: The WebSocket server binds to `127.0.0.1` only and is not accessible from other machines.
- **`sshpass`**: Password-based auth relies on `sshpass`, which may expose credentials via process arguments on some systems. This is a known limitation of `sshpass`.
