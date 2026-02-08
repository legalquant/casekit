import { useState } from 'react';

const REDACTION_PATTERNS = [
    { label: 'Bank account numbers', pattern: /\b\d{6,8}\b/g, description: 'Sort codes and account numbers' },
    { label: 'Card numbers', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, description: 'Credit/debit card numbers' },
    { label: 'National Insurance numbers', pattern: /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi, description: 'NI numbers (XX 00 00 00 X)' },
    { label: 'Email addresses', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, description: 'Email addresses' },
    { label: 'Phone numbers', pattern: /\b(?:0\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}|\+44[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})\b/g, description: 'UK phone numbers' },
    { label: 'Postcodes', pattern: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, description: 'UK postcodes' },
];

interface RedactionToolProps {
    text: string;
    onRedacted: (redactedText: string) => void;
}

interface Redaction {
    pattern: string;
    count: number;
    enabled: boolean;
}

export default function RedactionTool({ text, onRedacted }: RedactionToolProps) {
    const [customTerms, setCustomTerms] = useState('');
    const [redactions, setRedactions] = useState<Redaction[]>(() =>
        REDACTION_PATTERNS.map(p => ({
            pattern: p.label,
            count: (text.match(p.pattern) || []).length,
            enabled: true,
        }))
    );

    const toggleRedaction = (index: number) => {
        setRedactions(prev => prev.map((r, i) =>
            i === index ? { ...r, enabled: !r.enabled } : r
        ));
    };

    const applyRedactions = () => {
        let result = text;

        // Apply pattern-based redactions
        REDACTION_PATTERNS.forEach((p, i) => {
            if (redactions[i].enabled && redactions[i].count > 0) {
                result = result.replace(p.pattern, '[REDACTED]');
            }
        });

        // Apply custom term redactions
        if (customTerms.trim()) {
            const terms = customTerms.split('\n').filter(t => t.trim());
            for (const term of terms) {
                const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                result = result.replace(new RegExp(escaped, 'gi'), '[REDACTED]');
            }
        }

        onRedacted(result);
    };

    const totalFound = redactions.reduce((sum, r) => sum + (r.enabled ? r.count : 0), 0);
    const customCount = customTerms.split('\n').filter(t => t.trim()).length;

    return (
        <div className="card" style={{ border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Redaction Tool
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Remove sensitive information before sending to AI. Matched items will be replaced with [REDACTED].
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {REDACTION_PATTERNS.map((p, i) => (
                    <label
                        key={p.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            opacity: redactions[i].count === 0 ? 0.5 : 1,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={redactions[i].enabled}
                            onChange={() => toggleRedaction(i)}
                            disabled={redactions[i].count === 0}
                        />
                        <span>{p.label}</span>
                        {redactions[i].count > 0 && (
                            <span style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '0 0.375rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                            }}>
                                {redactions[i].count} found
                            </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {p.description}
                        </span>
                    </label>
                ))}
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Custom terms to redact (one per line)
                </label>
                <textarea
                    className="input"
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                    placeholder="e.g. your full name, address, account reference..."
                    rows={3}
                    style={{ fontSize: '0.8rem', resize: 'vertical' }}
                />
                {customCount > 0 && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {customCount} custom term{customCount !== 1 ? 's' : ''} will be redacted
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={applyRedactions}>
                    Apply Redactions ({totalFound + customCount} items)
                </button>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                    Review the redacted text before sending
                </p>
            </div>
        </div>
    );
}
