import { useState } from 'react';

export default function ApiKeySetup() {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(!!localStorage.getItem('casekit_api_key'));
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [step, setStep] = useState(saved ? 0 : 1);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('casekit_api_key', apiKey.trim());
            setSaved(true);
            setTestResult(null);
        }
    };

    const handleRemove = () => {
        localStorage.removeItem('casekit_api_key');
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
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
            const response = await client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 50,
                messages: [{ role: 'user', content: 'Reply with exactly: "CaseKit connection successful."' }],
            });
            const text = response.content[0].type === 'text' ? response.content[0].text : 'OK';
            setTestResult(`Connection successful: ${text}`);
        } catch (e: any) {
            if (e.status === 401) {
                setTestResult('Authentication failed. Please check your API key is correct.');
            } else if (e.status === 429) {
                setTestResult('Rate limit reached. Your key works but you have hit the rate limit. Wait and try again.');
            } else {
                setTestResult(`Error: ${e.message || String(e)}`);
            }
        } finally {
            setTesting(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                API Key Setup
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                CaseKit uses your own Anthropic API key for AI analysis. Your key is stored locally in your browser and never
                sent anywhere except api.anthropic.com.
            </p>

            {saved && step === 0 ? (
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className="badge badge-green">✓ API Key Saved</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Your API key is stored locally and ready to use.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    {/* Step 1: Explanation */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>What this does</h2>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <li>CaseKit sends your case information to Claude (Anthropic's AI) for analysis</li>
                            <li>You pay Anthropic directly — typically ~5-15p per analysis call</li>
                            <li>A full case assessment costs approximately 15-25p total</li>
                            <li>Your data goes directly from your computer to api.anthropic.com — it never passes through any other server</li>
                            <li>You will always see exactly what is being sent before confirming</li>
                        </ul>
                    </div>

                    {/* Step 2: Instructions */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>How to get an API key</h2>
                        <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <li>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>console.anthropic.com</a></li>
                            <li>Create an account (email + password)</li>
                            <li>Add credit (minimum $5 / ~£4)</li>
                            <li>Navigate to API Keys and generate a new key</li>
                            <li>Copy the key and paste it below</li>
                        </ol>
                    </div>

                    {/* Security guidance */}
                    <div className="card" style={{ borderColor: 'var(--color-warning)', borderWidth: '1px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Keep your API key safe</h2>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <li><strong>Treat your API key like a password.</strong> Anyone who has it can make API calls billed to your account.</li>
                            <li><strong>Never share it</strong> — do not paste it into emails, messages, shared documents, or any website other than console.anthropic.com.</li>
                            <li><strong>Anthropic cannot recover your key.</strong> If you lose it, generate a new one and delete the old one from your Anthropic dashboard.</li>
                            <li><strong>Set a spending limit</strong> in your Anthropic account settings to cap how much can be charged, even if the key were compromised.</li>
                            <li><strong>If you think your key has been exposed,</strong> go to console.anthropic.com immediately, delete the compromised key, and generate a new one.</li>
                        </ul>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            CaseKit stores your key in your browser's local storage on this computer only. It is never written to a file, logged, or sent anywhere other than api.anthropic.com when you explicitly initiate an AI analysis.
                        </p>
                    </div>
                    {/* Step 3: Key entry */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enter your API key</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input
                                type="password"
                                className="input"
                                placeholder="sk-ant-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                aria-label="Anthropic API key"
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
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Your key is stored in your browser's local storage only. It is never written to any file or sent to any server other than api.anthropic.com.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
