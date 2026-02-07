# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CaseKit, please report it responsibly.

**Email:** legalquant@protonmail.me

**Do not** open a public issue for security vulnerabilities. Use GitHub's private vulnerability reporting feature (Security → Advisories → New draft advisory) instead.

## What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

## Response timeline

- **Acknowledgement:** Within 48 hours
- **Initial assessment:** Within 7 days
- **Fix or mitigation:** Target within 30 days, depending on severity

## Scope

This policy covers the CaseKit desktop application, including:

- The Rust backend (src-tauri)
- The React frontend (src-frontend)
- The Tauri configuration and capabilities
- Build and release infrastructure

## Security architecture

CaseKit is a local-first desktop application. By design:

- **No server.** User data is never transmitted to any server controlled by the project.
- **No accounts.** There is no authentication system to compromise.
- **No telemetry.** No analytics, tracking, or usage data is collected.
- **Minimal network access.** The only outbound connection is to `api.anthropic.com`, and only when the user explicitly initiates an AI analysis.
- **Local storage only.** All case data is stored in `~/Documents/CaseKit/` on the user's machine.
- **Path sanitisation.** All user-supplied path components are validated to prevent directory traversal attacks.
- **Content Security Policy.** The Tauri webview is locked down to prevent loading external scripts, styles, or resources.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
