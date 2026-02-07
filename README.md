# CaseKit

A free, open-source desktop application for organising civil dispute cases in England & Wales.

Built for litigants in person, claimants preparing to instruct solicitors, and anyone navigating the civil courts who needs to keep their documents, correspondence, and evidence in order.

## What it does

- **Document management** — upload, tag, and organise case files into a structured folder system
- **Chronology builder** — automatically builds a timeline from dated documents and manual entries
- **Letter templates** — pre-action letters, complaints, and follow-ups
- **Procedural guide** — step-by-step guide through civil court procedure (CPR)
- **AI merits analysis** — optional, uses your own Anthropic API key, with built-in redaction tools
- **Court bundle export** — export an organised, indexed bundle as a zip file

## Privacy

CaseKit is a local-first desktop application. Your data never leaves your machine.

- No server. No accounts. No telemetry.
- All case data stored locally in `~/Documents/CaseKit/`
- Zero network requests by default
- AI features are optional — data goes directly to `api.anthropic.com`, never through us
- Built-in redaction tool strips sensitive data (bank details, NI numbers, etc.) before AI submission
- You see exactly what will be sent before confirming

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust |
| Frontend | React + TypeScript |
| Data storage | Local JSON files |
| AI (optional) | Anthropic Claude API (user's own key) |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [pnpm](https://pnpm.io/)

### Development

```bash
git clone https://github.com/legalquant/casekit.git
cd casekit
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

## Security

CaseKit takes security seriously:

- **Path traversal protection** — all user-supplied path components are sanitised
- **Content Security Policy** — webview locked to `self` with explicit allowlists
- **Minimal capabilities** — only `core:default` and `opener:default` Tauri permissions
- **No unsafe Rust** — zero `unsafe` blocks in the codebase

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## Not legal advice

CaseKit is a document organisation tool. It does not provide legal advice. For complex or high-value claims, seek professional legal representation.

## License

[MIT](LICENSE)

## Author

Built by [anonlegalquant](https://github.com/legalquant)

Contact: legalquant@protonmail.me
