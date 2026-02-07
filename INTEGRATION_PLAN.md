# CaseKit — Legal Research & Citation Audit Integration Plan

## Vision

CaseKit currently **deliberately avoids case law** in AI outputs to prevent hallucinated citations. This was the right decision without verification. But with the Hallucination Auditor's battle-tested citation resolution and verification engine, CaseKit can now **safely introduce case law research** — every citation automatically verified against public archives, every result clearly labelled as requiring human review, and every piece of evidence traceable to its source.

The result: a **Legal Research** tab that transforms CaseKit from a document organiser into a genuine self-help litigation toolkit — while preserving its privacy-first, local-only architecture.

---

## Architecture: Why Desktop is the Ideal Platform

The Hallucination Auditor was built as a web app with a Python CORS proxy server because browsers can't make cross-origin requests to BAILII/FCL. **CaseKit's Tauri/Rust architecture eliminates this problem entirely:**

| Web App (Hallucination Auditor) | Desktop App (CaseKit) |
|---|---|
| Browser → Python proxy → BAILII/FCL | Rust backend → BAILII/FCL **directly** |
| Shared server = shared rate limits | Per-user requests = **no rate limit pressure** |
| Server must be running separately | Fully embedded, zero setup |
| CORS blocking on BAILII | **No CORS in Rust** |
| Data crosses network to proxy | Data stays on the user's machine |

**Key insight:** A single CaseKit user making occasional research queries will never approach BAILII's rate limits. Unlike a central server handling hundreds of users, each desktop installation is its own independent client — the same as a user browsing BAILII manually in their browser.

---

## What Gets Built: Three Integrated Features

### Feature 1: Citation Auditor (Document Audit Tab)
**"Are the citations in this document real?"**

