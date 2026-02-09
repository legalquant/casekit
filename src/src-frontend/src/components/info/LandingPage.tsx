import { Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';

const CASE_FEATURES = [
    { label: 'Document Management', desc: 'Upload, organise, and tag your documents by category — correspondence, evidence, legal, court', path: '/documents' },
    { label: 'Chronology Builder', desc: 'Build a timeline of events from your documents and case details, with AI-assisted date extraction', path: '/chronology' },
    { label: 'AI Drafting', desc: 'Draft pre-action letters, analyse case merits, and prepare court documents with AI — using your own API key', path: '/ai-review' },
    { label: 'Templates & Forms', desc: 'Pre-action letter templates, complaint templates, and official HMCTS court forms with guidance', path: '/templates' },
    { label: 'Procedural Guide', desc: 'Step-by-step walkthrough from first complaint to enforcement, with court form links', path: '/procedure' },
    { label: 'Court Bundle Export', desc: 'Export your case as a paginated, indexed bundle ready for court or a solicitor', path: '/export' },
];

export default function LandingPage() {
    const cases = useCaseStore((s) => s.cases);
    const currentCase = useCaseStore((s) => s.currentCase);
    const selectCase = useCaseStore((s) => s.selectCase);

    return (
        <div className="page">
            <div
                style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '1rem 1.25rem',
                    marginBottom: 'var(--space-5)',
                    fontSize: '0.85rem',
                    color: '#1e40af',
                    lineHeight: 1.6,
                }}
            >
                <strong style={{ fontSize: '0.9rem' }}>⚠ Development Preview</strong>
                <p style={{ margin: '0.5rem 0 0' }}>
                    CaseKit is an advanced AI-assisted toolkit that is <strong>still in active development</strong>.
                    Features may change, and document parsing accuracy is not guaranteed. This software should
                    <strong> not be relied upon for real legal work</strong> at this stage.
                    Feedback and bug reports are very welcome — they directly improve the product.
                </p>
            </div>

            <div className="hero">
                <h1>Get your case in order.</h1>
                <p style={{ maxWidth: '38rem', margin: '0 auto' }}>
                    CaseKit helps you organise documents, build a chronology, and understand your position —
                    whether you're preparing to instruct a solicitor or considering enforcing your rights yourself.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '34rem', margin: 'var(--space-3) auto 0' }}>
                    Arriving with organised materials saves time and cost. If your case is straightforward,
                    CaseKit gives you the tools and references to handle it on your own.
                </p>
                <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/read-this-first" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                        Read This First
                    </Link>
                    <Link to="/cases" className="btn btn-secondary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                        Start a Case
                    </Link>
                </div>
            </div>

            <div style={{
                background: currentCase ? 'rgba(14, 165, 152, 0.08)' : '#f8fafc',
                border: `1px solid ${currentCase ? 'rgba(14, 165, 152, 0.25)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: 'var(--space-4)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontWeight: 500, color: currentCase ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {currentCase ? 'Current case:' : 'Select a case:'}
                </span>
                <select
                    value={currentCase?.name || ''}
                    onChange={(e) => { if (e.target.value) selectCase(e.target.value); }}
                    style={{
                        flex: 1,
                        minWidth: 160,
                        padding: '5px 8px',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer',
                    }}
                >
                    <option value="" disabled>
                        {cases.length === 0 ? 'No cases yet' : 'Choose a case\u2026'}
                    </option>
                    {cases.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                </select>
                <Link to="/cases?new=1" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px', whiteSpace: 'nowrap' }}>
                    + New Case
                </Link>
                {currentCase && (
                    <Link to="/cases" style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>View case</Link>
                )}
            </div>

            <div className="resource-grid" style={{ marginBottom: 'var(--space-8)' }}>
                {CASE_FEATURES.map((item) => (
                    <Link key={item.path} to={currentCase ? item.path : '/cases'} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card card-interactive" style={{ height: '100%', opacity: currentCase ? 1 : 0.7 }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: 'var(--space-1)' }}>{item.label}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem',
                padding: '0.875rem 1.25rem',
                marginTop: 'var(--space-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.85rem',
                color: '#166534',
            }}>

                <div>
                    <strong>CaseKit works offline by default.</strong> No account, no analytics, no background connectivity.
                    Your data stays on your computer. The only exceptions: optional AI analysis sends
                    approved text directly to the AI provider, and citation verification sends only the
                    citation string (e.g. "[2020] UKSC 42") to BAILII and the National Archives — never
                    any client data.{' '}
                    <Link to="/your-data" style={{ color: '#166534', fontWeight: 500 }}>Learn more</Link>
                </div>
            </div>

            <div className="citation" style={{ marginTop: 'var(--space-3)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    CaseKit is a self-help organisational tool for England & Wales.
                    It does not provide legal advice and does not create a solicitor-client relationship.{' '}
                    <Link to="/read-this-first" style={{ fontWeight: 500 }}>Read more</Link>
                </p>
            </div>
        </div>
    );
}
