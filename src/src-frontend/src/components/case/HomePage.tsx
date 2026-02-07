import { useState, useEffect } from 'react';
import type { UserRole } from '../../types/case';
import { useNavigate, Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';

export default function HomePage() {
    const { cases, loadCases, selectCase, loading, error } = useCaseStore();
    const deleteCase = useCaseStore((s) => s.deleteCase);
    const navigate = useNavigate();
    const [showNewCase, setShowNewCase] = useState(false);
    const [newCaseName, setNewCaseName] = useState('');
    const [claimantName, setClaimantName] = useState('');
    const [defendantName, setDefendantName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('claimant');
    const [createError, setCreateError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deleteInput, setDeleteInput] = useState('');

    useEffect(() => {
        loadCases();
    }, []);

    const handleCreateCase = async () => {
        if (!newCaseName.trim() || !claimantName.trim() || !defendantName.trim()) {
            setCreateError('Please fill in all fields');
            return;
        }
        try {
            setCreateError(null);
            await useCaseStore.getState().createNewCase(
                newCaseName.trim(),
                claimantName.trim(),
                defendantName.trim(),
                newRole
            );
            navigate('/case/overview');
        } catch (e) {
            setCreateError(String(e));
        }
    };

    const handleOpenCase = async (caseName: string) => {
        await selectCase(caseName);
        navigate('/case/overview');
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Welcome to CaseKit
                </h1>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Structured self-help for consumer disputes in England &amp; Wales
                </p>
            </div>

            {error && (
                <div className="card" style={{ borderColor: 'var(--color-critical)', background: '#fff5f5', marginBottom: '1rem' }}>
                    <p style={{ color: 'var(--color-critical)', fontSize: '0.875rem' }}>⚠️ {error}</p>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                {/* New Case */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Start a New Case
                    </h2>
                    {!showNewCase ? (
                        <button className="btn btn-primary" onClick={() => setShowNewCase(true)} style={{ width: '100%' }}>
                            + New Case
                        </button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Role selector */}
                            <div>
                                <label className="label">You are the…</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className={`btn ${newRole === 'claimant' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setNewRole('claimant')}
                                        style={{ flex: 1 }}
                                    >
                                        Claimant
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${newRole === 'defendant' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setNewRole('defendant')}
                                        style={{ flex: 1 }}
                                    >
                                        Defendant
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label">Case Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Smith v Acme Ltd"
                                    value={newCaseName}
                                    onChange={(e) => setNewCaseName(e.target.value)}
                                    aria-label="Case name"
                                />
                            </div>
                            <div>
                                <label className="label">{newRole === 'claimant' ? 'Your Name (Claimant)' : 'Claimant Name'}</label>
                                <input
                                    className="input"
                                    placeholder={newRole === 'claimant' ? 'Your name' : 'Claimant name'}
                                    value={claimantName}
                                    onChange={(e) => setClaimantName(e.target.value)}
                                    aria-label="Claimant name"
                                />
                            </div>
                            <div>
                                <label className="label">{newRole === 'defendant' ? 'Your Name (Defendant)' : "Defendant's Name"}</label>
                                <input
                                    className="input"
                                    placeholder={newRole === 'defendant' ? 'Your name or company' : 'Company or individual name'}
                                    value={defendantName}
                                    onChange={(e) => setDefendantName(e.target.value)}
                                    aria-label="Defendant name"
                                />
                            </div>
                            {createError && (
                                <p style={{ color: 'var(--color-critical)', fontSize: '0.8rem' }}>{createError}</p>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={handleCreateCase} disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Case'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowNewCase(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Existing Cases */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Open Existing Case
                    </h2>
                    {loading ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading cases...</p>
                    ) : cases.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                No cases yet. Create your first case to get started.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {cases.map((c) => (
                                <div key={c.id} style={{ display: 'flex', gap: '0.25rem', alignItems: 'stretch' }}>
                                    <button
                                        onClick={() => handleOpenCase(c.name)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '0.375rem 0 0 0.375rem',
                                            background: 'white',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.15s',
                                            textAlign: 'left',
                                            flex: 1,
                                        }}
                                        aria-label={`Open case ${c.name}`}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</p>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                                {c.claimant_name} v {c.defendant_name}
                                            </p>
                                        </div>
                                        <span className="badge badge-grey" style={{ textTransform: 'capitalize' }}>
                                            {c.status.replace('_', ' ')}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.name); setDeleteInput(''); }}
                                        title={`Delete case ${c.name}`}
                                        aria-label={`Delete case ${c.name}`}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--color-border)',
                                            borderLeft: 'none',
                                            borderRadius: '0 0.375rem 0.375rem 0',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            padding: '0 0.5rem',
                                            fontSize: '0.8rem',
                                            transition: 'color 0.15s, background 0.15s',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Info */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    What CaseKit Helps You With
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                        <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>📋 Organise Evidence</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Upload and tag documents, build a chronology of events
                        </p>
                    </div>
                    <div>
                        <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>🔄 Know the Process</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Step-by-step guide through CRA 2015 consumer claims
                        </p>
                    </div>
                    <div>
                        <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>🤖 AI Analysis</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Get structured merits analysis using your own <Link to="/api-setup" style={{ fontWeight: 500 }}>API key</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
                    onClick={() => setConfirmDelete(null)}
                >
                    <div className="card" style={{ maxWidth: 400, width: '90%', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-critical)' }}>
                            Delete case?
                        </h3>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                            This will permanently delete <strong>{confirmDelete}</strong> and all its documents.
                            This cannot be undone.
                        </p>
                        <label className="label" style={{ fontSize: '0.8rem' }}>Type the case name to confirm:</label>
                        <input
                            className="input"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder={confirmDelete}
                            aria-label="Confirm case name for deletion"
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button
                                className="btn btn-danger"
                                disabled={deleteInput !== confirmDelete || loading}
                                onClick={async () => {
                                    await deleteCase(confirmDelete);
                                    setConfirmDelete(null);
                                    setDeleteInput('');
                                }}
                            >
                                {loading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
