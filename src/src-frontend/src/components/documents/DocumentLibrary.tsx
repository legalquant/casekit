import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
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

const FOLDERS = [
    { value: '01', label: 'Correspondence' },
    { value: '02', label: 'Evidence' },
    { value: '03', label: 'Legal' },
    { value: '04', label: 'Court' },
    { value: '05', label: 'Bundle' },
];

const DOC_LIMIT_WARN = 100;
const DOC_LIMIT_STRONG = 200;

export default function DocumentLibrary() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const caseName = currentCase?.name || '';

    const [documents, setDocuments] = useState<DocumentEntry[]>([]);
    const [selectedFolder, setSelectedFolder] = useState('02');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Load documents when case changes
    useEffect(() => {
        if (!caseName) return;
        setLoading(true);
        invoke<DocumentEntry[]>('load_documents_index', { caseName })
            .then((docs) => { setDocuments(docs); setLoading(false); })
            .catch((e) => { setError(String(e)); setLoading(false); });
    }, [caseName]);

    const docCount = documents.length;
    const showWarning = docCount >= DOC_LIMIT_WARN;
    const showStrongWarning = docCount >= DOC_LIMIT_STRONG;

    const handleUpload = async () => {
        try {
            const result = await open({
                multiple: true,
                title: 'Select documents to add',
                filters: [
                    {
                        name: 'Documents',
                        extensions: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'txt', 'doc', 'docx', 'eml', 'msg'],
                    },
                ],
            });

            if (!result) return;

            const filePaths: string[] = Array.isArray(result) ? result : [result];
            if (filePaths.length === 0) return;

            setLoading(true);
            setError(null);

            for (const pathStr of filePaths) {
                const filename = pathStr.split(/[\\/]/).pop() || 'unknown';

                try {
                    const copyResult = await invoke<{ relative_path: string; extracted: { text: string; metadata_date: string | null; subject: string | null; from: string | null; to: string | null } | null }>('copy_file_to_case', {
                        caseName,
                        sourcePath: pathStr,
                        folder: selectedFolder,
                        filename,
                    });

                    const ext = copyResult.extracted;

                    const newDoc: DocumentEntry = {
                        id: crypto.randomUUID(),
                        filename,
                        path: copyResult.relative_path,
                        folder: selectedFolder,
                        document_type: 'other',
                        date: ext?.metadata_date || null,
                        from: ext?.from || null,
                        to: ext?.to || null,
                        description: ext?.subject || '',
                        tags: [],
                        extracted_text: ext?.text || null,
                        added_at: new Date().toISOString(),
                    };

                    const updated = await invoke<DocumentEntry[]>('add_document_metadata', {
                        caseName,
                        document: newDoc,
                    });
                    setDocuments(updated);
                } catch (e) {
                    setError(`Failed to import ${filename}: ${e}`);
                }
            }

            setLoading(false);
        } catch (e) {
            setError(`Upload failed: ${e}`);
            setLoading(false);
        }
    };

    if (!caseName) {
        return (
            <div className="page" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No case selected. <Link to="/cases">Select or create a case</Link> first.
                </p>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Documents</h1>
                <p>
                    <strong style={{ color: 'var(--color-primary)' }}>{caseName}</strong>
                    {' — '}Upload and organise your case documents. Files are stored locally in your
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>
                        Documents/CaseKit/
                    </code> folder.
                    <Link to="/cases" style={{ marginLeft: '0.75rem', fontSize: '0.85rem' }}>Switch case</Link>
                </p>
            </div>

            <div
                style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    marginBottom: 'var(--space-4)',
                    lineHeight: 1.5,
                }}
            >
                <strong>Keep everything.</strong> Once you think a dispute might end up in court, you should
                keep all related documents — emails, letters, receipts, photographs, messages, notes. Do not
                delete, edit, or discard anything, even if it seems unhelpful. The court expects both sides to
                preserve relevant materials, and destroying or withholding documents can count against you.
            </div>

            {showStrongWarning && (
                <div className="info-block" style={{ borderColor: '#fca5a5', background: 'var(--red-bg)', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ color: 'var(--red)', fontSize: '0.9rem' }}>{docCount} documents in this case</h3>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                        Cases with this many documents may be too complex for self-representation.
                        Consider seeking professional advice — see <Link to="/help">Find Help</Link>.
                    </p>
                </div>
            )}
            {showWarning && !showStrongWarning && (
                <div className="info-block" style={{ borderColor: 'var(--disclaimer-border)', background: 'var(--amber-bg)', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ color: 'var(--amber)', fontSize: '0.9rem' }}>{docCount} documents</h3>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                        A typical small claims consumer dispute involves 10–30 documents. If your case requires
                        significantly more, it may benefit from professional assistance.
                    </p>
                </div>
            )}

            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-1)', color: 'var(--text-muted)' }}>
                            Destination folder
                        </label>
                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            style={{
                                padding: 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                fontSize: '0.875rem',
                                fontFamily: 'var(--font-sans)',
                                background: 'white',
                            }}
                        >
                            {FOLDERS.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                        {loading ? 'Importing…' : 'Add Files'}
                    </button>
                    <Link to="/how-to-save-emails" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                        How to save emails
                    </Link>
                </div>
                {error && (
                    <div style={{ marginTop: 'var(--space-2)', color: 'var(--red)', fontSize: '0.85rem' }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Parsing accuracy disclaimer */}
            <div
                style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    color: '#0c4a6e',
                    marginBottom: 'var(--space-4)',
                    lineHeight: 1.5,
                }}
            >
                <strong>About automatic text extraction</strong>
                <ul style={{ margin: '0.375rem 0 0', paddingLeft: '1.25rem' }}>
                    <li>Text-based PDFs, .docx files (including tables), .eml emails, and plain text files are extracted automatically.</li>
                    <li><strong>Scanned documents and images</strong> are processed with OCR (Tesseract). Results depend on scan quality — clean, straight scans work best.</li>
                    <li><strong>Tables</strong> in PDFs may not preserve their structure. Tables in .docx files are extracted cell-by-cell.</li>
                    <li><strong>Handwriting</strong> has limited OCR accuracy. If a handwritten document is important, consider typing its key content using the edit button.</li>
                    <li>You can always <strong>review and correct</strong> extracted text by clicking on any document below.</li>
                </ul>
            </div>

            {/* Upload guidance */}
            <div
                style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    color: '#5b21b6',
                    marginBottom: 'var(--space-4)',
                    lineHeight: 1.5,
                }}
            >
                <strong>Upload guidance</strong>
                <ul style={{ margin: '0.375rem 0 0', paddingLeft: '1.25rem' }}>
                    <li>Save emails as <strong>.eml files</strong> for best results — the date, sender, and subject are extracted automatically. See <Link to="/how-to-save-emails" style={{ color: '#5b21b6', fontWeight: 500 }}>how to save emails</Link>.</li>
                    <li>Use <strong>.docx</strong> format (not .doc) where possible — tables and text are fully extracted.</li>
                    <li>For scanned letters, check if your scanner has an OCR option that produces text-based PDFs.</li>
                    <li>Organise files into the right category using the folder picker above — this helps when building your court bundle.</li>
                </ul>
            </div>

            {documents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.9rem' }}>No documents yet. Upload files or see <Link to="/how-to-save-emails">how to save emails</Link> for import guidance.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {FOLDERS.map((folder) => {
                        const folderDocs = documents.filter((d) => d.folder === folder.value);
                        if (folderDocs.length === 0) return null;
                        return (
                            <div key={folder.value}>
                                <div className="section-label" style={{ marginBottom: 'var(--space-1)' }}>
                                    {folder.label} ({folderDocs.length})
                                </div>
                                {folderDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="card"
                                        style={{
                                            padding: 'var(--space-2) var(--space-3)',
                                            marginBottom: 'var(--space-1)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                if (editingDocId === doc.id) {
                                                    setEditingDocId(null);
                                                } else {
                                                    setEditingDocId(doc.id);
                                                    setEditText(doc.extracted_text || '');
                                                }
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.filename}</div>
                                                {doc.description && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.description}</div>
                                                )}
                                                {doc.from && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From: {doc.from}</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                                {doc.date && <span className="badge badge-accent">{doc.date}</span>}
                                                {doc.extracted_text ? (
                                                    <span className="badge badge-grey" style={{ fontSize: '0.7rem' }}>✓ text</span>
                                                ) : (
                                                    <span className="badge badge-grey" style={{ fontSize: '0.7rem', opacity: 0.5 }}>no text</span>
                                                )}
                                                {doc.tags.map((tag) => (
                                                    <span key={tag} className="badge badge-grey">{tag}</span>
                                                ))}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Remove "${doc.filename}" from this case? The file will be removed from the case folder.`)) {
                                                            try {
                                                                const updated = await invoke<DocumentEntry[]>('remove_document_metadata', {
                                                                    caseName,
                                                                    documentId: doc.id,
                                                                });
                                                                setDocuments(updated);
                                                            } catch (e) {
                                                                setError(`Failed to remove: ${e}`);
                                                            }
                                                        }
                                                    }}
                                                    title={`Remove ${doc.filename}`}
                                                    aria-label={`Remove document ${doc.filename}`}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.8rem',
                                                        padding: '2px 4px',
                                                        borderRadius: '3px',
                                                        marginLeft: 'var(--space-1)',
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable text editor */}
                                        {editingDocId === doc.id && (
                                            <div style={{ marginTop: 'var(--space-2)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-2)' }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                                                    Extracted text — edit or add content manually
                                                </label>
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    rows={8}
                                                    style={{
                                                        width: '100%',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '0.8rem',
                                                        padding: 'var(--space-2)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius)',
                                                        resize: 'vertical',
                                                        lineHeight: 1.5,
                                                    }}
                                                    placeholder="No text was extracted from this file. You can type or paste content here manually — this text is used for date scanning and AI analysis."
                                                />
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}
                                                        onClick={async () => {
                                                            const updatedDoc = { ...doc, extracted_text: editText };
                                                            try {
                                                                const updated = await invoke<DocumentEntry[]>('add_document_metadata', {
                                                                    caseName,
                                                                    document: updatedDoc,
                                                                });
                                                                setDocuments(updated);
                                                                setEditingDocId(null);
                                                            } catch (e) {
                                                                setError(`Failed to save: ${e}`);
                                                            }
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ fontSize: '0.8rem', padding: '0.375rem 0.75rem' }}
                                                        onClick={() => setEditingDocId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="citation" style={{ marginTop: 'var(--space-4)' }}>
                <strong>Supported formats:</strong> PDF, Word (.docx), images (JPG, PNG), text files, .eml email files.
                Maximum file size: 25MB. Files are copied to your case folder — originals are not modified.
                Click any document to view or edit its extracted text.
            </div>
        </div>
    );
}
