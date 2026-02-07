import { Link } from 'react-router-dom';

const FEATURES = [
    { label: 'Document Management', desc: 'Upload, organise, and tag your documents by category — correspondence, evidence, legal, court', path: '/documents' },
    { label: 'Chronology Builder', desc: 'Build a timeline of events from your documents and case details, with AI-assisted date extraction', path: '/chronology' },
    { label: 'AI Merits Analysis', desc: 'Get a structured assessment of your position using your own API key — transparent, not a chatbot. Set up in API Key Setup.', path: '/ai-review' },
    { label: 'Templates & Forms', desc: 'Pre-action letter templates, complaint templates, and official HMCTS court forms with guidance', path: '/templates' },
    { label: 'Procedural Guide', desc: 'Step-by-step walkthrough from first complaint to enforcement, with court form links', path: '/procedure' },
    { label: 'Court Bundle Export', desc: 'Export your case as a paginated, indexed bundle ready for court or a solicitor', path: '/export' },
];

export default function LandingPage() {
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

            <div className="resource-grid" style={{ marginBottom: 'var(--space-8)' }}>
                {FEATURES.map((item) => (
                    <Link key={item.path} to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="card card-interactive" style={{ height: '100%' }}>
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
                    <strong>CaseKit works completely offline.</strong> It has no internet connection, no account, no analytics.
                    Your data stays on your computer and is never sent anywhere.
                    The only exception: optional AI analysis sends approved text directly to the AI provider.{' '}
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
