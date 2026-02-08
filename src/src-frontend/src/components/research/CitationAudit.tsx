import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';
import { resolveCitation } from '../../lib/tauri-commands';
import { extractCitations } from '../../lib/citationExtractor';
import type { VerifiedCitation, CitationResolution } from '../../types/citation';

interface DocumentEntry {
    id: string;
    filename: string;
    path: string;
    folder: string;
    extracted_text: string | null;
    description: string;
    date: string | null;
}

export default function CitationAudit() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const caseName = currentCase?.name || '';
    const [documents, setDocuments] = useState<DocumentEntry[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
    const [citations, setCitations] = useState<VerifiedCitation[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [pasteText, setPasteText] = useState('');
    const [showPaste, setShowPaste] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [externalTexts, setExternalTexts] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sourceLabel, setSourceLabel] = useState<string>('');
    const dropRef = useRef<HTMLDivElement>(null);

    // Load documents when case changes
    useEffect(() => {
        if (!caseName) return;
        invoke<DocumentEntry[]>('load_documents_index', { caseName })
            .then((docs) => setDocuments(docs))
            .catch(() => setDocuments([]));
    }, [caseName]);

    const docsWithText = documents.filter((d) => d.extracted_text && d.extracted_text.trim().length > 0);

    // Toggle document selection
    const toggleDoc = (docId: string) => {
        setSelectedDocIds((prev) => {
            const next = new Set(prev);
            if (next.has(docId)) next.delete(docId);
            else next.add(docId);
            return next;
        });
    };

    // Select all / none
    const selectAll = () => {
        setSelectedDocIds(new Set(docsWithText.map((d) => d.id)));
    };
    const selectNone = () => setSelectedDocIds(new Set());

    // Gather text from all sources and extract citations
    const handleExtract = useCallback(() => {
        setIsExtracting(true);
        setError(null);

        const textBlocks: string[] = [];
        const labels: string[] = [];

        // From selected case documents
        const selectedDocs = documents.filter((d) => selectedDocIds.has(d.id));
        for (const doc of selectedDocs) {
            if (doc.extracted_text) {
                textBlocks.push(doc.extracted_text);
                labels.push(doc.filename);
            }
        }

        // From drag-and-dropped externals
        for (const t of externalTexts) {
            textBlocks.push(t);
        }

        // From pasted text
        if (pasteText.trim()) {
            textBlocks.push(pasteText);
            labels.push('pasted text');
        }

        if (textBlocks.length === 0) {
            setError('No text to analyse. Select case documents, drop files, or paste text.');
            setIsExtracting(false);
            return;
        }

        const allText = textBlocks.join('\n\n');
        const extracted = extractCitations(allText);
        const verified: VerifiedCitation[] = extracted.map((e) => ({
            ...e,
            status: 'pending',
        }));

        setCitations(verified);
        setIsExtracting(false);
        setExpandedIdx(null);

        if (labels.length > 0) {
            setSourceLabel(
                `from ${labels.length} source${labels.length !== 1 ? 's' : ''}: ${labels.slice(0, 3).join(', ')}${labels.length > 3 ? '…' : ''}`
            );
        }
    }, [documents, selectedDocIds, externalTexts, pasteText]);

    // Verify all citations via Rust backend
    const handleVerifyAll = useCallback(async () => {
        if (citations.length === 0) return;
        setIsVerifying(true);
        setProgress({ current: 0, total: citations.length });

        const updated = [...citations];
        for (let i = 0; i < updated.length; i++) {
            updated[i] = { ...updated[i], status: 'resolving' };
            setCitations([...updated]);
            setProgress({ current: i + 1, total: updated.length });

            try {
                const resolution: CitationResolution = await resolveCitation(
                    updated[i].citation,
                    updated[i].caseName
                );
                updated[i] = {
                    ...updated[i],
                    status: resolution.status === 'resolved' ? 'verified' : 'not_found',
                    resolution,
                };
            } catch (err) {
                updated[i] = {
                    ...updated[i],
                    status: 'error',
                    error: String(err),
                };
            }
            setCitations([...updated]);
        }
        setIsVerifying(false);
    }, [citations]);

    // Verify a single citation
    const handleVerifySingle = useCallback(
        async (index: number) => {
            const updated = [...citations];
            updated[index] = { ...updated[index], status: 'resolving' };
            setCitations(updated);

            try {
                const resolution = await resolveCitation(
                    updated[index].citation,
                    updated[index].caseName
                );
                updated[index] = {
                    ...updated[index],
                    status: resolution.status === 'resolved' ? 'verified' : 'not_found',
                    resolution,
                };
            } catch (err) {
                updated[index] = {
                    ...updated[index],
                    status: 'error',
                    error: String(err),
                };
            }
            setCitations([...updated]);
        },
        [citations]
    );

    // Handle external file import (drag-drop or file picker)
    const handleExternalFiles = async (filePaths: string[]) => {
        setError(null);
        const newTexts: string[] = [...externalTexts];

        for (const filePath of filePaths) {
            try {
                // Use the Rust extraction engine — handles PDF, DOCX, EML, TXT, images
                const result = await invoke<{
                    text: string;
                    metadata_date: string | null;
                    subject: string | null;
                    from: string | null;
                    to: string | null;
                } | null>('extract_text_from_path', { path: filePath });

                if (result && result.text.trim()) {
                    newTexts.push(result.text);
                } else {
                    // Fallback: try to read as plain text
                    try {
                        const text = await invoke<string>('read_file_bytes_as_text', { path: filePath });
                        if (text.trim()) newTexts.push(text);
                    } catch {
                        // File couldn't be read — silently skip
                    }
                }
            } catch (err) {
                // If the specific command doesn't exist, try copy to case then read
                const filename = filePath.split(/[\\/]/).pop() || 'unknown';
                setError(`Could not extract text from ${filename}. Try adding it to your case documents first.`);
            }
        }
        setExternalTexts(newTexts);
    };

    // File picker for external files
    const handleFilePicker = async () => {
        try {
            const result = await open({
                multiple: true,
                title: 'Select files to scan for citations',
                filters: [
                    {
                        name: 'Documents',
                        extensions: ['pdf', 'txt', 'docx', 'eml', 'doc'],
                    },
                ],
            });
            if (!result) return;
            const paths: string[] = Array.isArray(result) ? result : [result];
            if (paths.length > 0) await handleExternalFiles(paths);
        } catch (err) {
            setError(`File picker error: ${err}`);
        }
    };

    const summaryStats = {
        total: citations.length,
        verified: citations.filter((c) => c.status === 'verified').length,
        notFound: citations.filter((c) => c.status === 'not_found').length,
        pending: citations.filter((c) => c.status === 'pending' || c.status === 'resolving').length,
        errors: citations.filter((c) => c.status === 'error').length,
    };

    // ===== Full interface (works with or without a case) =====
    return (
        <div className="page">
            <div className="page-header">
                <h1>Citation Audit</h1>
                <p>
                    {caseName ? (
                        <>
                            <strong style={{ color: 'var(--primary)' }}>{caseName}</strong> —
                            Scan your case documents for legal citations and verify each one resolves to a real judgment
                            on BAILII or the National Archives.
                        </>
                    ) : (
                        <>
                            Verify legal citations in your documents against BAILII and Find Case Law.
                            Drop files, browse, or paste text below.
                        </>
                    )}
                </p>
            </div>

            {/* AI Hallucination Warning & Tool Rationale */}
            <div
                style={{
                    background: '#fef2f2', border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)',
                    marginBottom: 'var(--space-4)', fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.7,
                }}
            >
                <strong style={{ fontSize: '0.85rem' }}>Why citation verification matters</strong>
                <p style={{ margin: '0.5rem 0 0.5rem' }}>
                    Large language models routinely fabricate legal citations — a phenomenon known as
                    "hallucination". In <em>Harber v Commissioners for HMRC</em> [2023], the Tribunal noted
                    that AI-generated submissions contained entirely fictitious case references.
                    In <em>Ayinde v Leidos (Lockheed Martin)</em> [2024] EAT, the Employment Appeal Tribunal
                    considered submissions containing AI-fabricated authorities and emphasised the duty on
                    parties and representatives to verify every citation before relying on it.
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                    Research by Matthew Lee categorised AI hallucinations into several types: <strong>wholly
                    fabricated cases</strong> (the case does not exist at all), <strong>incorrect citations</strong> (a
                    real case cited with the wrong neutral citation or report reference), <strong>misattributed
                    propositions</strong> (a real case cited for a principle it does not establish), and <strong>hybrid
                    fabrications</strong> (real party names combined with invented procedural history or
                    holdings).
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                    <strong>This tool addresses the first two categories</strong> — it checks whether each citation
                    resolves to a real judgment on BAILII or the National Archives (Find Case Law). Because
                    the check is against authoritative databases rather than AI, it is fast, deterministic,
                    and reliable. It catches wholly fabricated cases and incorrect citations in seconds.
                </p>
                <p style={{ margin: 0, color: '#b45309' }}>
                    <strong>We are actively developing advanced methods</strong> to detect the remaining,
                    more subtle hallucination categories — including misattributed propositions and hybrid
                    fabrications — by cross-referencing cited principles against judgment text. These
                    features will be added in a future update.
                </p>
            </div>

            {/* Operational disclaimer */}
            <div
                style={{
                    background: 'var(--disclaimer-bg)', border: '1px solid var(--disclaimer-border)',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)',
                    marginBottom: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--disclaimer-text)', lineHeight: 1.6,
                }}
            >
                <strong>Verification scope:</strong> This tool checks whether a citation resolves to a real case on
                BAILII or the National Archives. It does <strong>not</strong> currently confirm that the case says what is
                claimed, or that it is correctly applied. Always read the source judgment yourself.
            </div>

            {/* Source selection */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-3)' }}>
                    Select sources to scan
                </h3>

                {/* Case documents (only when a case is selected) */}
                {caseName && docsWithText.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>
                                Case Documents ({docsWithText.length})
                            </span>
                            <button
                                onClick={selectAll}
                                style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Select all
                            </button>
                            <button
                                onClick={selectNone}
                                style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Clear
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: 'var(--space-1)', maxHeight: '220px', overflowY: 'auto' }}>
                            {docsWithText.map((doc) => (
                                <label
                                    key={doc.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                        padding: 'var(--space-1) var(--space-2)',
                                        background: selectedDocIds.has(doc.id) ? '#f0fdfa' : 'transparent',
                                        borderRadius: 'var(--radius)', cursor: 'pointer',
                                        border: selectedDocIds.has(doc.id) ? '1px solid var(--accent)' : '1px solid transparent',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDocIds.has(doc.id)}
                                        onChange={() => toggleDoc(doc.id)}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.filename}</span>
                                    {doc.description && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {doc.description}</span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 'auto' }}>
                                        {Math.round((doc.extracted_text?.length || 0) / 100) / 10}k chars
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {caseName && docsWithText.length === 0 && documents.length > 0 && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--amber-bg)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--amber)' }}>
                        Your case has {documents.length} document{documents.length !== 1 ? 's' : ''} but none have extracted text.
                        Go to <Link to="/documents" style={{ color: 'var(--amber)', fontWeight: 600 }}>Documents</Link> and re-upload to extract text.
                    </div>
                )}

                {caseName && documents.length === 0 && (
                    <div style={{ padding: 'var(--space-3)', background: '#f1f5f9', borderRadius: 'var(--radius)', marginBottom: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No documents uploaded yet. <Link to="/documents">Add documents</Link> to your case, or use the options below.
                    </div>
                )}

                {/* External files + paste toggle */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                    <button className="btn btn-secondary" onClick={handleFilePicker} style={{ fontSize: '0.8rem' }}>
                        📂 Browse Files
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowPaste(!showPaste)}
                        style={{ fontSize: '0.8rem' }}
                    >
                        📋 {showPaste ? 'Hide' : 'Paste Text'}
                    </button>
                    {externalTexts.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', alignSelf: 'center' }}>
                            + {externalTexts.length} external file{externalTexts.length !== 1 ? 's' : ''} loaded
                        </span>
                    )}
                </div>

                {/* Drop zone */}
                <div
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={async (e) => {
                        e.preventDefault();
                        setDragOver(false);
                        // Tauri drag-and-drop provides file paths
                        const paths: string[] = [];
                        if (e.dataTransfer.files) {
                            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                                const file = e.dataTransfer.files[i];
                                // In Tauri, we can access the path property
                                if ((file as any).path) {
                                    paths.push((file as any).path);
                                }
                            }
                        }
                        if (paths.length > 0) {
                            await handleExternalFiles(paths);
                        } else {
                            // Browser fallback: read file contents
                            const texts: string[] = [...externalTexts];
                            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                                const file = e.dataTransfer.files[i];
                                if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                                    const text = await file.text();
                                    if (text.trim()) texts.push(text);
                                }
                            }
                            setExternalTexts(texts);
                        }
                    }}
                    style={{
                        border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        textAlign: 'center',
                        background: dragOver ? '#f0fdfa' : 'transparent',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        marginBottom: showPaste ? 'var(--space-3)' : 0,
                    }}
                    onClick={handleFilePicker}
                >
                    <span style={{ fontSize: '0.8rem', color: dragOver ? 'var(--accent)' : 'var(--text-muted)' }}>
                        Drop PDF, DOCX, EML, or TXT files here — or click to browse
                    </span>
                </div>

                {/* Paste area */}
                {showPaste && (
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Paste text containing citations — e.g. from a skeleton argument, letter before action, or AI output…"
                        style={{
                            width: '100%', minHeight: '100px', padding: 'var(--space-3)',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                            fontFamily: 'var(--font-sans)', fontSize: '0.85rem', lineHeight: 1.6,
                            resize: 'vertical', outline: 'none',
                        }}
                    />
                )}

                {/* Error */}
                {error && (
                    <div style={{ marginTop: 'var(--space-2)', color: 'var(--red)', fontSize: '0.8rem' }}>{error}</div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', alignItems: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleExtract}
                        disabled={
                            isExtracting ||
                            (selectedDocIds.size === 0 && externalTexts.length === 0 && !pasteText.trim())
                        }
                    >
                        {isExtracting ? 'Extracting…' : '1. Extract Citations'}
                    </button>
                    {citations.length > 0 && (
                        <button
                            className="btn btn-primary"
                            onClick={handleVerifyAll}
                            disabled={isVerifying}
                            style={{ background: 'var(--accent-hover)', borderColor: 'var(--accent-hover)' }}
                        >
                            {isVerifying
                                ? `Verifying (${progress.current}/${progress.total})…`
                                : '2. Verify All'}
                        </button>
                    )}
                    {(selectedDocIds.size > 0 || externalTexts.length > 0 || pasteText.trim()) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {selectedDocIds.size} doc{selectedDocIds.size !== 1 ? 's' : ''}
                            {externalTexts.length > 0 && ` + ${externalTexts.length} file${externalTexts.length !== 1 ? 's' : ''}`}
                            {pasteText.trim() && ' + pasted text'}
                        </span>
                    )}
                </div>
            </div>

            {/* Results */}
            <ResultsSection
                citations={citations}
                summaryStats={summaryStats}
                expandedIdx={expandedIdx}
                setExpandedIdx={setExpandedIdx}
                handleVerifySingle={handleVerifySingle}
                isVerifying={isVerifying}
                sourceLabel={sourceLabel}
            />
        </div>
    );
}

