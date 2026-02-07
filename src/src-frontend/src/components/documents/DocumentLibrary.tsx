import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Link } from 'react-router-dom';

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
    const [documents, setDocuments] = useState<DocumentEntry[]>([]);
    const [caseName] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('02');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    const relativePath = await invoke<string>('copy_file_to_case', {
                        caseName,
                        sourcePath: pathStr,
                        folder: selectedFolder,
                        filename,
                    });

                    const newDoc: DocumentEntry = {
                        id: crypto.randomUUID(),
                        filename,
                        path: relativePath,
                        folder: selectedFolder,
                        document_type: 'other',
                        date: null,
                        from: null,
                        to: null,
                        description: '',
                        tags: [],
                        extracted_text: null,
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

    return (
        <div className="page">
            <div className="page-header">
                <h1>Documents</h1>
                <p>
                    Upload and organise your case documents. Files are stored locally in your
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>
                        Documents/CaseKit/
                    </code> folder.
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
                    <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !caseName}>
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
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.filename}</div>
                                            {doc.description && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.description}</div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                            {doc.date && <span className="badge badge-accent">{doc.date}</span>}
                                            {doc.tags.map((tag) => (
                                                <span key={tag} className="badge badge-grey">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="citation" style={{ marginTop: 'var(--space-4)' }}>
                <strong>Supported formats:</strong> PDF, images (JPG, PNG), text files, .eml email files.
                Maximum file size: 25MB. Files are copied to your case folder — originals are not modified.
            </div>
        </div>
    );
}
