/**
 * Tests for AI review panel logic — auto-redaction patterns and context assembly.
 * These test the functions extracted from AiReviewPanel.tsx.
 */
import { describe, it, expect } from 'vitest';

// ── Replicate the autoRedact function from AiReviewPanel ──
// (We test the logic directly rather than importing from a component)

function autoRedact(text: string): string {
    return text
        .replace(/(?:\+44|0)\s*[1-9]\d{1,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, '[PHONE REDACTED]')
        .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
        .replace(/\b[A-Z]{2}\s*\d{2}\s*\d{2}\s*\d{2}\s*[A-D]\b/gi, '[NI NUMBER REDACTED]')
        .replace(/(?:sort\s*code|s\/c|sc)[:\s]*\d{2}[\s-]\d{2}[\s-]\d{2}/gi, '[SORT CODE REDACTED]')
        .replace(/(?:account\s*(?:no\.?|number|num|#)|a\/c)[:\s]*\d{6,8}/gi, '[ACCOUNT NO. REDACTED]')
        .replace(/\b(?:DOB|Date of Birth|D\.O\.B)[:\s]+\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/gi, '[DOB REDACTED]');
}

describe('autoRedact', () => {
    describe('phone numbers', () => {
        it('redacts UK mobile numbers', () => {
            expect(autoRedact('Call me on 07700 900123')).toBe('Call me on [PHONE REDACTED]');
        });

        it('redacts UK landlines', () => {
            expect(autoRedact('Office: 020 7946 0958')).toBe('Office: [PHONE REDACTED]');
        });

        it('redacts +44 format', () => {
            expect(autoRedact('Phone: +44 7700 900123')).toBe('Phone: [PHONE REDACTED]');
        });

        it('preserves non-phone numbers', () => {
            const text = 'Reference number: 12345';
            expect(autoRedact(text)).toBe(text);
        });
    });

    describe('email addresses', () => {
        it('redacts email addresses', () => {
            expect(autoRedact('Email: john@example.com')).toBe('Email: [EMAIL REDACTED]');
        });

        it('handles complex email formats', () => {
            expect(autoRedact('user.name+tag@company.co.uk')).toBe('[EMAIL REDACTED]');
        });
    });

    describe('NI numbers', () => {
        it('redacts National Insurance numbers', () => {
            expect(autoRedact('NI: AB 12 34 56 C')).toBe('NI: [NI NUMBER REDACTED]');
        });

        it('redacts compact NI numbers', () => {
            expect(autoRedact('AB123456C')).toBe('[NI NUMBER REDACTED]');
        });
    });

    describe('sort codes (context-aware)', () => {
        it('redacts sort codes with keyword', () => {
            expect(autoRedact('Sort code: 12-34-56')).toBe('[SORT CODE REDACTED]');
        });

        it('redacts s/c abbreviation', () => {
            expect(autoRedact('s/c 12-34-56')).toBe('[SORT CODE REDACTED]');
        });

        it('does NOT redact dates that look like sort codes', () => {
            const text = 'The event occurred on 05-10-23';
            expect(autoRedact(text)).toBe(text);
        });

        it('does NOT redact arbitrary xx-xx-xx patterns', () => {
            const text = 'Reference: 12-34-56';
            expect(autoRedact(text)).toBe(text);
        });
    });

    describe('account numbers (context-aware)', () => {
        it('redacts account numbers with keyword', () => {
            expect(autoRedact('Account no: 12345678')).toBe('[ACCOUNT NO. REDACTED]');
        });

        it('redacts a/c abbreviation', () => {
            expect(autoRedact('a/c 87654321')).toBe('[ACCOUNT NO. REDACTED]');
        });

        it('does NOT redact standalone 8-digit numbers', () => {
            const text = 'Claim reference 20240115';
            expect(autoRedact(text)).toBe(text);
        });

        it('does NOT redact dates formatted as 8 digits', () => {
            const text = 'Invoice 15032024';
            expect(autoRedact(text)).toBe(text);
        });
    });

    describe('dates of birth', () => {
        it('redacts DOB patterns', () => {
            expect(autoRedact('DOB: 15/03/1985')).toBe('[DOB REDACTED]');
        });

        it('redacts Date of Birth patterns', () => {
            expect(autoRedact('Date of Birth: 01-02-1990')).toBe('[DOB REDACTED]');
        });

        it('does NOT redact regular dates', () => {
            const text = 'The invoice is dated 15/03/2024.';
            expect(autoRedact(text)).toBe(text);
        });
    });

    describe('legal content preservation', () => {
        it('preserves monetary amounts', () => {
            const text = 'The purchase price was £849.99 paid on 15 June 2024.';
            expect(autoRedact(text)).toBe(text);
        });

        it('preserves case references', () => {
            const text = 'See Smith v Jones [2020] UKSC 42.';
            expect(autoRedact(text)).toBe(text);
        });

        it('preserves court form numbers', () => {
            const text = 'File form N1 with the court.';
            expect(autoRedact(text)).toBe(text);
        });

        it('preserves statutory references', () => {
            const text = 'Consumer Rights Act 2015, s.9';
            expect(autoRedact(text)).toBe(text);
        });

        it('handles mixed sensitive and legal content', () => {
            const text = 'John (john@example.com, 07700 900123) purchased goods for £500 on 15/03/2024.';
            const result = autoRedact(text);
            expect(result).toContain('[EMAIL REDACTED]');
            expect(result).toContain('[PHONE REDACTED]');
            expect(result).toContain('£500');
            expect(result).toContain('15/03/2024');
        });
    });
});