// ===== Results section (shared between case and no-case views) =====

function ResultsSection({
    citations,
    summaryStats,
    expandedIdx,
    setExpandedIdx,
    handleVerifySingle,
    isVerifying,
    sourceLabel,
}: {
    citations: VerifiedCitation[];
    summaryStats: { total: number; verified: number; notFound: number; pending: number; errors: number };
    expandedIdx: number | null;
    setExpandedIdx: (idx: number | null) => void;
    handleVerifySingle: (idx: number) => void;
    isVerifying: boolean;
    sourceLabel: string;
}) {
    if (citations.length === 0) return null;

    return (
        <>
            {/* Summary bar */}
            <div
                style={{
                    display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)',
                    flexWrap: 'wrap', alignItems: 'center',
                }}
            >
                <StatBadge label="Total" count={summaryStats.total} color="var(--primary)" bg="#f1f5f9" />
                <StatBadge label="Verified" count={summaryStats.verified} color="var(--green)" bg="var(--green-bg)" />
                <StatBadge label="Not Found" count={summaryStats.notFound} color="var(--red)" bg="var(--red-bg)" />
                <StatBadge label="Pending" count={summaryStats.pending} color="var(--amber)" bg="var(--amber-bg)" />
                {summaryStats.errors > 0 && (
                    <StatBadge label="Errors" count={summaryStats.errors} color="var(--red)" bg="var(--red-bg)" />
                )}
                {sourceLabel && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginLeft: 'auto' }}>
                        {sourceLabel}
                    </span>
                )}
            </div>

            {/* Citation cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {citations.map((cit, idx) => (
                    <CitationCard
                        key={idx}
                        citation={cit}
                        expanded={expandedIdx === idx}
                        onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        onVerify={() => handleVerifySingle(idx)}
                        isVerifying={isVerifying}
                    />
                ))}
            </div>
        </>
    );
}

// ===== Sub-components =====

function StatBadge({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                background: bg, borderRadius: 'var(--radius)', fontSize: '0.8rem',
            }}
        >
            <span style={{ fontWeight: 700, color, fontSize: '1.1rem' }}>{count}</span>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        </div>
    );
}

function CitationCard({
    citation,
    expanded,
    onToggle,
    onVerify,
    isVerifying,
}: {
    citation: VerifiedCitation;
    expanded: boolean;
    onToggle: () => void;
    onVerify: () => void;
    isVerifying: boolean;
}) {
    const [downloading, setDownloading] = useState<string | null>(null);

    const statusConfig = {
        pending: { badge: 'badge-grey', label: 'Pending', icon: '○' },
        resolving: { badge: 'badge-amber', label: 'Verifying…', icon: '◌' },
        verified: { badge: 'badge-green', label: 'Verified', icon: '✓' },
        not_found: { badge: 'badge-red', label: 'Not Found', icon: '✗' },
        error: { badge: 'badge-red', label: 'Error', icon: '!' },
    };

    const config = statusConfig[citation.status];

    /** Check if a candidate is a direct match or just references the citation */
    const isIndirectMatch = (candidate: { title?: string; url: string; resolutionMethod: string }) => {
        // Direct URL construction or citation finder are always direct
        if (
            candidate.resolutionMethod === 'neutral_citation_bailii' ||
            candidate.resolutionMethod === 'neutral_citation_fcl' ||
            candidate.resolutionMethod === 'bailii_citation_finder'
        ) {
            return false;
        }
        // If we have a title, check if it looks like the case we're searching for
        if (candidate.title && citation.caseName) {
            const titleLower = candidate.title.toLowerCase();
            const nameParts = citation.caseName.toLowerCase().split(/\s+v\.?\s+/);
            // If the title contains both party names, it's likely a direct match
            if (nameParts.length === 2 && nameParts[0].length > 1 && nameParts[1].length > 1) {
                const party1Words = nameParts[0].split(/\s+/).filter(w => w.length > 2);
                const party2Words = nameParts[1].split(/\s+/).filter(w => w.length > 2);
                const hasParty1 = party1Words.some(w => titleLower.includes(w));
                const hasParty2 = party2Words.some(w => titleLower.includes(w));
                if (hasParty1 && hasParty2) return false;
            }
        }
        // Check if the citation text appears in the URL (e.g. /2012/772 in URL)
        const yearMatch = citation.citation.match(/\[(\d{4})\]/);
        const numMatch = citation.citation.match(/(\d+)\s*(?:\([A-Za-z]+\))?\s*$/);
        if (yearMatch && numMatch) {
            const url = candidate.url;
            if (url.includes(`/${yearMatch[1]}/`) && url.includes(`/${numMatch[1]}`)) {
                return false; // URL structurally matches the citation
            }
        }
        // Title/fulltext search results are likely indirect if we couldn't confirm above
        if (
            candidate.resolutionMethod === 'bailii_fulltext_search' ||
            candidate.resolutionMethod === 'bailii_title_search' ||
            candidate.resolutionMethod === 'fcl_atom_search'
        ) {
            return true;
        }
        return false;
    };

    /** Download judgment text from a URL */
    const handleDownload = async (url: string, title?: string) => {
        setDownloading(url);
        try {
            const judgment = await invoke<{
                url: string;
                title?: string;
                contentType: string;
                content: string;
                ok: boolean;
            }>('fetch_judgment', { url });

            if (!judgment.ok || !judgment.content) {
                throw new Error('Failed to fetch judgment content');
            }

            // Strip HTML tags for a clean text version
            let text = judgment.content;
            if (judgment.contentType === 'html') {
                // Basic HTML to text conversion
                text = text
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>/gi, '\n\n')
                    .replace(/<\/div>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }

            // Build filename
            const safeName = (title || citation.caseName || citation.citation)
                .replace(/[^a-zA-Z0-9\s\-]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 80);
            const filename = `${safeName}.txt`;

            // Save using Tauri's file dialog
            const { save } = await import('@tauri-apps/plugin-dialog');
            const savePath = await save({
                title: 'Save Judgment',
                defaultPath: filename,
                filters: [{ name: 'Text Files', extensions: ['txt'] }],
            });

            if (savePath) {
                // Write via Tauri FS
                const { writeTextFile } = await import('@tauri-apps/plugin-fs');
                await writeTextFile(savePath, text);
            }
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div
            className="card"
            style={{
                borderLeft: `3px solid ${citation.status === 'verified'
                    ? 'var(--green)'
                    : citation.status === 'not_found'
                        ? 'var(--red)'
                        : citation.status === 'resolving'
                            ? 'var(--amber)'
                            : 'var(--border)'
                    }`,
                transition: 'border-color 0.2s ease',
            }}
        >
            {/* Header row */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}
                onClick={onToggle}
            >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>
                    {citation.caseName && (
                        <span style={{ color: 'var(--primary)', marginRight: 'var(--space-2)' }}>
                            {citation.caseName}
                        </span>
                    )}
                    <span style={{ color: 'var(--accent)' }}>{citation.citation}</span>
                </span>
                <span className={`badge ${config.badge}`}>
                    {config.icon} {config.label}
                </span>
                <span
                    style={{
                        fontSize: '0.7rem', color: 'var(--text-light)',
                        padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px',
                    }}
                >
                    {citation.isNeutral ? 'Neutral' : 'Traditional'}
                </span>
                {citation.status === 'pending' && !isVerifying && (
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={(e) => { e.stopPropagation(); onVerify(); }}
                    >
                        Verify
                    </button>
                )}
                <span
                    style={{
                        fontSize: '0.75rem', color: 'var(--text-light)',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                    }}
                >
                    ▼
                </span>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
                    {/* Source text context */}
                    {citation.sourceText && (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <div style={{
                                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                color: 'var(--text-light)', marginBottom: 'var(--space-1)', letterSpacing: '0.05em',
                            }}>
                                Context
                            </div>
                            <div style={{
                                fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic',
                                background: '#f8fafc', padding: 'var(--space-2)', borderRadius: 'var(--radius)',
                            }}>
                                …{citation.sourceText}…
                            </div>
                        </div>
                    )}

                    {/* Resolution details */}
                    {citation.resolution && (
                        <div>
                            {citation.resolution.candidates.length > 0 && (
                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <div style={{
                                        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                        color: 'var(--text-light)', marginBottom: 'var(--space-1)', letterSpacing: '0.05em',
                                    }}>
                                        Found Sources
                                    </div>
                                    {citation.resolution.candidates.map((c, i) => {
                                        const indirect = isIndirectMatch(c);
                                        return (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                                padding: 'var(--space-1) 0', fontSize: '0.8rem',
                                                flexWrap: 'wrap',
                                            }}>
                                                <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                                                    {c.source === 'bailii' ? 'BAILII' : 'FCL'}
                                                </span>
                                                {indirect && (
                                                    <span style={{
                                                        fontSize: '0.75rem', color: 'var(--amber)',
                                                        padding: '1px 5px', background: 'var(--amber-bg)',
                                                        borderRadius: '3px', fontWeight: 500,
                                                    }}>
                                                        ⚠ Referenced in another judgment
                                                    </span>
                                                )}
                                                <a
                                                    href={c.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: 'var(--accent)', fontSize: '0.8rem', wordBreak: 'break-all', flex: 1 }}
                                                >
                                                    {c.title || c.url}
                                                </a>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                                    {Math.round(c.confidence * 100)}%
                                                </span>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        fontSize: '0.75rem', padding: '1px 6px',
                                                        minWidth: 'auto', opacity: downloading === c.url ? 0.5 : 1,
                                                    }}
                                                    disabled={downloading !== null}
                                                    onClick={(e) => { e.stopPropagation(); handleDownload(c.url, c.title); }}
                                                    title="Save judgment text to file"
                                                >
                                                    {downloading === c.url ? '…' : '💾'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Resolution log */}
                            {citation.resolution.attemptsLog.length > 0 && (
                                <details style={{ fontSize: '0.75rem' }}>
                                    <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                                        Resolution log ({citation.resolution.attemptsLog.length} steps)
                                    </summary>
                                    <div style={{
                                        background: '#f8fafc', padding: 'var(--space-2)', borderRadius: 'var(--radius)',
                                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', lineHeight: 1.8,
                                        color: 'var(--text-muted)',
                                    }}>
                                        {citation.resolution.attemptsLog.map((log, i) => (
                                            <div key={i}>{log}</div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {citation.error && (
                        <div style={{
                            background: 'var(--red-bg)', color: 'var(--red)',
                            padding: 'var(--space-2)', borderRadius: 'var(--radius)', fontSize: '0.8rem',
                        }}>
                            {citation.error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
