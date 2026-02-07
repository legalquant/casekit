import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';

export default function HomePage() {
    const { cases, loadCases, selectCase, loading, error } = useCaseStore();
    const navigate = useNavigate();
    const [showNewCase, setShowNewCase] = useState(false);
    const [newCaseName, setNewCaseName] = useState('');
    const [claimantName, setClaimantName] = useState('');
    const [defendantName, setDefendantName] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

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
                defendantName.trim()
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
                                <label className="label">Your Name (Claimant)</label>
                                <input
                                    className="input"
                                    placeholder="Your name"
                                    value={claimantName}
                                    onChange={(e) => setClaimantName(e.target.value)}
                                    aria-label="Claimant name"
                                />
                            </div>
                            <div>
                                <label className="label">Defendant's Name</label>
                                <input
                                    className="input"
                                    placeholder="Company or individual name"
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
                                <button
                                    key={c.id}
                                    onClick={() => handleOpenCase(c.name)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0.375rem',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.15s',
                                        textAlign: 'left',
                                        width: '100%',
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
                            Get structured merits analysis using your own API key
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
