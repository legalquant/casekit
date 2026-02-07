import { Link } from 'react-router-dom';

export default function RisksOfLitigation() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Risks of Litigation</h1>
                <p>Going to court is not a neutral act. Before you issue a claim, understand what you are committing to.</p>
            </div>

            <div className="info-block">
                <h3>It takes longer than you think</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    A straightforward small claims case can take 6–12 months from issuing a claim to getting a hearing date.
                    Fast track and multi-track cases can take considerably longer. Delays are common: adjournments,
                    listing backlogs, and procedural steps all add time. During this period, the dispute occupies
                    mental space, requires ongoing administration, and does not resolve itself.
                </p>
            </div>

            <div className="info-block">
                <h3>Stress and emotional cost</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Litigation is adversarial. Even in the small claims track, you are in formal conflict with another party.
                    You will need to read and respond to their defence, attend a hearing, and potentially face arguments
                    that feel personal. The process can be draining — particularly if the dispute involves a situation
                    that was already stressful (faulty goods, poor service, money lost). Many people underestimate the
                    emotional toll of sustained dispute resolution.
                </p>
            </div>

            <div className="info-block">
                <h3>Costs risk</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    The costs rules depend on which track your claim is allocated to:
                </p>
                <div className="card">
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Track</th>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Claim value</th>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Costs exposure</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Small claims</td>
                                <td style={{ padding: 'var(--space-2)' }}>Up to £10,000</td>
                                <td style={{ padding: 'var(--space-2)' }}>Very limited — generally no adverse costs</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Fast track</td>
                                <td style={{ padding: 'var(--space-2)' }}>£10,000–£25,000</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--color-warning)' }}>Significant — loser typically pays winner's costs</td>
                            </tr>
                            <tr>
                                <td style={{ padding: 'var(--space-2)' }}>Multi-track</td>
                                <td style={{ padding: 'var(--space-2)' }}>Above £25,000</td>
                                <td style={{ padding: 'var(--space-2)', color: '#dc2626' }}>Substantial — adverse costs can be very high</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                    <strong>Adverse costs</strong> means that if you lose, you may be ordered to pay the other side's
                    legal costs — not just your own. On the small claims track, this risk is minimal. Above it, the
                    financial exposure can be significant. Think carefully about whether the amount you are claiming
                    justifies the risk.
                </p>
            </div>

            <div className="info-block">
                <h3>No guarantee of outcome</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Even a strong case can lose. Evidence may not be accepted, witnesses may not be believed,
                    and the law may not apply the way you expect. Winning a judgment does not guarantee payment
                    either — enforcement is a separate process, and if the other party has no assets or income,
                    a judgment may be unenforceable in practice.
                </p>
            </div>

            <div className="info-block" style={{ borderColor: 'var(--accent)', borderLeftWidth: '3px' }}>
                <h3>Legal representation matters</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    If you can afford legal representation, it is almost always worth it — particularly for claims
                    above the small claims threshold. A good solicitor will give you an honest assessment of your
                    prospects, manage procedure, and present your case effectively.
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                    <strong>Being organised saves you money.</strong> Solicitors charge by the hour. If you arrive
                    with documents in order, a clear chronology, and a concise summary of the facts, your solicitor
                    spends their time on legal analysis — not administrative work. A disorganised client is an
                    expensive client. This is exactly what CaseKit is designed to help with.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Even if you ultimately represent yourself, having a solicitor review your position at key
                    stages (before sending a letter before claim, before issuing proceedings, before a hearing)
                    can be cost-effective compared to full representation.
                </p>
            </div>

            <div className="info-block" style={{ borderColor: '#dc2626', borderLeftWidth: '3px' }}>
                <h3>A note on AI outputs and legal advice</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit's AI features are designed to help <em>you</em> understand your position and organise
                    your thinking. They are not a substitute for professional legal advice.
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                    <strong>Do not send AI-generated legal opinions to your solicitor.</strong> This is counterproductive.
                    Lawyers need to see your facts — what happened, when, what documents you have. They do not need
                    an AI's interpretation of the law, which may be wrong and which they will need to unpick before
                    they can advise you properly. Presenting AI outputs as if they are authoritative wastes your
                    solicitor's time and increases your bill.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    The best use of CaseKit when working with a solicitor: hand them your organised documents,
                    your chronology, and your own plain-language summary. Let them do the legal analysis.
                </p>
            </div>

            <div className="citation" style={{ marginTop: 'var(--space-5)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    This page is not intended to discourage you from pursuing a legitimate claim. It is intended
                    to make sure you go in with realistic expectations. Many disputes are resolved successfully
                    through the courts — but informed claimants make better decisions.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/help" className="btn btn-primary">
                    Find Professional Help
                </Link>
                <Link to="/procedure" className="btn btn-secondary">
                    Step-by-Step Guide
                </Link>
            </div>
        </div>
    );
}
