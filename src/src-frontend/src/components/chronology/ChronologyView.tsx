import { useState } from 'react';
import { useCaseStore } from '../../hooks/useCase';
import { Link } from 'react-router-dom';
import type { ChronologyEntry } from '../../types/ai';

/* ── colour tokens ── */
const SIG_COLORS: Record<string, { dot: string; border: string; badge: string; badgeText: string }> = {
    key: { dot: '#059669', border: '#059669', badge: '#ecfdf5', badgeText: '#065f46' },
    supporting: { dot: '#0284c7', border: '#0ea5e9', badge: '#e0f2fe', badgeText: '#0c4a6e' },
    background: { dot: '#94a3b8', border: '#cbd5e1', badge: '#f1f5f9', badgeText: '#475569' },
};

const CONF_DOT: Record<string, string> = {
    high: '#059669',
    medium: '#d97706',
    low: '#dc2626',
};

/* ── helpers ── */
function formatDate(iso: string): string {
    // yyyy-mm-dd → "5 Oct 2025", yyyy-mm → "Oct 2025"
    const parts = iso.split('-');
    if (parts.length < 2) return iso;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const y = parts[0];
    const m = months[parseInt(parts[1], 10) - 1] || parts[1];
    if (parts.length === 2) return `${m} ${y}`;
    const d = parseInt(parts[2], 10);
    return `${d} ${m} ${y}`;
}

const SOURCE_ICON: Record<string, string> = {
    manual: '✏️',
    document: '📄',
    intake: '📋',
    ai_extracted: '🤖',
};

