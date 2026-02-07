import { useCaseStore } from '../../hooks/useCase';
import { Link } from 'react-router-dom';

const SIGNIFICANCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    key: { bg: 'var(--green-bg)', border: 'var(--green)', text: '#22543d' },
    supporting: { bg: '#e0f2fe', border: '#0284c7', text: '#0c4a6e' },
    background: { bg: 'var(--grey-bg)', border: 'var(--grey)', text: '#4a5568' },
};

const SOURCE_LABELS: Record<string, string> = {
    manual: 'Manual',
    document: 'Document',
    intake: 'Case details',
    ai_extracted: 'AI extracted',
};

const CONFIDENCE_BADGES: Record<string, { bg: string; color: string }> = {
    high: { bg: 'var(--green-bg)', color: 'var(--green)' },
    medium: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    low: { bg: 'var(--red-bg)', color: 'var(--red)' },
};

export default function ChronologyView() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const chronology = useCaseStore((s) => s.chronology);

    if (!currentCase) {
        return <p style={{ color: 'var(--text-muted)' }}>No case selected.</p>;
    }

    return (
        <div className="page" style={{ maxWidth: '52rem' }}>
            <div className="page-header">
                <h1>Chronology</h1>
                <p>
                    Timeline of events for your case. Events are pulled from your case details,
                    documents, and any AI-extracted dates.
                </p>
            </div>

            {chronology.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No events yet. Add documents with dates, set case dates, or use AI extraction
                        to build your timeline.
                    </p>
                </div>
            ) : (
                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    <div
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'var(--border)',
                        }}
                    />

                    {chronology.map((entry) => {
                        const colors = SIGNIFICANCE_COLORS[entry.significance] || SIGNIFICANCE_COLORS.background;
                        const sourceLabel = SOURCE_LABELS[entry.source] || entry.source;
                        const confidenceBadge = entry.confidence ? CONFIDENCE_BADGES[entry.confidence] : null;

                        return (
                            <div key={entry.id} style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '-1.75rem',
                                        top: '0.6rem',
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: colors.border,
                                        border: '2px solid white',
                                        boxShadow: '0 0 0 2px ' + colors.border,
                                    }}
                                />
                                <div
                                    className="card"
                                    style={{
                                        padding: 'var(--space-3) var(--space-4)',
                                        borderLeft: `3px solid ${colors.border}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>
                                                {entry.date}
                                            </p>
                                            <p style={{ fontSize: '0.875rem', margin: 0 }}>
                                                {entry.description}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', flexShrink: 0 }}>
                                            {confidenceBadge && (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: confidenceBadge.bg,
                                                        color: confidenceBadge.color,
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    {entry.confidence}
                                                </span>
                                            )}
                                            <span
                                                className="badge"
                                                style={{
                                                    background: colors.bg,
                                                    color: colors.text,
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {entry.significance}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {sourceLabel}
                                        </span>
                                        {entry.source_document_path && (
                                            <Link
                                                to="/documents"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--accent)',
                                                }}
                                                title={`View source: ${entry.source_document_path}`}
                                            >
                                                {entry.source_document_path.split('/').pop()}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--text-muted)' }}>
                    Legend
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    {Object.entries(SIGNIFICANCE_COLORS).map(([key, colors]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.border }} />
                            <span style={{ textTransform: 'capitalize' }}>{key}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
