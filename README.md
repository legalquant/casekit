# CaseKit

A free, open-source desktop application for organising civil dispute cases in England & Wales.

Built for litigants in person, claimants preparing to instruct solicitors, and anyone navigating the civil courts who needs to keep their documents, correspondence, and evidence in order.

## What it does

- **Document management** — upload, tag, and organise case files into a structured folder system
- **Chronology builder** — automatically builds a timeline from dated documents and manual entries
- **AI case analysis** — optional, objective analysis of both parties' positions based solely on uploaded documents, using your own API key (Anthropic, OpenAI, or Google)
- **AI document drafting** — pre-action letters, responses, particulars of claim, and defences — all source-locked to your evidence
- **Citation verification** — checks legal citations against BAILII and the National Archives to catch AI hallucinations
- **Letter templates** — pre-action letters, complaints, and follow-ups with guidance
- **Procedural guide** — step-by-step guide through civil court procedure (CPR)
- **Court bundle export** — export an organised, indexed bundle as a zip file

## Privacy

CaseKit is a local-first desktop application. Your data stays on your machine by default.

- No server. No accounts. No telemetry. No background connectivity.
- All case data stored locally in `~/Documents/CaseKit/`
- Zero network requests by default

There are **two user-initiated exceptions** to the offline-only design:

1. **AI features (optional)** — when you explicitly press "Analyse", approved text is sent directly to your chosen AI provider (`api.anthropic.com`, `api.openai.com`, or `generativelanguage.googleapis.com`). You see exactly what will be sent before confirming. Nothing passes through any CaseKit server.

2. **Citation verification** — when you verify legal citations, only the citation string (e.g. `[2020] UKSC 42`) is sent to BAILII and the National Archives to check whether the case exists. **No client data, document content, or personal information is included in these requests.** This is equivalent to typing a case name into the BAILII search box.

- Built-in redaction tool strips sensitive data (bank details, NI numbers, etc.) before AI submission
- You always see what will be sent before confirming

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | [Tauri v2](https://v2.tauri.app/) |
| Backend | Rust |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| Data storage | Local JSON files |
| AI (optional) | Anthropic Claude, OpenAI GPT/o-series, Google Gemini (user's own key) |
| Citation checking | BAILII, National Archives (Find Case Law) |
| OCR (optional) | Tesseract (external install) |
| Testing | Vitest |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [pnpm](https://pnpm.io/)
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) (optional — only needed for scanned document OCR)

### Development

```bash
git clone https://github.com/legalquant/casekit.git
cd casekit/src
pnpm install
cd src-frontend && pnpm install && cd ..
pnpm tauri dev
```

### Testing

```bash
cd src/src-frontend
pnpm test        # run once
pnpm test:watch  # watch mode
```

### Build

```bash
cd src
pnpm tauri build
```

The build produces Windows installers (NSIS `.exe` and `.msi`) in `src/src-tauri/target/release/bundle/`.

## System requirements

- Windows 7 or later (x64)
- ~100MB disk space
- No special hardware required
- WebView2 runtime (auto-installed by the installer if not present)

## Security

CaseKit takes security seriously:

- **Path traversal protection** — all user-supplied path components are sanitised
- **Content Security Policy** — webview locked to `self` with explicit allowlists for AI providers
- **Minimal capabilities** — only `core:default` and `opener:default` Tauri permissions
- **No unsafe Rust** — zero `unsafe` blocks in the codebase
- **API keys stored locally** — never written to files or sent to any server other than the provider

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## Not legal advice

CaseKit is a document organisation and information tool. It does not provide legal advice and does not create a solicitor-client relationship. For complex or high-value claims, seek professional legal representation.

## License

[MIT](LICENSE)

## Author

Built by [anonlegalquant](https://github.com/legalquant)

Contact: legalquant@protonmail.me