/* ── component ── */
export default function ChronologyView() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const chronology = useCaseStore((s) => s.chronology);
    const addChronologyEntry = useCaseStore((s) => s.addChronologyEntry);
    const removeChronologyEntry = useCaseStore((s) => s.removeChronologyEntry);
    const scanDocumentsForDates = useCaseStore((s) => s.scanDocumentsForDates);

    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState<ChronologyEntry[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [addingSelected, setAddingSelected] = useState(false);

    if (!currentCase) {
        return (
            <div className="page" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No case selected. <Link to="/cases">Select or create a case</Link> first.
                </p>
            </div>
        );
    }

    const handleScan = async () => {
        setScanning(true);
        try {
            const results = await scanDocumentsForDates();
            setScanResults(results);
            setSelectedIds(new Set(results.map((r) => r.id)));
        } catch (e) {
            console.error(e);
        }
        setScanning(false);
    };

    const toggleId = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleAddSelected = async () => {
        if (!scanResults) return;
        setAddingSelected(true);
        for (const entry of scanResults) {
            if (selectedIds.has(entry.id)) {
                await addChronologyEntry(entry);
            }
        }
        setScanResults(null);
        setSelectedIds(new Set());
        setAddingSelected(false);
    };

    const handleDismissScan = () => {
        setScanResults(null);
        setSelectedIds(new Set());
    };

    /* ── render ── */
    return (
        <div className="page" style={{ maxWidth: '52rem' }}>
            {/* Header */}
            <div className="page-header">
                <h1>Chronology</h1>
                <p>
                    <strong style={{ color: 'var(--color-primary)' }}>{currentCase.name}</strong>
                    {' — '}Timeline of key events in your case, drawn from documents and case details.
                </p>
            </div>

            {/* Scan button */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
                    {scanning ? 'Scanning…' : '🔍 Scan Documents for Dates'}
                </button>
            </div>

            {/* ── Scan results review ── */}
            {scanResults !== null && (
                <div className="card" style={{ marginBottom: 'var(--space-4)', borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <div>
                            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>
                                Scan Results — {scanResults.length} date{scanResults.length !== 1 ? 's' : ''} found
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                                Review the dates below. Uncheck any you don't want, then click "Add Selected".
                            </p>
                        </div>
                        <button className="btn btn-secondary" onClick={handleDismissScan} style={{ fontSize: '0.8rem' }}>
                            Dismiss
                        </button>
                    </div>

                    {scanResults.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: 'var(--space-3) 0' }}>
                            No new dates found. Try uploading more documents or check that documents have extracted text.
                        </p>
                    ) : (
                        <>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
                                {scanResults.map((entry) => (
                                    <label
                                        key={entry.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 'var(--space-2)',
                                            padding: '8px 12px',
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: selectedIds.has(entry.id) ? '#f0fdfa' : 'transparent',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(entry.id)}
                                            onChange={() => toggleId(entry.id)}
                                            style={{ marginTop: '0.2rem', accentColor: 'var(--accent)' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{formatDate(entry.date)}</span>
                                                {entry.confidence && (
                                                    <span style={{
                                                        width: 6, height: 6, borderRadius: '50%',
                                                        background: CONF_DOT[entry.confidence] || '#94a3b8',
                                                        display: 'inline-block',
                                                    }} title={`${entry.confidence} confidence`} />
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#475569', margin: '2px 0 0', lineHeight: 1.4 }}>
                                                {entry.description}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', alignItems: 'center' }}>
                                <button className="btn btn-primary" onClick={handleAddSelected} disabled={selectedIds.size === 0 || addingSelected}>
                                    {addingSelected ? 'Adding…' : `Add ${selectedIds.size} Selected`}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        if (selectedIds.size === scanResults.length) setSelectedIds(new Set());
                                        else setSelectedIds(new Set(scanResults.map((r) => r.id)));
                                    }}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    {selectedIds.size === scanResults.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Timeline ── */}
            {chronology.length === 0 && scanResults === null ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        No events yet. Upload documents and press "Scan Documents for Dates" to build your timeline,
                        or add entries manually from the Case Overview.
                    </p>
                </div>
            ) : chronology.length > 0 ? (
                <>
                    {/* Column header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr auto',
                        gap: '0 var(--space-3)',
                        padding: '0 0 6px',
                        borderBottom: '2px solid var(--border)',
                        marginBottom: 'var(--space-2)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                    }}>
                        <span>Date</span>
                        <span>Event</span>
                        <span>Source</span>
                    </div>

                    {chronology.map((entry, i) => {
                        const sig = SIG_COLORS[entry.significance] || SIG_COLORS.background;
                        // Group: show date header only for first entry of a new date
                        const prevDate = i > 0 ? chronology[i - 1].date : null;
                        const showDate = entry.date !== prevDate;
                        const sourceDoc = entry.source_document_path?.split(/[/\\]/).pop();

                        return (
                            <div
                                key={entry.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '100px 1fr auto',
                                    gap: '0 var(--space-3)',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border)',
                                    alignItems: 'flex-start',
                                }}
                            >
                                {/* Date column */}
                                <div style={{ paddingTop: 1 }}>
                                    {showDate && (
                                        <span style={{
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            color: 'var(--color-text)',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {formatDate(entry.date)}
                                        </span>
                                    )}
                                </div>

                                {/* Event column */}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {/* Significance dot */}
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: sig.dot, flexShrink: 0,
                                        }} />
                                        <span style={{ fontSize: '0.85rem', lineHeight: 1.4, color: '#1e293b' }}>
                                            {entry.description}
                                        </span>
                                    </div>
                                    {/* Significance + confidence badges */}
                                    <div style={{ display: 'flex', gap: 4, marginTop: 3, marginLeft: 14 }}>
                                        <span style={{
                                            fontSize: '0.6rem',
                                            padding: '1px 6px',
                                            borderRadius: 3,
                                            background: sig.badge,
                                            color: sig.badgeText,
                                            textTransform: 'capitalize',
                                            fontWeight: 500,
                                        }}>
                                            {entry.significance}
                                        </span>
                                        {entry.confidence && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                padding: '1px 6px',
                                                borderRadius: 3,
                                                background: '#f1f5f9',
                                                color: CONF_DOT[entry.confidence] || '#475569',
                                                fontWeight: 500,
                                            }}>
                                                {entry.confidence}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Source column + delete */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 1 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {SOURCE_ICON[entry.source] || ''}
                                    </span>
                                    {sourceDoc ? (
                                        <Link
                                            to="/documents"
                                            style={{ fontSize: '0.72rem', color: 'var(--accent)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                            title={entry.source_document_path}
                                        >
                                            {sourceDoc}
                                        </Link>
                                    ) : (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {entry.source === 'manual' ? 'Manual' : entry.source === 'intake' ? 'Case details' : ''}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => removeChronologyEntry(entry.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#cbd5e1', fontSize: '0.8rem', padding: '2px',
                                            borderRadius: '3px', lineHeight: 1,
                                        }}
                                        title="Remove entry"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </>
            ) : null}

            {/* Legend */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {Object.entries(SIG_COLORS).map(([key, s]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
                        <span style={{ textTransform: 'capitalize' }}>{key}</span>
                    </div>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    Confidence: <span style={{ color: CONF_DOT.high }}>●</span> high{' '}
                    <span style={{ color: CONF_DOT.medium }}>●</span> medium{' '}
                    <span style={{ color: CONF_DOT.low }}>●</span> low
                </span>
            </div>
        </div>
    );
}
