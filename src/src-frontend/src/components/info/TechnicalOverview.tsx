import { Link } from 'react-router-dom';

export default function TechnicalOverview() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Technical Overview</h1>
                <p>How CaseKit is built, how your data is handled, and why this architecture guarantees privacy.</p>
            </div>

            <div className="info-block">
                <h3>Architecture</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit is a desktop application, not a website. It runs entirely on your computer.
                </p>
                <ul>
                    <li><strong>Desktop app</strong> — built with Tauri, a framework that packages a lightweight web view with a native Rust backend. No browser required, no server to connect to.</li>
                    <li><strong>Rust backend</strong> — all file operations, document management, and case data handling are done in Rust, which runs locally on your machine. Rust is a systems programming language known for memory safety and performance.</li>
                    <li><strong>React frontend</strong> — the interface is built with React and TypeScript, rendered in a local web view (not a browser tab). It communicates with the Rust backend through a secure, local-only bridge.</li>
                    <li><strong>No server component</strong> — there is no CaseKit server. The application is self-contained. Updates are distributed as new releases you download and install.</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Data storage</h3>
                <ul>
                    <li>All case data is stored as JSON files in <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px' }}>Documents/CaseKit/</code> on your local filesystem</li>
                    <li>Uploaded documents (PDFs, images, emails) are copied into your case folder — originals are not modified</li>
                    <li>There is no database server — data is read from and written to plain files</li>
                    <li>Deleting the CaseKit folder removes all data permanently</li>
                    <li>You can back up your cases by copying the folder to any storage medium</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Network activity</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit makes <strong>zero network requests</strong> by default. The only exception is if you
                    opt in to AI features:
                </p>
                <ul>
                    <li><strong>Without AI</strong> — the app never contacts any server. It works fully offline.</li>
                    <li><strong>With AI</strong> — when you initiate an AI analysis, the text you approve is sent directly from your machine to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px' }}>api.anthropic.com</code> using your API key. No data passes through any CaseKit server.</li>
                    <li><strong>No telemetry</strong> — there is no analytics, crash reporting, usage tracking, or phone-home functionality of any kind.</li>
                    <li><strong>No auto-update</strong> — the app does not check for updates automatically. You download new versions manually.</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Why this guarantees privacy</h3>
                <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Concern</th>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>CaseKit</th>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Typical web app</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Where is data stored?</td>
                                <td style={{ padding: 'var(--space-2)' }}>Your computer only</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Company's cloud servers</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Who can access it?</td>
                                <td style={{ padding: 'var(--space-2)' }}>Only you</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Company employees, law enforcement requests</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Account required?</td>
                                <td style={{ padding: 'var(--space-2)' }}>No</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Yes (email, password, often phone)</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: 'var(--space-2)' }}>Data breach risk?</td>
                                <td style={{ padding: 'var(--space-2)' }}>Only if your computer is compromised</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Server breaches affect all users</td>
                            </tr>
                            <tr>
                                <td style={{ padding: 'var(--space-2)' }}>What happens if company shuts down?</td>
                                <td style={{ padding: 'var(--space-2)' }}>Nothing — your data is local files</td>
                                <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>Data may be lost or transferred</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    The privacy guarantee is structural, not a policy decision. Because there is no server,
                    there is no mechanism by which your data could be collected, leaked, or sold — even if
                    someone wanted to. The code is auditable and the network behaviour is verifiable.
                </p>
            </div>

            <div className="info-block">
                <h3>AI transparency</h3>
                <ul>
                    <li>Before any AI call, you see the <strong>exact text</strong> that will be sent — nothing hidden</li>
                    <li>AI prompts are structured (not freeform chat) to produce reliable, reviewable outputs</li>
                    <li>The AI provider (Anthropic) processes your request under their own privacy policy — CaseKit has no visibility into this</li>
                    <li>Your API key is stored in browser local storage only — it is never written to a file or transmitted to any server other than Anthropic's</li>
                    <li>You can remove your API key at any time from the <Link to="/api-setup" style={{ fontWeight: 500 }}>API Key Setup</Link> page</li>
                </ul>
            </div>

            <div className="info-block" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem 1.25rem' }}>
                <h3 style={{ color: '#166534' }}>Verify it yourself</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                    CaseKit makes <strong>zero network requests</strong> unless you explicitly use AI features.
                    You don't have to take our word for it — you can verify:
                </p>
                <ul>
                    <li>Open <strong>Task Manager</strong> (Ctrl+Shift+Esc) → click the <strong>Network</strong> column to sort by usage</li>
                    <li>CaseKit will show <strong>0 Mbps</strong> network activity during normal use</li>
                    <li>Only when you press "Analyse" on an AI feature will you see a brief data transfer to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px' }}>api.anthropic.com</code></li>
                    <li>There is no background connectivity, no update checker, no telemetry endpoint</li>
                </ul>
            </div>

            <div className="citation" style={{ marginTop: 'var(--space-4)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    <strong>Tech stack:</strong> Tauri 2.x · Rust · React 18 · TypeScript · Vite ·
                    Local JSON storage · Optional: Anthropic Claude API
                </p>
            </div>
        </div>
    );
}
