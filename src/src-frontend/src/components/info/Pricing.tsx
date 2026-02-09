import { useState } from 'react';
import { Link } from 'react-router-dom';

// Pricing per million tokens (USD) — approximate as of early 2026
const PROVIDERS = [
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        model: 'Claude Sonnet',
        inputPer1M: 3,
        outputPer1M: 15,
        minDeposit: '$5 (~£4)',
        consoleUrl: 'console.anthropic.com',
        recommended: true,
        note: 'Best for structured legal analysis. Recommended.',
    },
    {
        id: 'openai',
        name: 'OpenAI (ChatGPT)',
        model: 'GPT-4o',
        inputPer1M: 2.5,
        outputPer1M: 10,
        minDeposit: '$5 (~£4)',
        consoleUrl: 'platform.openai.com',
        recommended: false,
        note: 'Widely used. Good general capability.',
    },
    {
        id: 'gemini',
        name: 'Google (Gemini)',
        model: 'Gemini 1.5 Pro',
        inputPer1M: 1.25,
        outputPer1M: 5,
        minDeposit: 'Pay-as-you-go',
        consoleUrl: 'aistudio.google.com',
        recommended: false,
        note: 'Lowest cost. Good for simple analyses.',
    },
];

// Rough assumptions
const WORDS_PER_PAGE = 250;
const TOKENS_PER_WORD = 1.3;
const OUTPUT_TOKENS_PER_ANALYSIS = 2000; // ~1500 words response
const USD_TO_GBP = 0.79;

function estimateCost(pages: number, provider: typeof PROVIDERS[0]) {
    const inputTokens = pages * WORDS_PER_PAGE * TOKENS_PER_WORD;
    const outputTokens = OUTPUT_TOKENS_PER_ANALYSIS;
    const costUsd =
        (inputTokens / 1_000_000) * provider.inputPer1M +
        (outputTokens / 1_000_000) * provider.outputPer1M;
    return costUsd * USD_TO_GBP;
}

function formatPence(gbp: number): string {
    const pence = gbp * 100;
    if (pence < 1) return '<1p';
    return `~${Math.round(pence)}p`;
}

export default function Pricing() {
    const [pages, setPages] = useState(20);

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
                    CaseKit includes optional AI-powered analysis — merits assessment, letter drafting,
                    and response review. These are entirely optional and the app works fully without them.
                </p>

                <div className="card" style={{ marginBottom: 'var(--space-3)', background: 'var(--bg)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>What is an API key?</div>
                    <p style={{ fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>
                        You may know AI through products like ChatGPT, which charge a monthly subscription (£20/month).
                        There is another way to access the same technology: an <strong>API key</strong>.
                    </p>
                    <p style={{ fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>
                        An API key is a personal password that lets software — like CaseKit — connect directly to an AI provider.
                        Instead of paying a monthly subscription, you <strong>pay only for what you use</strong>, typically just a few pence per request.
                        This is a standard, consumer-available service — anyone can sign up.
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                        By using your own API key, you get <strong>direct access at wholesale cost</strong> — no middleman,
                        no subscription, and full control over your data and spending.
                    </p>
                </div>

                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                    <strong>You pay the AI provider directly</strong> using your own API key.
                    CaseKit does not charge anything, does not take a cut, and is not involved in the transaction.
                </p>
            </div>

            {/* Interactive cost estimator */}
            <div className="info-block">
                <h3>Cost estimator</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    Slide to match the size of your case. Costs shown are per analysis call (e.g. one merits assessment).
                </p>

                <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pages of documents uploaded</label>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', minWidth: '3rem', textAlign: 'right' }}>{pages}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={200}
                        value={pages}
                        onChange={(e) => setPages(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent)' }}
                        aria-label="Number of pages"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>1 page</span>
                        <span>200 pages</span>
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                        Estimated cost per analysis ({pages} pages)
                    </div>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Provider</th>
                                <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 600 }}>Model</th>
                                <th style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 600 }}>Per analysis</th>
                                <th style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 600 }}>Full case (×3)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROVIDERS.map((p) => {
                                const cost = estimateCost(pages, p);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: 'var(--space-2)' }}>
                                            {p.name}
                                            {p.recommended && (
                                                <span className="badge badge-green" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                                    Recommended
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: 'var(--space-2)', color: 'var(--text-muted)' }}>{p.model}</td>
                                        <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 500 }}>{formatPence(cost)}</td>
                                        <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 500 }}>{formatPence(cost * 3)}</td>
                                    </tr>
                                );
                            })}
                            <tr style={{ background: '#fef3c7' }}>
                                <td colSpan={2} style={{ padding: 'var(--space-2)', fontWeight: 500 }}>ChatGPT Plus subscription</td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 500, color: '#92400e' }}>£20/month</td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 500, color: '#92400e' }}>£20/month</td>
                            </tr>
                        </tbody>
                    </table>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        Assumptions: ~{WORDS_PER_PAGE} words/page, ~{OUTPUT_TOKENS_PER_ANALYSIS.toLocaleString()} output tokens per analysis.
                        A "full case" assumes 3 analyses (merits + letter + response review). Actual costs may vary.
                    </p>
                </div>
            </div>

            {/* Provider comparison */}
            <div className="info-block">
                <h3>Supported providers</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    CaseKit supports three AI providers. You choose which one to use in{' '}
                    <Link to="/api-setup" style={{ fontWeight: 500 }}>API Key Setup</Link>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {PROVIDERS.map((p) => (
                        <div
                            key={p.id}
                            className="card"
                            style={{
                                borderLeft: p.recommended ? '3px solid var(--green)' : undefined,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
                                    {p.recommended && (
                                        <span className="badge badge-green" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min deposit: {p.minDeposit}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{p.note}</p>
                        </div>
                    ))}
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

            <div className="info-block" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem 1.25rem' }}>
                <h3 style={{ color: '#166534' }}>CaseKit works offline by default</h3>
                <p style={{ fontSize: '0.875rem' }}>
                    CaseKit has <strong>no internet connection</strong> by default. It does not phone home,
                    check for updates, or send analytics. There are two exceptions, both user-initiated:
                    AI features send approved text directly to the provider you chose, and citation
                    verification sends only the citation string (e.g. "[2020] UKSC 42") to BAILII and
                    the National Archives to check it resolves — no client data is included.
                    Nothing passes through any CaseKit server.
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
