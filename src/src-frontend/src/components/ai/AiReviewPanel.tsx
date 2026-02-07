export default function AiReviewPanel() {
    const hasApiKey = !!localStorage.getItem('casekit_api_key');

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                AI Review
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Get structured AI analysis of your case using your own Anthropic API key.
            </p>

            {!hasApiKey ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>No API Key</p>
                    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>API Key Required</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        You need to set up your Anthropic API key before using AI review features.
                    </p>
                    <a href="/api-setup" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                        Set up API Key →
                    </a>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>

                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Select Analysis Type</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Choose what kind of analysis you need for your case.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { label: 'Merits Assessment', desc: 'Assess your claim strength with traffic light rating' },
                                { label: 'Pre-Action Letter', desc: 'Draft a letter before claim to the defendant' },
                                { label: 'Response Review', desc: "Analyse the defendant's response" },
                                { label: 'Particulars of Claim', desc: 'Draft Particulars for N1 form' },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    className="card"
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        padding: '1rem',
                                        transition: 'border-color 0.15s',
                                        border: '1px solid var(--color-border)',
                                    }}
                                    aria-label={item.label}
                                >

                                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                        {item.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            background: '#f7fafc',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.375rem',
                            padding: '0.75rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        Before any AI call, you will see exactly what information will be sent to Anthropic's API. No data is
                        transmitted without your explicit confirmation.
                    </div>
                </div>
            )}
        </div>
    );
}
