import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useCaseStore } from '../../hooks/useCase';
import { Link } from 'react-router-dom';
import type { ChronologyEntry } from '../../types/ai';

/* ── colour tokens ── */
const SIG_COLORS: Record<string, { dot: string; badge: string; badgeText: string }> = {
    key: { dot: '#059669', badge: '#ecfdf5', badgeText: '#065f46' },
    supporting: { dot: '#0284c7', badge: '#e0f2fe', badgeText: '#0c4a6e' },
    background: { dot: '#94a3b8', badge: '#f1f5f9', badgeText: '#475569' },
};

const CONF_DOT: Record<string, string> = {
    high: '#059669',
    medium: '#d97706',
    low: '#dc2626',
};

/* ── helpers ── */
function formatDate(iso: string): string {
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
    const updateChronologyEntry = useCaseStore((s) => s.updateChronologyEntry);
    const scanDocumentsForDates = useCaseStore((s) => s.scanDocumentsForDates);

    const caseName = currentCase?.name || '';

    // Scan state
    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState<ChronologyEntry[] | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [addingSelected, setAddingSelected] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editSig, setEditSig] = useState<'key' | 'supporting' | 'background'>('supporting');
    const [saving, setSaving] = useState(false);

    // Source text viewer
    const [sourceTextId, setSourceTextId] = useState<string | null>(null);
    const [sourceText, setSourceText] = useState<string | null>(null);
    const [loadingSource, setLoadingSource] = useState(false);

    // Manual add state
    const [showAdd, setShowAdd] = useState(false);
    const [addDate, setAddDate] = useState('');
    const [addDesc, setAddDesc] = useState('');
    const [addSig, setAddSig] = useState<'key' | 'supporting' | 'background'>('supporting');
    const [addingSaving, setAddingSaving] = useState(false);

    if (!currentCase) {
        return (
            <div className="page" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No case selected. <Link to="/cases">Select or create a case</Link> first.
                </p>
            </div>
        );
    }

    /* ── Scan handlers ── */
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

    /* ── Edit handlers ── */
    const startEdit = (entry: ChronologyEntry) => {
        setEditingId(entry.id);
        setEditDate(entry.date);
        setEditDesc(entry.description);
        setEditSig(entry.significance);
        if (sourceTextId !== entry.id) {
            setSourceTextId(null);
            setSourceText(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setSourceTextId(null);
        setSourceText(null);
    };

    const handleSaveEdit = async (entry: ChronologyEntry) => {
        setSaving(true);
        await updateChronologyEntry({
            ...entry,
            date: editDate,
            description: editDesc,
            significance: editSig,
        });
        setSaving(false);
        setEditingId(null);
    };

    const handleViewSource = async (entry: ChronologyEntry) => {
        if (sourceTextId === entry.id) {
            setSourceTextId(null);
            setSourceText(null);
            return;
        }
        if (!entry.source_document_path) return;
        setLoadingSource(true);
        setSourceTextId(entry.id);
        try {
            const text = await invoke<string>('read_file_text', {
                caseName,
                relativePath: entry.source_document_path,
            });
            setSourceText(text);
        } catch (e) {
            setSourceText(`Could not load source: ${e}`);
        }
        setLoadingSource(false);
    };

    /* ── Manual add handler ── */
    const handleManualAdd = async () => {
        if (!addDate.trim() || !addDesc.trim()) return;
        setAddingSaving(true);
        await addChronologyEntry({
            id: crypto.randomUUID(),
            date: addDate.trim(),
            description: addDesc.trim(),
            source: 'manual',
            significance: addSig,
        });
        setAddDate('');
        setAddDesc('');
        setAddSig('supporting');
        setShowAdd(false);
        setAddingSaving(false);
    };

    /* ── Sort chronology by date ── */
    const sortedChronology = [...chronology].sort((a, b) => a.date.localeCompare(b.date));

    /* ── render ── */
    return (
        <div className="page">
            {/* Header */}
            <div className="page-header">
                <h1>Chronology</h1>
                <p>
                    <strong style={{ color: 'var(--primary)' }}>{currentCase.name}</strong>
                    {' — '}Timeline of key events, drawn from documents and case details.
                    Click any entry to edit.
                </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
                    {scanning ? 'Scanning…' : 'Scan Documents for Dates'}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowAdd(!showAdd)}
                >
                    {showAdd ? 'Cancel' : '+ Add Entry'}
                </button>
            </div>

            {/* ── Manual add form ── */}
            {showAdd && (
                <div className="card" style={{ marginBottom: 'var(--space-4)', borderLeft: '3px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-3)' }}>Add manual entry</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 'var(--space-2)', alignItems: 'start' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Date</label>
                            <input
                                type="date"
                                value={addDate}
                                onChange={(e) => setAddDate(e.target.value)}
                                style={{
                                    width: '100%', padding: '6px 8px', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Description</label>
                            <input
                                type="text"
                                value={addDesc}
                                onChange={(e) => setAddDesc(e.target.value)}
                                placeholder="What happened on this date?"
                                style={{
                                    width: '100%', padding: '6px 8px', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Significance</label>
                            <select
                                value={addSig}
                                onChange={(e) => setAddSig(e.target.value as typeof addSig)}
                                style={{
                                    padding: '6px 8px', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                }}
                            >
                                <option value="key">Key</option>
                                <option value="supporting">Supporting</option>
                                <option value="background">Background</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: 'var(--space-3)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleManualAdd}
                            disabled={!addDate.trim() || !addDesc.trim() || addingSaving}
                            style={{ fontSize: '0.85rem' }}
                        >
                            {addingSaving ? 'Adding…' : 'Add to Timeline'}
                        </button>
                    </div>
                </div>
            )}

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
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                                {scanResults.map((entry) => (
                                    <label
                                        key={entry.id}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                                            padding: '8px 12px', borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer', background: selectedIds.has(entry.id) ? '#f0fdfa' : 'transparent',
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
                                                {entry.source_document_path && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        from {entry.source_document_path.split(/[/\\]/).pop()}
                                                    </span>
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
            {sortedChronology.length === 0 && scanResults === null ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        No events yet. Upload documents and press "Scan Documents for Dates" to build your timeline,
                        or use "+ Add Entry" to add events manually.
                    </p>
                </div>
            ) : sortedChronology.length > 0 ? (
                <>
                    {/* Column header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '110px 1fr auto',
                        gap: '0 var(--space-3)',
                        padding: '0 0 6px',
                        borderBottom: '2px solid var(--border)',
                        marginBottom: 'var(--space-2)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                    }}>
                        <span>Date</span>
                        <span>Event</span>
                        <span>Source</span>
                    </div>

                    {sortedChronology.map((entry, i) => {
                        const sig = SIG_COLORS[entry.significance] || SIG_COLORS.background;
                        const prevDate = i > 0 ? sortedChronology[i - 1].date : null;
                        const showDate = entry.date !== prevDate;
                        const sourceDoc = entry.source_document_path?.split(/[/\\]/).pop();
                        const isEditing = editingId === entry.id;
                        const isShowingSource = sourceTextId === entry.id;

                        return (
                            <div key={entry.id}>
                                {/* Entry row */}
                                <div
                                    role={isEditing ? undefined : 'button'}
                                    tabIndex={isEditing ? undefined : 0}
                                    onClick={() => {
                                        if (!isEditing) startEdit(entry);
                                    }}
                                    onKeyDown={(e) => {
                                        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            startEdit(entry);
                                        }
                                    }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '110px 1fr auto',
                                        gap: '0 var(--space-3)',
                                        padding: '8px 0',
                                        borderBottom: isEditing ? 'none' : '1px solid var(--border)',
                                        alignItems: 'flex-start',
                                        cursor: isEditing ? 'default' : 'pointer',
                                        background: isEditing ? '#f8fafc' : 'transparent',
                                        borderRadius: isEditing ? 'var(--radius) var(--radius) 0 0' : undefined,
                                    }}
                                >
                                    {/* Date column */}
                                    <div style={{ paddingTop: 1 }}>
                                        {showDate && (
                                            <span style={{
                                                fontWeight: 600, fontSize: '0.8rem',
                                                color: 'var(--text)', whiteSpace: 'nowrap',
                                            }}>
                                                {formatDate(entry.date)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Event column */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: sig.dot, flexShrink: 0,
                                            }} />
                                            <span style={{ fontSize: '0.85rem', lineHeight: 1.4, color: '#1e293b' }}>
                                                {entry.description}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, marginTop: 3, marginLeft: 14 }}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '1px 6px', borderRadius: 3,
                                                background: sig.badge, color: sig.badgeText,
                                                textTransform: 'capitalize', fontWeight: 500,
                                            }}>
                                                {entry.significance}
                                            </span>
                                            {entry.confidence && (
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '1px 6px', borderRadius: 3,
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
                                            <span
                                                style={{
                                                    fontSize: '0.75rem', color: 'var(--accent)',
                                                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap', display: 'block',
                                                }}
                                                title={entry.source_document_path}
                                            >
                                                {sourceDoc}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {entry.source === 'manual' ? 'Manual' : entry.source === 'intake' ? 'Case details' : ''}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Remove this chronology entry?\n\n"${entry.description.slice(0, 80)}${entry.description.length > 80 ? '…' : ''}"`)) {
                                                    removeChronologyEntry(entry.id);
                                                }
                                            }}
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

                                {/* ── Inline edit panel ── */}
                                {isEditing && (
                                    <div style={{
                                        background: '#f8fafc', border: '1px solid var(--border)',
                                        borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
                                        padding: 'var(--space-3) var(--space-4)',
                                        marginBottom: 'var(--space-2)',
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 'var(--space-2)', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Date</label>
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '5px 8px', border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Description</label>
                                                <textarea
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    rows={2}
                                                    style={{
                                                        width: '100%', padding: '5px 8px', border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                                        resize: 'vertical',
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Significance</label>
                                                <select
                                                    value={editSig}
                                                    onChange={(e) => setEditSig(e.target.value as typeof editSig)}
                                                    style={{
                                                        padding: '5px 8px', border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                                                    }}
                                                >
                                                    <option value="key">Key</option>
                                                    <option value="supporting">Supporting</option>
                                                    <option value="background">Background</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleSaveEdit(entry)}
                                                disabled={saving || !editDate.trim() || !editDesc.trim()}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                {saving ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={cancelEdit}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                Cancel
                                            </button>
                                            {entry.source_document_path && (
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => handleViewSource(entry)}
                                                    style={{ fontSize: '0.8rem', marginLeft: 'auto' }}
                                                >
                                                    {isShowingSource ? 'Hide Source' : 'View Source Document'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Source document text */}
                                        {isShowingSource && (
                                            <div style={{
                                                marginTop: 'var(--space-3)', border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)', background: 'white',
                                                maxHeight: '300px', overflow: 'auto',
                                            }}>
                                                <div style={{
                                                    padding: '6px 12px', borderBottom: '1px solid var(--border)',
                                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                                                    background: '#f8fafc', position: 'sticky', top: 0,
                                                }}>
                                                    Source: {entry.source_document_path?.split(/[/\\]/).pop()}
                                                </div>
                                                <div style={{ padding: '12px', fontSize: '0.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                                                    {loadingSource ? 'Loading…' : (sourceText || 'No text extracted from this document.')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                    Confidence: <span style={{ color: CONF_DOT.high }}>●</span> high{' '}
                    <span style={{ color: CONF_DOT.medium }}>●</span> medium{' '}
                    <span style={{ color: CONF_DOT.low }}>●</span> low
                </span>
            </div>

            {/* Hint */}
            {sortedChronology.length > 0 && (
                <div className="citation" style={{ marginTop: 'var(--space-4)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Click any entry to edit its date, description, or significance. Entries from documents
                        include a "View Source Document" button to see the original text. Changes are saved immediately.
                    </p>
                </div>
            )}
        </div>
    );
}
