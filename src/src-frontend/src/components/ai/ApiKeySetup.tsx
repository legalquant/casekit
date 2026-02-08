import { useState } from 'react';
import { Link } from 'react-router-dom';

const PROVIDERS = [
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        keyPrefix: 'sk-ant-',
        consoleUrl: 'https://console.anthropic.com',
        consoleName: 'console.anthropic.com',
        recommended: true,
        steps: [
            { text: 'Go to', linkLabel: 'console.anthropic.com', linkUrl: 'https://console.anthropic.com' },
            { text: 'Create an account (email + password)' },
            { text: 'Add credit — minimum $5 (~£4). Pay-as-you-go, not a subscription. Unused credit stays indefinitely' },
            { text: 'Go to Settings → API Keys and click Create Key' },
            { text: 'Copy the key (starts with sk-ant-) and paste it below' },
        ],
    },
    {
        id: 'openai',
        name: 'OpenAI (ChatGPT)',
        keyPrefix: 'sk-',
        consoleUrl: 'https://platform.openai.com',
        consoleName: 'platform.openai.com',
        recommended: false,
        steps: [
            { text: 'Go to', linkLabel: 'platform.openai.com', linkUrl: 'https://platform.openai.com' },
            { text: 'Create an account or sign in with your ChatGPT account' },
            { text: 'Add credit under Billing — minimum $5 (~£4). This is separate from a ChatGPT subscription' },
            { text: 'Go to API Keys and click Create new secret key' },
            { text: 'Copy the key (starts with sk-) and paste it below' },
        ],
    },
    {
        id: 'gemini',
        name: 'Google (Gemini)',
        keyPrefix: 'AI',
        consoleUrl: 'https://aistudio.google.com/apikey',
        consoleName: 'aistudio.google.com',
        recommended: false,
        steps: [
            { text: 'Go to', linkLabel: 'aistudio.google.com/apikey', linkUrl: 'https://aistudio.google.com/apikey' },
            { text: 'Sign in with your Google account' },
            { text: 'Click Create API Key and select or create a project' },
            { text: 'Copy the key and paste it below' },
        ],
    },
];

