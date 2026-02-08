import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';

interface DocumentEntry {
    id: string;
    filename: string;
    path: string;
    folder: string;
    document_type: string;
    date: string | null;
    from: string | null;
    to: string | null;
    description: string;
    tags: string[];
    extracted_text: string | null;
    added_at: string;
}

const FOLDERS: { value: string; label: string; bundleSection: string }[] = [
    { value: '01', label: 'Correspondence', bundleSection: 'D — Correspondence' },
    { value: '02', label: 'Evidence', bundleSection: 'E — Evidence' },
    { value: '03', label: 'Legal', bundleSection: 'A — Claim' },
    { value: '04', label: 'Court', bundleSection: 'C — Orders' },
    { value: '05', label: 'Bundle', bundleSection: 'E — Evidence' },
];

export default function BundleExport() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const caseName = currentCase?.name || '';

    const [documents, setDocuments] = useState<DocumentEntry[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!caseName) {
            setDocuments([]);
            setSelected(new Set());
            return;
        }
        setLoading(true);
        setError(null);
        invoke<DocumentEntry[]>('load_documents_index', { caseName })
            .then((docs) => {
                setDocuments(docs);
                setSelected(new Set(docs.map((d) => d.id)));
                setLoading(false);
            })
            .catch((e) => {
                setError(String(e));
                setLoading(false);
            });
    }, [caseName]);

    const toggleDoc = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleFolder = (docs: DocumentEntry[]) => {
        const folderIds = docs.map((d) => d.id);
        const allSelected = folderIds.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            folderIds.forEach((id) => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(documents.map((d) => d.id)));
    const selectNone = () => setSelected(new Set());

    const handleExport = async () => {
        if (selected.size === 0) return;
        setError(null);
        setSuccess(null);

        try {
            const { save } = await import('@tauri-apps/plugin-dialog');
            const savePath = await save({
                title: 'Save Court Bundle',
                defaultPath: `${caseName.replace(/\s+/g, '_')}_Bundle.zip`,
                filters: [{ name: 'Zip Archive', extensions: ['zip'] }],
            });

            if (!savePath) return;

            setExporting(true);
            const selectedDocs = documents.filter((d) => selected.has(d.id));
            const documentPaths = selectedDocs.map((d) => d.path);

            const result = await invoke<string>('export_bundle', {
                caseName,
                documentPaths,
                exportPath: savePath,
            });

            setSuccess(`Bundle exported to ${result}`);
        } catch (e) {
            setError(String(e));
        } finally {
            setExporting(false);
        }
    };

    // Group documents by folder
    const grouped = FOLDERS.map((f) => ({
        ...f,
        docs: documents.filter((d) => d.folder === f.value),
    })).filter((g) => g.docs.length > 0);

    if (!caseName) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Bundle Export</h1>
                    <p>Export your case documents in a court-bundle-ready structure following CPR PD 32.</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
                        No case selected. Open a case first to export a bundle.
                    </p>
                    <Link to="/cases" className="btn btn-primary">Open a Case</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Bundle Export</h1>
                <p>
                    Export documents from <strong>{caseName}</strong> in a court-bundle-ready zip
                    following CPR PD 32.
                </p>
            </div>

            {/* Development notice */}
            <div
                style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    marginBottom: 'var(--space-4)',
                    fontSize: '0.8rem',
                    color: '#1e40af',
                    lineHeight: 1.6,
                }}
            >
                <strong>In Development</strong>
                <p style={{ margin: '0.375rem 0 0' }}>
                    Bundle export is functional but still being refined. Currently exports a zip archive
                    with documents organised into CPR PD 32 sections. Future updates will add automatic
                    pagination, a generated index page, and configurable document ordering within each
                    section. Check exported bundles carefully before filing.
                </p>
            </div>

            {error && (
                <div className="card" style={{ borderLeft: '3px solid var(--red)', marginBottom: 'var(--space-3)' }}>
                    <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                </div>
            )}

            {success && (
                <div className="card" style={{ borderLeft: '3px solid var(--green)', marginBottom: 'var(--space-3)' }}>
                    <p style={{ color: 'var(--green)', fontSize: '0.85rem', margin: 0 }}>{success}</p>
                </div>
            )}

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading documents...</p>
                </div>
            ) : documents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
                        No documents in this case yet.
                    </p>
                    <Link to="/documents" className="btn btn-primary">Upload Documents</Link>
                </div>
            ) : (
                <>
                    {/* Bundle structure preview */}
                    <div className="info-block" style={{ marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                            The exported zip will organise your documents into CPR PD 32 sections:
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                            <span className="badge">A — Claim</span>
                            <span className="badge">C — Orders</span>
                            <span className="badge">D — Correspondence</span>
                            <span className="badge">E — Evidence</span>
                        </div>
                    </div>

                    {/* Select controls */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                        <button className="btn btn-secondary" onClick={selectAll} style={{ fontSize: '0.8rem' }}>
                            Select All
                        </button>
                        <button className="btn btn-secondary" onClick={selectNone} style={{ fontSize: '0.8rem' }}>
                            Select None
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {selected.size} of {documents.length} selected
                        </span>
                    </div>

                    {/* Document groups */}
                    {grouped.map((group) => {
                        const allSelected = group.docs.every((d) => selected.has(d.id));
                        const someSelected = group.docs.some((d) => selected.has(d.id));
                        return (
                            <div key={group.value} className="card" style={{ marginBottom: 'var(--space-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected && !allSelected;
                                        }}
                                        onChange={() => toggleFolder(group.docs)}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {group.label}
                                    </span>
                                    <span className="badge" style={{ fontSize: '0.75rem' }}>
                                        {group.bundleSection}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {group.docs.length} file{group.docs.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.5rem' }}>
                                    {group.docs.map((doc) => (
                                        <label
                                            key={doc.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-2)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                padding: '0.25rem 0',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.has(doc.id)}
                                                onChange={() => toggleDoc(doc.id)}
                                                style={{ accentColor: 'var(--accent)' }}
                                            />
                                            <span style={{ flex: 1 }}>{doc.filename}</span>
                                            {doc.date && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {doc.date}
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Export button */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleExport}
                            disabled={exporting || selected.size === 0}
                        >
                            {exporting ? 'Exporting...' : `Export Bundle (${selected.size} files)`}
                        </button>
                        <Link to="/documents" className="btn btn-secondary">
                            Back to Documents
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