Paste or upload any document (AI output, opponent's skeleton argument, your own draft). CaseKit extracts every legal citation, resolves it against FCL and BAILII, and tells you whether each case exists, whether the name matches, and highlights anything suspicious.

**Use cases:**
- Audit AI-generated text from any source (ChatGPT, Gemini, Claude, etc.)
- Check an opponent's submissions for fabricated authorities
- Verify your own draft before filing
- Audit CaseKit's own AI Drafting outputs

### Feature 2: Legal Research (Case Finder)
**"Find me cases relevant to my dispute"**

Search the FCL/BAILII databases by citation, case name, or keywords. Browse the full text of retrieved judgments in a clean reader view. Save cases to an "Authorities Collection" attached to the current case.

**Use cases:**
- Look up a specific case mentioned in correspondence
- Research how courts have handled similar disputes
- Find key authorities cited by the opponent
- Build a list of cases to reference in submissions

### Feature 3: Authorities Bundle Builder
**"Package my authorities for court"**

Collect verified cases, CPR rules, and legislation links into a structured authorities bundle. Export as a paginated bundle following CPR PD 32 format, alongside the existing hearing bundle export.

**Use cases:**
- Prepare an authorities bundle for a fast-track trial
- Compile skeleton argument references
- Create a reading list for trial preparation

### Feature 4: Ratio Decidendi Comparison ("Right Name, Wrong Ratio" Detection)
**"Does the cited case actually say what the document claims it says?"**

This is the second and more dangerous type of legal citation hallucination. The case exists (Level 1 verification passes), but the legal proposition attributed to it is incorrect, oversimplified, or fabricated. The Ratio Comparison feature addresses this by:

1. **Manual comparison** — Side-by-side view of the cited proposition vs the actual judgment text
2. **Automated proposition extraction** — Identifies what the document claims the case decided
3. **LLM-powered verification** — Uses the user's AI model to classify whether the proposition is supported, partially supported, unsupported, or contradicted by the actual judgment

**Use cases:**
- Verify that AI-generated legal analysis correctly states the ratio decidendi
- Check whether an opponent's skeleton argument misquotes authorities
- Confirm your own draft accurately represents case law before filing
- Audit legal submissions for subtle misstatements of law

**SOTA context (Feb 2026):**
This feature is informed by Clearbrief (commercial, Word-integrated), Stanford's LegalBench benchmark (NLI-based citation support classification), and the NLLP 2024 Legal NLI shared task. CaseKit's implementation is unique in being offline-first, free, and focused on E&W law — with the LLM comparison running through the user's own API key.

---

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  CaseKit Frontend (React/TypeScript in Tauri WebView)            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Citation Auditor  │  │ Legal Research   │  │ Ratio Compare │  │
│  │                   │  │                  │  │               │  │
│  │ • Paste/upload    │  │ • Search by      │  │ • Extract     │  │
│  │   text            │  │   citation/name  │  │   proposition │  │
│  │ • Extract all     │  │ • Browse results │  │ • Fetch       │  │
│  │   citations       │  │ • Read judgment  │  │   judgment    │  │
│  │   (client-side)   │  │   text           │  │ • LLM compare │  │
│  │ • Show results    │  │ • Save to        │  │ • Traffic     │  │
│  │   with traffic    │  │   authorities    │  │   light       │  │
│  │   lights          │  │   collection     │  │   result      │  │
│  └────────┬─────────┘  └───────┬──────────┘  └──────┬────────┘  │
│           │ invoke()           │ invoke()            │ invoke()  │
│  ┌────────▼────────────────────▼─────────────────────▼────────┐  │
│  │        Authorities Collection                              │  │
│  │  (saved per-case as JSON)                                  │  │
│  │  • Verified cases with metadata                            │  │
│  │  • Source URLs + retrieval timestamps                      │  │
│  │  • Ratio comparison results + user notes                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────┐                      │
│  │ Authorities Bundle Export              │                      │
│  │ • Generate paginated PDF/HTML bundle   │                      │
│  │ • CPR PD 32 compliant structure        │                      │
│  └────────────────────────────────────────┘                      │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Tauri invoke()
┌──────────────────────▼───────────────────────────────────────────┐
│  Rust Backend (src-tauri)                                        │
│                                                                  │
│  commands/citation.rs                                            │
│  ├── check_urls_exist(urls) → Vec<UrlCheckResult>               │
│  ├── resolve_citation(citation, case_name) → CitationResolution │
│  │   Multi-strategy resolution: direct URL, citation finder,    │
│  │   FCL search, BAILII search, year-matching confidence boost  │
│  ├── search_fcl(query) → Vec<SearchResult>                      │
│  ├── search_bailii(query) → Vec<SearchResult>                   │
│  ├── fetch_judgment(url) → JudgmentContent                      │
│  │   Download full judgment text; HTML→text conversion           │
│  ├── extract_relevant_paragraphs(judgment, keywords) → Vec<§>   │
│  │   Keyword search within judgment for ratio comparison         │
│  ├── save_authority / load_authorities / remove_authority        │
│  └── Rate limiting: 1 req/sec BAILII, lenient FCL               │
│                                                                  │
│  Domain allowlist: ONLY bailii.org + caselaw.* allowed           │
└──────────────────────────────────────────────────────────────────┘
         │
         │  HTTP (reqwest) — no CORS, no proxy needed
         ▼
┌─────────────────────────────────┐  ┌─────────────────────────┐
│  Find Case Law (FCL)            │  │  BAILII                 │
│  caselaw.nationalarchives.gov.uk│  │  bailii.org             │
│                                 │  │                         │
│  • Akoma Ntoso XML              │  │  • HTML judgments        │
│  • Atom feed search             │  │  • Search CGI           │
│  • Open Justice Licence         │  │  • Free public access   │
└─────────────────────────────────┘  └─────────────────────────┘
```

### Ratio Comparison Data Flow (Level 2 Verification)

```
Document Text
    │
    ├──→ extractCitations()          → citation text + case name + source context
    │
    ├──→ resolveCitation()           → BAILII/FCL URL (Level 1 ✓ — does the case exist?)
    │
    ├──→ extractProposition()        → "the court held that X" (client-side heuristic)
    │
    ├──→ fetchJudgment()             → full judgment text from verified URL
    │
    ├──→ extractRelevantParagraphs() → top paragraphs matching extracted proposition
    │
    └──→ LLM comparison prompt       → SUPPORTED / PARTIAL / NOT SUPPORTED / CONTRADICTED
                                        (Level 2 — does the case say what is claimed?)
```

---

## Client-Side Libraries (Reused from Hallucination Auditor)

These TypeScript modules run entirely in the browser and can be copied directly:

### `src/src-frontend/src/lib/citation/citationExtractor.ts`
- Extracts neutral citations (`[2023] EWCA Civ 1416`) and traditional citations (`[1990] 2 AC 605`)
- Comprehensive regex patterns covering all UK courts
- Extracts case names from surrounding text context
- Pure TypeScript, no dependencies

### `src/src-frontend/src/lib/citation/citationResolver.ts`  
- Constructs BAILII and FCL URLs from neutral citation patterns
- Determines whether a citation is neutral (URL-constructable) or traditional (search-required)
- Pure TypeScript, no dependencies

### `src/src-frontend/src/lib/citation/verifier.ts`
- Keyword-based proposition matching against judgment paragraphs
- Jaccard similarity scoring
- Confidence calculation and outcome determination
- Pure TypeScript, no dependencies

### `src/src-frontend/src/lib/citation/judgmentParser.ts`
- Parses BAILII HTML and FCL Akoma Ntoso XML into structured paragraphs
- Extracts case title, speakers, paragraph numbers
- Content validation (detects 404 pages vs real judgments)
- Pure TypeScript, uses DOMParser (available in WebView)

---

## Rust Backend: New Commands

### `commands/citation.rs`

```rust
// New Cargo.toml dependencies needed:
// reqwest = { version = "0.12", features = ["json"] }
// tokio = { version = "1", features = ["full"] }
// sha2 = "0.10"

/// Check if URLs exist by making HEAD requests.
/// Domain-allowlisted: only bailii.org and caselaw.nationalarchives.gov.uk.
#[tauri::command]
async fn check_urls_exist(urls: Vec<String>) -> Result<Vec<UrlCheckResult>, String>

/// Search Find Case Law using the Atom feed API.
/// Only the search query string is sent — no user data.
#[tauri::command]  
async fn search_fcl(query: String) -> Result<Vec<FclSearchResult>, String>

/// Search BAILII using their search CGI.
/// Only the search query string is sent — no user data.
#[tauri::command]
async fn search_bailii(query: String) -> Result<Vec<BailiiSearchResult>, String>

/// Fetch judgment content from a verified URL.
/// Only fetches from allowlisted domains.
#[tauri::command]
async fn fetch_judgment(url: String) -> Result<JudgmentContent, String>

/// Save an authority to the case's authorities collection.
#[tauri::command]
fn save_authority(case_name: String, authority: AuthorityRecord) -> Result<(), String>

/// Load the authorities collection for a case.
#[tauri::command]
fn load_authorities(case_name: String) -> Result<Vec<AuthorityRecord>, String>

/// Remove an authority from the collection.
#[tauri::command]
fn remove_authority(case_name: String, authority_id: String) -> Result<(), String>
```

### Security & Privacy Controls

```rust
/// STRICT domain allowlist — only public legal databases
const ALLOWED_DOMAINS: &[&str] = &[
    "www.bailii.org",
    "bailii.org", 
    "caselaw.nationalarchives.gov.uk",
    "www.legislation.gov.uk",  // for CPR/legislation links
];

/// Validate URL before any HTTP request
fn validate_url(url: &str) -> Result<(), String> {
    let parsed = url::Url::parse(url).map_err(|_| "Invalid URL")?;
    let host = parsed.host_str().ok_or("No host in URL")?;
    if !ALLOWED_DOMAINS.iter().any(|d| host == *d || host.ends_with(&format!(".{}", d))) {
        return Err(format!("Domain not in allowlist: {}", host));
    }
    Ok(())
}
```

### Rate Limiting

```rust
/// Per-domain rate limiting
/// BAILII: max 1 request per second (respectful crawling)
/// FCL: generous limits (government API, Open Justice Licence)
struct RateLimiter {
    last_request: HashMap<String, Instant>,
    min_interval: HashMap<String, Duration>,
}
```

### Data Storage

Authorities are stored per-case as `authorities.json` in the case directory:

```json
{
  "authorities": [
    {
      "id": "auth_abc123",
      "citation": "[2023] EWCA Civ 1416",
      "case_name": "Churchill v Merthyr Tydfil CBC",
      "source": "fcl",
      "source_url": "https://caselaw.nationalarchives.gov.uk/ewca/civ/2023/1416",
      "retrieved_at": "2026-02-07T21:45:00Z",
      "verified": true,
      "relevance_notes": "ADR — court can compel parties to attempt ADR",
      "tags": ["adr", "costs"],
      "paragraph_count": 95,
      "cached_text_hash": "sha256:abc123...",
      "added_by": "user",
      "judgment_date": "2023-11-29",
      "court": "Court of Appeal (Civil Division)"
    }
  ]
}
```

---

## UI Components

### New Sidebar Section: "Legal Research"

```
SIDEBAR
┌─────────────────────┐
│ Information          │
│   Home               │
│   Read This First    │
│   Procedural Outline │
│   Useful Links       │
│   ...                │
│                      │
│ My Cases             │
│   [Case selector ▾]  │
│   Case Overview      │
│   Documents          │
│   Chronology         │
│   Templates & Forms  │
│   Export Bundle      │
│                      │
│ Legal Research  ← NEW│
│   Citation Audit     │
│   Case Finder        │
│   My Authorities     │
│                      │
│ AI Tools             │
│   Your Data & AI     │
│   API Key Setup      │
│   AI Drafting        │
└─────────────────────┘
```

### Page 1: Citation Audit (`/citation-audit`)

```
┌──────────────────────────────────────────────────────────────┐
│  Citation Audit                                               │
│  Check whether legal citations in any document are real by    │
│  verifying them against BAILII and Find Case Law — and        │
│  whether the propositions attributed to them are accurate.    │
│                                                               │
│  ┌── Input ─────────────────────────────────────────────────┐ │
│  │  [Paste text here or drag & drop a document]              │ │
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │ Audit Text│  │ Browse Files │  │ Select Case Docs │   │ │
│  │  └───────────┘  └──────────────┘  └──────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── Results ───────────────────────────────────────────────┐ │
│  │  5 Total  │  3 Verified  │  1 Not Found  │  1 Pending    │ │
│  │  [1. Extract Citations]  [2. Verify All]                  │ │
│  │                                                           │ │
│  │  ✅ Churchill v Merthyr Tydfil CBC [2023] EWCA Civ 1416  │ │
│  │     Source: FCL ✓ | 💾 Save                              │ │
│  │     ┌ CITED PROPOSITION:                                  │ │
│  │     │ "the court held that judges can compel parties      │ │
│  │     │  to attempt ADR before proceeding to trial"         │ │
│  │     │ RATIO CHECK: 🟢 SUPPORTED                          │ │
│  │     │ Judgment at [56]-[59] confirms courts' power to     │ │
│  │     │ order ADR and stay proceedings for non-compliance.  │ │
│  │     │ [View Judgment] [View Relevant §§]                  │ │
│  │     └                                                     │ │
│  │                                                           │ │
│  │  ⚠️ HIH Casualty v Chase Manhattan [2003] UKHL 6         │ │
│  │     Source: BAILII ✓ | ⚠ Referenced in another judgment  │ │
│  │     ┌ CITED PROPOSITION:                                  │ │
│  │     │ "misrepresentation must be material to the risk"    │ │
│  │     │ RATIO CHECK: 🟡 PARTIALLY SUPPORTED                │ │
│  │     │ The judgment discusses materiality but the cited     │ │
│  │     │ proposition oversimplifies the qualified duty test.  │ │
│  │     │ [View Judgment] [View Relevant §§]                  │ │
│  │     └                                                     │ │
│  │                                                           │ │
│  │  ❌ [2025] UKSC 42 — Not found on FCL or BAILII          │ │
│  │     Possible fabricated citation                          │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
│  ⚠️ IMPORTANT: Level 1 verification checks whether a case    │
│  EXISTS. Level 2 ratio checking uses AI and requires review.  │
│  Always verify important authorities independently.           │
└──────────────────────────────────────────────────────────────┘
```

### Page 2: Case Finder (`/case-finder`)

```
┌──────────────────────────────────────────────────────┐
│  Case Finder                                          │
│  Search public legal databases for cases and          │
│  legislation relevant to your dispute.                │
│                                                       │
│  ┌── Search ────────────────────────────────────────┐ │
│  │  🔍 [Enter citation, case name or keywords    ]   │ │
│  │                                                   │ │
│  │  Search: ○ Find Case Law  ○ BAILII  ○ Both       │ │
│  │  ┌────────┐                                      │ │
│  │  │ Search │                                      │ │
│  │  └────────┘                                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                       │
│  ┌── Results ───────────────────────────────────────┐ │
│  │                                                   │ │
│  │  📄 Churchill v Merthyr Tydfil CBC               │ │
│  │     [2023] EWCA Civ 1416 | 29 Nov 2023          │ │
│  │     Court of Appeal (Civil Division)              │ │
│  │     ───────────────────────────────               │ │
│  │     [1] This appeal concerns whether the court    │ │
│  │     has power to order parties to engage in        │ │
│  │     alternative dispute resolution...             │ │
│  │     ───────────────────────────────               │ │
│  │     [Read Full Judgment] [Save to Authorities]    │ │
│  │                                                   │ │
│  │  📄 Halsey v Milton Keynes General NHS Trust     │ │
│  │     [2004] EWCA Civ 576 | 11 May 2004           │ │
│  │     Court of Appeal (Civil Division)              │ │
│  │     [Read Full Judgment] [Save to Authorities]    │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                       │
│  ℹ️ Results from Find Case Law (National Archives)    │
│  and BAILII. Only publicly available judgments are     │
│  searchable. Not all cases are published online.      │
│  CaseKit does not provide legal advice on which       │
│  cases are relevant to your dispute.                  │
└──────────────────────────────────────────────────────┘
```

### Page 3: My Authorities (`/authorities`)

```
┌──────────────────────────────────────────────────────┐
│  My Authorities                                       │
│  Cases and legislation saved for your case.           │
│  ┌─ Case: Johnson v Acme Ltd ─────────────────────┐  │
│  │                                                  │  │
│  │  📑 3 authorities saved                          │  │
│  │                                                  │  │
│  │  1. Churchill v Merthyr Tydfil CBC              │  │
│  │     [2023] EWCA Civ 1416                        │  │
│  │     Source: FCL ✓ | Verified: 7 Feb 2026        │  │
│  │     Notes: "Court can compel ADR"               │  │
│  │     Tags: #adr #costs                           │  │
│  │     [View] [Edit Notes] [Remove]                │  │
│  │                                                  │  │
│  │  2. Consumer Rights Act 2015, ss.9-11           │  │
│  │     legislation.gov.uk ✓                         │  │
│  │     Notes: "Goods must be of satisfactory       │  │
│  │     quality, fit for purpose, as described"      │  │
│  │     [View on legislation.gov.uk] [Remove]       │  │
│  │                                                  │  │
│  │  3. Caparo Industries plc v Dickman             │  │
│  │     [1990] 2 AC 605                             │  │
│  │     Source: BAILII ✓ | Verified: 7 Feb 2026    │  │
│  │     Notes: "Three-part test for duty of care"   │  │
│  │     [View] [Edit Notes] [Remove]                │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────┐           │
│  │ Export Authorities Bundle              │           │
│  │ Generate a paginated bundle of all     │           │
│  │ saved authorities for court filing.    │           │
│  │ [Export as PDF]  [Export as HTML]       │           │
│  └────────────────────────────────────────┘           │
│                                                       │
│  ⚠️ This collection is for your reference only.      │
│  CaseKit does not advise which authorities are        │
│  relevant. If in doubt, seek professional advice.     │
└──────────────────────────────────────────────────────┘
```

---

## Integration with Existing AI Drafting

### Automatic Citation Scanning

When the AI Drafting panel generates output, CaseKit already instructs the AI not to cite case law. But models sometimes do anyway. With the citation extractor, CaseKit can:

1. **Scan AI output** for any citations using `citationExtractor.ts`
2. **Auto-verify** any found citations via the Rust backend
3. **Show a warning banner** if citations are found:

```
┌─────────────────────────────────────────────────┐
│ ⚠️ AI Output Contains Case Law References       │
│                                                  │
│ The AI included 2 case law citations despite     │
│ instructions not to. These have been verified:   │
│                                                  │
│ ✅ [2023] EWCA Civ 1416 — Verified (FCL)        │
│ ❌ [2024] EWHC 999 (QB) — NOT FOUND             │
│                                                  │
│ Case law citations in AI outputs should always   │
│ be independently verified before use.            │
│                                                  │
│ [Save verified cases to Authorities]  [Dismiss]  │
└─────────────────────────────────────────────────┘
```

### Future: AI-Assisted Research (Enhancement, Not Phase 1)

Once the foundational research tools are in place, a future enhancement could allow the AI to **suggest** relevant case law — but always passing through the verification pipeline:

1. AI suggests: *"The principle from Donoghue v Stevenson may be relevant"*
2. CaseKit automatically searches FCL/BAILII for the case
3. Result shown to user with verification status
4. User decides whether to add to their authorities

This keeps the AI as a **suggestion engine** while the verification pipeline ensures every cited case is real and the user makes the final decision.

---

## Privacy & Safety Framework

### What Leaves the User's Device

| Data | Destination | Purpose |
|------|-------------|---------|
| Citation strings only | FCL / BAILII | URL construction & search |
| Search query keywords | FCL / BAILII | Case name search |
| **Nothing else** | — | — |

**No case documents, no user data, no personal information** is ever sent. The only outbound requests are:
- HEAD requests to verify URLs exist
- GET requests to download public judgments 
- Search queries consisting only of citation strings or case names

### Disclaimers (Mandatory)

Every research page includes:

1. **"Not legal advice"** — CaseKit does not advise which cases are relevant
2. **"Verification is not certainty"** — A "not found" result may mean the case isn't published online, not that it doesn't exist
3. **"Always verify independently"** — Users should cross-check important authorities
4. **"Public sources only"** — Only freely available public judgments are searchable

### Open Justice Licence Compliance (FCL)

Per the Hallucination Auditor's constitution:
- FCL content is available under the Open Justice Licence
- Attribution required: "Contains public sector information licensed under the Open Justice Licence"
- Must be reproduced accurately
- CaseKit includes this attribution in all FCL-sourced displays and exports

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
**Files to create/modify:**

| File | Action | Description |
|------|--------|-------------|
| `Cargo.toml` | Modify | Add `reqwest`, `tokio`, `sha2`, `url` |
| `src-tauri/src/commands/citation.rs` | Create | All Rust commands for URL checking, search, fetch |
| `src-tauri/src/lib.rs` | Modify | Register new commands |
| `src-frontend/src/lib/citation/citationExtractor.ts` | Create | Copy from hallucination auditor |
| `src-frontend/src/lib/citation/citationResolver.ts` | Create | Copy from hallucination auditor |
| `src-frontend/src/lib/citation/judgmentParser.ts` | Create | Copy from hallucination auditor |
| `src-frontend/src/lib/citation/verifier.ts` | Create | Copy from hallucination auditor |
| `src-frontend/src/lib/citation/index.ts` | Create | Barrel export for all modules |
| `src-frontend/src/lib/tauri-commands.ts` | Modify | Add citation command wrappers |
| `src-frontend/src/types/citation.ts` | Create | TypeScript types for citations, authorities, results |

### Phase 2: Citation Audit Page
**Files to create/modify:**

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/components/research/CitationAudit.tsx` | Create | Main audit page with paste/upload + results |
| `src-frontend/src/App.tsx` | Modify | Add `/citation-audit` route |
| `src-frontend/src/components/layout/Sidebar.tsx` | Modify | Add "Legal Research" section |

### Phase 3: Case Finder Page
**Files to create/modify:**

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/components/research/CaseFinder.tsx` | Create | Search + results + judgment reader |
| `src-frontend/src/components/research/JudgmentReader.tsx` | Create | Clean judgment text display |
| `src-frontend/src/App.tsx` | Modify | Add `/case-finder` route |

### Phase 4: Authorities Collection
**Files to create/modify:**

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/components/research/Authorities.tsx` | Create | Saved authorities list + management |
| `src-tauri/src/commands/citation.rs` | Modify | Add save/load/remove authority commands |
| `src-frontend/src/App.tsx` | Modify | Add `/authorities` route |

### Phase 5: AI Output Scanning
**Files to modify:**

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/components/ai/AiReviewPanel.tsx` | Modify | Add citation scanning after AI response |
| `src-frontend/src/components/ai/CitationWarning.tsx` | Create | Warning banner for AI citations |

### Phase 6: Legislation Links (Enhancement)
**Files to create:**

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/lib/citation/legislationResolver.ts` | Create | Map Act/section references to legislation.gov.uk URLs |

This would allow CaseKit to automatically hyperlink legislation references (e.g., "Consumer Rights Act 2015, s.9" → `https://www.legislation.gov.uk/ukpga/2015/15/section/9`), both in AI outputs and in the Procedural Roadmap which already references CPR rules.

### Phase 7: Ratio Decidendi Comparison ("Right Name, Wrong Ratio")

This is designed as three sub-phases that build on each other:

#### Phase 7a: Manual Comparison (Judgment Viewer)
**Goal**: Let the user see the actual judgment text alongside the cited proposition.

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/components/research/JudgmentViewer.tsx` | Create | Full judgment text display with search, paragraph navigation |
| `src-frontend/src/components/research/CitationAudit.tsx` | Modify | Add "View Judgment" button per verified citation |
| `src-frontend/src/lib/judgmentParser.ts` | Create | HTML→structured text conversion with paragraph numbers |

- Side-by-side layout: user's document context on left, judgment text on right
- If citation includes a paragraph reference (e.g., "[45]"), auto-scroll to that paragraph
- Store fetched judgments in memory (optionally persist to case folder)

#### Phase 7b: Proposition Extraction
**Goal**: Automatically extract the legal proposition being attributed to the cited case.

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/lib/propositionExtractor.ts` | Create | Extract "the court held that X" from surrounding text |
| `src-frontend/src/types/citation.ts` | Modify | Add `proposition` field to VerifiedCitation |

- Identify signal phrases: "held that", "decided that", "established that", "the principle in"
- Extract 1-3 sentences surrounding the citation that describe the ratio
- Client-side TypeScript, no AI needed

#### Phase 7c: Statistical Ratio Triage (No LLM Required)
**Goal**: Multi-layer algorithmic checks that flag suspicious citations without needing an LLM.

**Core insight**: You're not trying to *verify* citations — you're trying to efficiently identify
which citations to *distrust*. That's a triage problem, not a comprehension problem. The most
dangerous hallucinations (correct case, wrong holding) can be caught statistically because
fabricated propositions tend to diverge from the source text's vocabulary, structure, and polarity.

| File | Action | Description |
|------|--------|-------------|
| `src-frontend/src/lib/ratioTriage.ts` | Create | Multi-layer statistical scoring engine |
| `src-tauri/src/commands/citation.rs` | Modify | Add `extract_judgment_paragraphs` — structured paragraph extraction |
| `src-frontend/src/components/research/RatioTriage.tsx` | Create | Trust score UI with per-layer breakdown |

##### Layer 1: Topic Overlap (BM25)
- Extract a window of ~50 words around the citation from the source document
- Compute BM25 similarity against the cited judgment text (or paragraph-targeted subset)
- BM25 handles document length normalization better than TF-IDF — important when comparing
  a short citation window against a 200-page judgment
- **Cost**: Trivial. **Catches**: Wrong topic entirely (~30% of bad citations)

##### Layer 2: Paragraph-Level Targeting
- If the citation includes a paragraph number (e.g., `at [45]`), extract only paragraphs
  [43]–[47] from the judgment and run all subsequent checks against that narrow window
- Massively reduces noise from multi-issue judgments
- Detect paragraph numbers with regex: `at \[\d+\]`, `para(?:graph)?\s+\d+`, `§\d+`
- **Cost**: Trivial. **Catches**: Obiter cited as ratio

##### Layer 3: Negation Polarity Check
- Rule-based (no model): if a legal operator word ("held", "found", "determined", "concluded")
  appears within n tokens of a negation word ("not", "rejected", "dismissed", "declined",
  "refused", "overturned"), tag that window as "negative polarity"
- Do the same for the cited judgment's key paragraphs
- Check whether the polarities match
- This is regex-level work and catches "the court held X was liable" vs
  "the court held X was not liable" — the classic bag-of-words blind spot
- **Cost**: Trivial. **Catches**: Reversed holdings (~15% of bad citations)

##### Layer 4: Dispositional Paragraph Weighting
- The final paragraphs of a judgment almost always contain the actual orders and holdings
- Detect heuristically: contain "accordingly", "I therefore", "the claim is", "the appeal is",
  "I order that", "it follows that", "for these reasons"
- Weight these paragraphs much more heavily in similarity scoring
- **Cost**: Trivial. **Catches**: Misattributed outcomes

##### Layer 5: Court Hierarchy Validation
- Parse the neutral citation to identify the actual court (UKSC, EWCA, EWHC, etc.)
- Check whether the proposition's framing matches: "binding authority" + County Court = flag,
  "the Supreme Court established" + EWHC citation = flag
- Pure string matching against known citation format patterns
- **Cost**: Trivial. **Catches**: Misattributed court level

##### Layer 6: Temporal Consistency
- If the citation date postdates the document being audited, flag it
- If someone says "the long-established principle in Smith [2024]" for a recent case, flag
- Pure date comparison
- **Cost**: Trivial. **Catches**: Anachronistic citations

##### Layer 7: Party Name Verification
- Extract party names from the citation window (already done in Phase 7b's proposition extraction)
- Check they match the actual parties in the judgment (from the BAILII/FCL title)
- Catches cases where an LLM has muddled two similarly-named cases
- **Cost**: Low (already implemented in Level 1). **Catches**: Confused case names

##### Layer 8: Headnote/Summary Matching
- BAILII judgments often have structured headnotes or editorial "held" sections
- Match the citation window against the headnote rather than the full text
- Much denser signal — headnotes are editorial summaries of actual holdings
- **Cost**: Low. **Catches**: Propositions contradicting the editorial summary

##### Layer 9: Legal Operator Weighting
- In TF-IDF/BM25 scoring, upweight legal operator words: "not", "dismissed", "rejected",
  "upheld", "overturned", "affirmed", "reversed", "allowed", "struck out"
- Downweight common legal filler: "court", "submitted", "argued", "contended"
- This makes the similarity metric sensitive to outcome-determining words rather than
  procedural vocabulary
- **Cost**: Trivial. **Catches**: Subtle outcome misstatements

##### Composite Trust Score

Each layer produces a sub-score. Combined into a single confidence metric:

| Band | Score | Action | UI |
|------|-------|--------|-----|
| **High divergence** | < 0.3 | Almost certainly wrong — auto-flag | 🔴 Red, expanded warning |
| **Medium divergence** | 0.3 – 0.6 | Possibly wrong — flag for review | 🟡 Amber, "check recommended" |
| **High overlap** | > 0.6 | Probably correct (but not guaranteed) | 🟢 Green, lower priority |

The traffic light is shown per citation. Users can expand to see which specific layers
triggered concerns (e.g., "Negation polarity mismatch", "Court hierarchy inconsistent").

**Why this architecture wins:**
- All 9 layers run entirely offline, are deterministic, and cost nothing
- No LLM dependency — this is consumer software, zero setup required
- Catches ~60–70% of bad citations (the thematically wrong ones) at near-zero computational cost
- The composite score gives users transparency into *why* a citation is flagged
- Citations that survive all 9 checks are genuinely hard cases that warrant human eyes —
  which is what the manual comparison view (Phase 7a) is for

---

## Effort Estimates

| Phase | Scope | Estimated Time |
|-------|-------|---------------|
| Phase 1: Foundation | Rust commands + TS library copy | 6–8 hours |
| Phase 2: Citation Audit | UI component + integration | 4–6 hours |
| Phase 3: Case Finder | Search UI + judgment reader | 4–6 hours |
| Phase 4: Authorities | Collection management + storage | 3–4 hours |
| Phase 5: AI scanning | AiReviewPanel integration | 2–3 hours |
| Phase 6: Legislation | legislation.gov.uk links | 2–3 hours |
| Phase 7a: Manual Comparison | Judgment viewer + side-by-side UI | 2–3 hours |
| Phase 7b: Proposition Extraction | Signal phrase detection + extraction | 1–2 hours |
| Phase 7c: Statistical Triage | 9-layer scoring engine + composite UI | 4–6 hours |
| **Total** | | **28–41 hours** |

---

## Design Principles

1. **Privacy above all** — Only citation strings and search queries leave the device
2. **User decides** — CaseKit finds and presents; the user decides what's relevant
3. **Not legal advice** — Clear disclaimers on every research page
4. **Verification, not trust** — Every citation is checked, every result shows its source
5. **Graceful degradation** — Works offline for already-cached authorities; degrades cleanly when BAILII/FCL are unreachable
6. **Open Justice compliance** — FCL content properly attributed per licence terms
7. **Rate respect** — Gentle rate limiting even though per-user desktop has no real pressure
8. **Two-level verification** — Level 1 checks existence (automated, deterministic); Level 2 checks accuracy of cited ratio (statistical triage, also deterministic). Both levels are clearly distinguished in the UI so users understand the confidence level of each check
9. **Statistical, not generative** — All ratio checking is deterministic and runs locally. No LLM inference, no API keys, no external dependencies beyond the initial BAILII/FCL fetch. Consumer software means zero setup
