import { Link } from 'react-router-dom';

export default function YourDataAndAi() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Your Data & AI</h1>
                <p>
                    How CaseKit handles your data when you use AI features — and the steps we have
                    taken to keep you in control.
                </p>
            </div>

            <div className="info-block" style={{ borderColor: 'var(--accent)', borderLeftWidth: '3px' }}>
                <h3>The process is entirely transparent</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    CaseKit will never send anything to an AI provider without showing you exactly
                    what will be sent first. Before every AI call, you see a full preview of the data
                    that will leave your computer. You confirm or cancel. Nothing happens in the background.
                </p>
            </div>

            <div className="info-block">
                <h3>Where does your data go?</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    When you use an AI feature, your data is sent directly from your computer to
                    Anthropic's API (<code>api.anthropic.com</code>). It does not pass through any
                    CaseKit server — there is no CaseKit server. The connection is:
                </p>
                <div className="card" style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: 'var(--space-4)' }}>
                    Your computer → api.anthropic.com
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                    No one else — including us — can see what you send or what the AI returns.
                </p>
            </div>

            <div className="info-block" style={{ borderColor: '#dc2626', borderLeftWidth: '3px' }}>
                <h3>AI training and data retention</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    <strong>This is important.</strong> When you use the Anthropic API, your data is subject
                    to <a href="https://www.anthropic.com/policies/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>Anthropic's terms of service</a> and
                    their <a href="https://www.anthropic.com/policies/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>privacy policy</a>.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    As of the time of writing, Anthropic states that API inputs and outputs are not
                    used to train their models. However, policies can change, and Anthropic may retain
                    data for safety monitoring, abuse prevention, and legal compliance for a limited
                    period. You should review their current policies before sending sensitive information.
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Treat any data you send to the AI as if it could be seen by a third party.
                </p>
            </div>

            <div className="info-block" style={{ borderColor: '#dc2626', borderLeftWidth: '3px' }}>
                <h3>What you should never send</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: 'var(--space-2)' }}>
                        Even with redaction tools, you should avoid including the following in AI submissions:
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <li>Bank account numbers, sort codes, or card details</li>
                        <li>National Insurance numbers</li>
                        <li>Passwords or security credentials</li>
                        <li>Medical records or health information</li>
                        <li>Information about children</li>
                        <li>Any data that could be used for identity theft</li>
                    </ul>
                    <p style={{ marginTop: 'var(--space-3)' }}>
                        The AI does not need this information to analyse your legal position. If a
                        document contains sensitive details, redact them before submission.
                    </p>
                </div>
            </div>

            <div className="info-block" style={{ borderColor: 'var(--accent)', borderLeftWidth: '3px' }}>
                <h3>Built-in redaction tool</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit includes an automatic redaction tool that scans your text before it is sent
                    to the AI. It detects and removes:
                </p>
                <div className="card">
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>Bank & card numbers</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Account numbers, sort codes, card numbers</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>NI numbers</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>National Insurance number format</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>Email addresses</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Automatically detected</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>Phone numbers</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>UK landline and mobile formats</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>Postcodes</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>UK postcode format</td>
                            </tr>
                            <tr>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 500 }}>Custom terms</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>You can add names, addresses, or any text</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                    The redaction tool runs before the preview step — so you redact first, then review
                    the redacted version, then confirm. You always see what will be sent.
                </p>
            </div>

            <div className="info-block">
                <h3>Why we built it this way</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    We could have built CaseKit as a web application with AI features running through
                    our own server. That would have been easier to deploy and would have hidden the
                    complexity of API keys from users. But it would have meant trusting us with your
                    legal documents — and requiring you to trust that our server is secure, that we
                    handle your data properly, and that we won't change our practices later.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    Instead, CaseKit runs entirely on your machine. You hold the API key. You approve
                    every transmission. You see exactly what is sent. The data goes directly from you
                    to Anthropic — we are not in the middle. This is deliberately more complicated for
                    users to set up, but it means you do not have to trust us with your data at all.
                </p>
            </div>

            <div className="citation" style={{ marginTop: 'var(--space-5)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    If you are unsure whether to use AI features for your particular case, err on the
                    side of caution. CaseKit is fully functional without AI — you can manage documents,
                    build chronologies, use templates, and export bundles without ever making an API call.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/api-setup" className="btn btn-primary">
                    API Key Setup
                </Link>
                <Link to="/ai-review" className="btn btn-secondary">
                    AI Review
                </Link>
            </div>
        </div>
    );
}
