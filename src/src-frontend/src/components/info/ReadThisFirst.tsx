import { Link } from 'react-router-dom';

export default function ReadThisFirst() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>Read This First</h1>
                <p>Before you use CaseKit, understand what it does and what it doesn't.</p>
            </div>

            <div className="info-block" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.875rem 1.25rem', marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>Information correct as at February 2026</p>
                <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.6 }}>
                    Procedural rules, court timelines, API pricing, and legislation references in CaseKit reflect the law and published information
                    as at <strong>February 2026</strong>. If you are using this software at a later date, you should independently verify that
                    rules, deadlines, and costs have not changed. Links to the primary sources are provided below.
                </p>
            </div>

            <div className="info-block">
                <h3>What CaseKit does</h3>
                <ul>
                    <li>Helps you <strong>organise documents</strong> — upload, tag, and categorise correspondence, evidence, and legal papers</li>
                    <li>Builds a <strong>chronology</strong> of events from your case details and documents</li>
                    <li>Provides <strong>AI-assisted drafting and analysis</strong> using structured prompts (not freeform chat) — you define the outcome, the AI drafts to your instructions</li>
                    <li>Offers <strong>templates and court forms</strong>, a <strong>procedural guide</strong>, and links to free advice services</li>
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
                <h3>AI features and API keys</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit includes optional AI-assisted drafting — case analysis, letter drafting, pleadings, and response review.
                    You choose which AI provider to use: <strong>Anthropic (Claude)</strong>, <strong>OpenAI (ChatGPT)</strong>, or <strong>Google (Gemini)</strong>.
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                    To use AI features, you need an <Link to="/api-setup" style={{ fontWeight: 600 }}>API key</Link> from your chosen provider. If you haven't heard of this before, here's what it means:
                </p>
                <ul>
                    <li>An API key is like a <strong>personal password</strong> that lets software (like CaseKit) use AI on your behalf</li>
                    <li>You get one by creating a free account at your chosen provider's website and adding a small amount of credit</li>
                    <li>It's <strong>pay-as-you-go</strong> — you only pay for what you use, typically a few pence per request. There is no subscription</li>
                    <li>This is <strong>available to anyone</strong> — these are the same AI models that power products like ChatGPT and Claude.ai, but accessed directly at wholesale cost rather than through a monthly subscription</li>
                    <li>Because CaseKit connects directly to the AI provider, your data goes <strong>straight from your computer to the provider</strong> — no middleman, no third-party server, and you can see exactly what is sent before confirming</li>
                    <li>You can set a <strong>spending limit</strong> on your provider account so you're always in control of costs</li>
                </ul>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    AI features are entirely optional. CaseKit's document management, chronology, templates, and court bundle export all work without any AI or API key.
                </p>
                <div style={{ marginTop: 'var(--space-3)' }}>
                    <Link to="/api-setup" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                        Set up your API key
                    </Link>
                </div>
            </div>

            <div className="info-block" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem 1.25rem' }}>
                <h3 style={{ color: '#166534' }}>CaseKit works completely offline</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                    CaseKit has <strong>no connection to the internet</strong>. It cannot send data anywhere, phone home,
                    check for updates, or communicate with any server. There is no account, no login, no analytics.
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                    The <strong>only exception</strong> is if you choose to use the optional AI analysis features. In that case,
                    and only when you explicitly press "Analyse", the text you approve is sent directly to the AI provider
                    (e.g. Anthropic). Nothing else leaves your machine — ever.
                </p>
            </div>

            <div className="info-block">
                <h3>Your data</h3>
                <ul>
                    <li>Everything is stored locally on your computer in <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'var(--bg)', padding: '1px 4px', borderRadius: '3px' }}>Documents/CaseKit/</code></li>
                    <li>No server, no cloud, no account required</li>
                    <li>No analytics, telemetry, or tracking of any kind</li>
                    <li>If you use AI features, document text is sent to your chosen AI provider using your own API key — nothing else leaves your machine</li>
                    <li>You can delete everything by removing the CaseKit folder</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Limitations</h3>
                <ul>
                    <li>CaseKit works best for <strong>small claims with a limited number of documents</strong> — the kind of everyday disputes where you need help getting organised and understanding your position</li>
                    <li>It can be useful for individuals in <strong>any field of dispute</strong>, not just consumer claims — but its templates and procedural guidance are primarily geared toward the County Court small claims track</li>
                    <li>Some cases may be <strong>too large, too complex, or too sensitive</strong> to rely on this tool alone. If your dispute involves significant sums, multiple parties, urgent deadlines, or particularly sensitive subject matter, a solicitor will do a better job of initial triage and advising on strategy</li>
                    <li>AI outputs should always be verified — they can contain errors and are not a substitute for professional judgment</li>
                </ul>
            </div>

            <div className="info-block">
                <h3>Reference links (verify independently)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    The procedural rules, timelines, and API pricing referenced in CaseKit were correct as at February 2026.
                    If in doubt, check the current versions at these sources:
                </p>
                <ul style={{ fontSize: '0.875rem' }}>
                    <li><strong>Civil Procedure Rules</strong> — <a href="https://www.justice.gov.uk/courts/procedure-rules/civil" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>justice.gov.uk/courts/procedure-rules/civil</a></li>
                    <li><strong>Pre-Action Protocols</strong> — <a href="https://www.justice.gov.uk/courts/procedure-rules/civil/rules/pd_pre-action_conduct" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Practice Direction — Pre-Action Conduct</a></li>
                    <li><strong>Court forms</strong> — <a href="https://www.gov.uk/government/collections/court-and-tribunal-forms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>gov.uk court forms</a></li>
                    <li><strong>Anthropic API pricing</strong> — <a href="https://www.anthropic.com/pricing" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>anthropic.com/pricing</a></li>
                    <li><strong>OpenAI API pricing</strong> — <a href="https://openai.com/api/pricing/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>openai.com/api/pricing</a></li>
                    <li><strong>Google Gemini API pricing</strong> — <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>ai.google.dev/pricing</a></li>
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