export default function ApiKeySetup() {
    const [apiKey, setApiKey] = useState('');
    const storedProvider = localStorage.getItem('casekit_api_provider') || 'anthropic';
    const [provider, setProvider] = useState(storedProvider);
    const [saved, setSaved] = useState(!!localStorage.getItem('casekit_api_key'));
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [step, setStep] = useState(saved ? 0 : 1);

    const currentProvider = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('casekit_api_key', apiKey.trim());
            localStorage.setItem('casekit_api_provider', provider);
            setSaved(true);
            setTestResult(null);
        }
    };

    const handleRemove = () => {
        localStorage.removeItem('casekit_api_key');
        localStorage.removeItem('casekit_api_provider');
        setSaved(false);
        setApiKey('');
        setTestResult(null);
        setStep(1);
    };

    const handleTest = async () => {
        const key = localStorage.getItem('casekit_api_key');
        if (!key) {
            setTestResult('No API key saved. Please enter and save your key first.');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            if (provider === 'anthropic') {
                const { default: Anthropic } = await import('@anthropic-ai/sdk');
                const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
                const response = await client.messages.create({
                    model: 'claude-sonnet-4-5-20250929',
                    max_tokens: 100,
                    messages: [{ role: 'user', content: 'Reply with exactly: "CaseKit connection successful."' }],
                });
                // Handle thinking blocks (Opus 4.6+) — extract text from text-type blocks
                const textBlocks = response.content.filter((b: { type: string }) => b.type === 'text');
                const text = textBlocks.length > 0 ? (textBlocks[0] as { type: string; text: string }).text : 'OK';
                setTestResult(`✓ Connection successful: ${text}`);
            } else if (provider === 'openai') {
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${key}` },
                });
                if (res.ok) {
                    setTestResult(`✓ Connection successful — OpenAI key is valid.`);
                } else if (res.status === 401) {
                    throw { status: 401 };
                } else {
                    setTestResult(`⚠ OpenAI responded with status ${res.status}. Key may still be valid.`);
                }
            } else if (provider === 'gemini') {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
                );
                if (res.ok) {
                    setTestResult(`✓ Connection successful — Gemini key is valid.`);
                } else if (res.status === 400 || res.status === 403) {
                    throw { status: 401, message: 'Invalid API key' };
                } else {
                    setTestResult(`⚠ Google responded with status ${res.status}. Key may still be valid.`);
                }
            }
        } catch (e: any) {
            if (e.status === 401) {
                setTestResult('✗ Authentication failed. Please check your API key is correct.');
            } else if (e.status === 429) {
                setTestResult('⚠ Rate limit reached. Your key works but you have hit the rate limit. Wait and try again.');
            } else {
                setTestResult(`✗ Error: ${e.message || String(e)}`);
            }
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="page">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                API Key Setup
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Set up your own AI connection to enable merits analysis, letter drafting, and response review.
                Your key is stored on your computer only and never shared with anyone.
            </p>

            {saved && step === 0 ? (
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className="badge badge-green">✓ API Key Saved</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ({PROVIDERS.find((p) => p.id === (localStorage.getItem('casekit_api_provider') || 'anthropic'))?.name})
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Your API key is stored locally and ready to use.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={handleTest} disabled={testing}>
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setStep(3)}>
                            Change Key
                        </button>
                        <button className="btn btn-danger" onClick={handleRemove}>
                            Remove Key
                        </button>
                    </div>
                    {testResult && (
                        <div className="card" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                            <p style={{ fontSize: '0.85rem' }}>{testResult}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* What is an API key? */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What is an API key?</h2>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            You may know AI through products like ChatGPT, which charge a monthly subscription (around £20/month).
                            An <strong>API key</strong> is a different way to access the same technology — it's a personal password that lets
                            software like CaseKit connect directly to an AI provider.
                        </p>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <li><strong>Available to anyone</strong> — you sign up at the provider's website, just like creating any online account</li>
                            <li><strong>Pay-as-you-go</strong> — you only pay for what you use. A typical CaseKit analysis costs just 5–15p. There is no monthly subscription</li>
                            <li><strong>You're in control</strong> — you can set a spending limit on your account, and you'll always see exactly what CaseKit is sending before it's sent</li>
                            <li><strong>More private</strong> — your data goes straight from your computer to the AI provider. No middleman, no third-party server</li>
                        </ul>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            For comparison: a ChatGPT subscription costs £20/month whether you use it or not.
                            With an API key, reviewing an entire case in CaseKit costs roughly 25p.
                            <Link to="/pricing" style={{ marginLeft: '0.5rem', fontWeight: 500 }}>See full pricing →</Link>
                        </p>
                    </div>

                    {/* Provider selector */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Choose your AI provider</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            All three providers offer high-quality AI. Anthropic (Claude) is recommended for legal analysis.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {PROVIDERS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setProvider(p.id)}
                                    style={{
                                        flex: 1,
                                        minWidth: '140px',
                                        padding: '0.625rem 0.75rem',
                                        border: provider === p.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                        borderRadius: '0.375rem',
                                        background: provider === p.id ? 'var(--accent-bg, #f0fdfa)' : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</div>
                                    {p.recommended && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 500 }}>Recommended</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Provider-specific instructions */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            How to get your {currentProvider.name} key
                        </h2>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            This takes about 2 minutes. You'll need an email address and a payment method.
                        </p>
                        <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {currentProvider.steps.map((s, i) => (
                                <li key={i}>
                                    {s.linkUrl ? (
                                        <>
                                            {s.text}{' '}
                                            <a href={s.linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                                                {s.linkLabel}
                                            </a>
                                        </>
                                    ) : (
                                        s.text
                                    )}
                                </li>
                            ))}
                        </ol>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Tip: set a spending limit in your account settings to cap your costs.
                        </p>
                    </div>

                    {/* Security guidance */}
                    <div className="card" style={{ borderColor: 'var(--amber)', borderWidth: '1px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Keep your API key safe</h2>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <li><strong>Treat your API key like a password.</strong> Anyone who has it can make API calls billed to your account.</li>
                            <li><strong>Never share it</strong> — do not paste it into emails, messages, shared documents, or any website other than the provider's console.</li>
                            <li><strong>Set a spending limit</strong> in your account settings to cap how much can be charged, even if the key were compromised.</li>
                            <li><strong>If you think your key has been exposed,</strong> go to your provider's console immediately, delete the compromised key, and generate a new one.</li>
                        </ul>
                    </div>

                    {/* Key entry */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enter your API key</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input
                                type="password"
                                className="input"
                                placeholder={currentProvider.keyPrefix + '...'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                aria-label={`${currentProvider.name} API key`}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={handleSave} disabled={!apiKey.trim()}>
                                    Save Key
                                </button>
                                {saved && (
                                    <button className="btn btn-secondary" onClick={() => setStep(0)}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Your key is stored in your browser's local storage on this computer only. It is never written to any file or sent to any server other than the provider's API endpoint.
                        </p>
                    </div>

                    {/* Offline privacy note */}
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.5rem',
                        padding: '0.875rem 1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        fontSize: '0.85rem',
                        color: '#166534',
                    }}>

                        <div>
                            <strong>CaseKit has no internet connection by default.</strong> Your API key is only used
                            when you explicitly press "Analyse" on an AI feature. At all other times, CaseKit makes
                            zero network requests. There is no background connectivity, no analytics, and no data collection.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
