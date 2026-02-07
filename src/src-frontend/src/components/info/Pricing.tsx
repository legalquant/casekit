import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Pricing</h1>
                <p>CaseKit is free. There is no cost to download, install, or use the software.</p>
            </div>

            <div className="info-block">
                <h3>The software</h3>
                <ul>
                    <li>CaseKit is <strong>completely free</strong> to download and use</li>
                    <li>No subscription, no trial period, no feature gating</li>
                    <li>All core features — document management, chronology, templates, procedural guide, court bundle export — are free with no limitations</li>
                    <li>There is no account to create and no payment information required</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>AI features (optional)</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit includes optional AI-powered analysis features — merits assessment, letter drafting,
                    and response review. These are entirely optional and the app works fully without them.
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                    If you choose to use AI features, <strong>you pay the AI provider (Anthropic) directly</strong> using
                    your own API key. CaseKit does not charge anything, does not take a cut, and is not involved
                    in the transaction.
                </p>
                <div className="card" style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Typical costs</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Single analysis call</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>~5–15p</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full case assessment</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>~15–25p total</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Minimum Anthropic deposit</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>$5 (~£4)</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CaseKit's share</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Nothing — £0</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="info-block">
                <h3>Why is it free?</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    CaseKit was built to address the gap left by legal aid cuts. Since LASPO 2012, most civil
                    court users in England & Wales represent themselves. The tools available to them should not
                    add financial barriers. CaseKit runs on your own machine, has no server costs to recoup,
                    and does not monetise your data.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/api-setup" className="btn btn-primary">
                    Set Up API Key
                </Link>
                <Link to="/cases" className="btn btn-secondary">
                    Start a Case
                </Link>
            </div>
        </div>
    );
}
