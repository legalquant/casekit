import { Link } from 'react-router-dom';

export default function ReadThisFirst() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Read This First</h1>
                <p>Before you use CaseKit, understand what it does and what it doesn't.</p>
            </div>

            <div className="info-block">
                <h3>What CaseKit does</h3>
                <ul>
                    <li>Helps you <strong>organise documents</strong> — upload, tag, and categorise correspondence, evidence, and legal papers</li>
                    <li>Builds a <strong>chronology</strong> of events from your case details and documents</li>
                    <li>Provides <strong>AI-assisted merits analysis</strong> using structured prompts (not freeform chat) to help you understand your position</li>
                    <li>Offers <strong>letter templates</strong>, a <strong>procedural guide</strong>, and links to <strong>court forms</strong> and free advice services</li>
                    <li>Exports a <strong>court-ready bundle</strong> — paginated and indexed, suitable for court or for handing to a solicitor</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Two ways to use it</h3>
                <ul>
                    <li><strong>Preparing for professional advice</strong> — arriving at a solicitor with organised documents, a clear chronology, and an understanding of the issues saves time and reduces cost. CaseKit helps you do that.</li>
                    <li><strong>Handling it yourself</strong> — if your dispute is straightforward and within small claims, CaseKit gives you the tools, templates, and procedural references to manage it on your own.</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>What CaseKit is not</h3>
                <ul>
                    <li>Not a legal advice service — it does not create a solicitor-client relationship</li>
                    <li>Not a substitute for professional advice when your case requires it</li>
                    <li>Not a chatbot — AI features are structured and transparent, not conversational</li>
                    <li>Not encouraging litigation — a realistic view of your position may well mean deciding not to proceed</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Your data</h3>
                <ul>
                    <li>Everything is stored locally on your computer in <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px' }}>Documents/CaseKit/</code></li>
                    <li>No server, no cloud, no account required</li>
                    <li>No analytics, telemetry, or tracking of any kind</li>
                    <li>If you use AI features, document text is sent to the AI provider (Anthropic) using your own API key — nothing else leaves your machine</li>
                    <li>You can delete everything by removing the CaseKit folder</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Limitations</h3>
                <ul>
                    <li>CaseKit is designed for consumer disputes under the Consumer Rights Act 2015</li>
                    <li>It does not handle complex multi-party claims, personal injury, housing, employment, or family matters</li>
                    <li>AI outputs should always be verified — they can contain errors</li>
                    <li>If your case involves significant sums, urgency, or complexity beyond small claims, seek professional advice</li>
                </ul>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/cases" className="btn btn-primary">
                    Start a Case
                </Link>
                <Link to="/procedure" className="btn btn-secondary">
                    Step-by-Step Guide
                </Link>
            </div>
        </div>
    );
}
