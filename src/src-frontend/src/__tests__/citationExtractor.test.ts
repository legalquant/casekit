/**
 * Tests for client-side citation extraction.
 * Verifies that neutral citations, traditional report citations,
 * and case name extraction all work correctly.
 */
import { describe, it, expect } from 'vitest';
import { extractCitations, containsCitations } from '../lib/citationExtractor';

describe('extractCitations', () => {
    describe('neutral citations', () => {
        it('extracts UKSC citations', () => {
            const text = 'The Supreme Court held in Patel v Mirza [2016] UKSC 42 that illegality...';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[2016] UKSC 42');
            expect(results[0].isNeutral).toBe(true);
        });

        it('extracts EWCA Civ citations', () => {
            const text = 'See Robinson v Chief Constable [2018] EWCA Civ 13 for the test.';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[2018] EWCA Civ 13');
        });

        it('extracts EWHC citations with division', () => {
            const text = 'The court in [2023] EWHC 1234 (Ch) decided...';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[2023] EWHC 1234 (Ch)');
        });

        it('extracts UKEAT citations', () => {
            const text = 'In Ayinde v Leidos [2024] UKEAT 56 the tribunal...';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[2024] UKEAT 56');
        });

        it('extracts multiple citations from one text', () => {
            const text = `
                First case: [2020] UKSC 5
                Second case: [2019] EWCA Civ 200
                Third case: [2021] EWHC 999 (QB)
            `;
            const results = extractCitations(text);
            expect(results).toHaveLength(3);
        });

        it('deduplicates identical citations', () => {
            const text = 'See [2020] UKSC 5 and also [2020] UKSC 5 again.';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
        });
    });

    describe('traditional report citations', () => {
        it('extracts AC (Appeal Cases) citations', () => {
            const text = 'Donoghue v Stevenson [1932] AC 562';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[1932] AC 562');
            expect(results[0].isNeutral).toBe(false);
        });

        it('extracts WLR citations', () => {
            const text = 'See [2005] 1 WLR 1681 for the principle.';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
            expect(results[0].citation).toBe('[2005] 1 WLR 1681');
        });

        it('extracts QB citations', () => {
            const text = 'Reported at [1998] QB 834.';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
        });

        it('extracts All ER citations', () => {
            const text = '[2001] 1 All ER 289';
            const results = extractCitations(text);
            expect(results).toHaveLength(1);
        });
    });

    describe('case name extraction', () => {
        it('extracts "Party A v Party B" before citation', () => {
            const text = 'The court considered Smith v Jones [2020] UKSC 10 carefully.';
            const results = extractCitations(text);
            expect(results[0].caseName).toBe('Smith v Jones');
        });

        it('extracts case names with Ltd suffix', () => {
            const text = 'In Global Trading Ltd v Mercury Corp [2019] EWHC 500 (Comm)';
            const results = extractCitations(text);
            expect(results[0].caseName).toContain('Global Trading Ltd');
            expect(results[0].caseName).toContain('Mercury Corp');
        });

        it('handles R v Name (criminal)', () => {
            const text = 'R v Adams [2020] EWCA Crim 100 established...';
            const results = extractCitations(text);
            expect(results[0].caseName).toBe('R v Adams');
        });

        it('returns undefined when no case name is present', () => {
            const text = 'The neutral citation is [2020] UKSC 5.';
            const results = extractCitations(text);
            expect(results[0].caseName).toBeUndefined();
        });
    });

    describe('mixed content', () => {
        it('extracts citations from a realistic legal paragraph', () => {
            const text = `
                Under the Consumer Rights Act 2015, goods must be of satisfactory quality (s.9).
                The leading authority is Clegg v Olle Andersson [2003] EWCA Civ 320, where
                the Court of Appeal considered rejection rights. See also Bramhill v Edwards
                [2004] 2 Lloyd's Rep 653 on the question of acceptable quality.
                The Supreme Court in Patel v Mirza [2016] UKSC 42 addressed illegality.
            `;
            const results = extractCitations(text);
            expect(results.length).toBeGreaterThanOrEqual(2);
            const citations = results.map((r) => r.citation);
            expect(citations).toContain('[2003] EWCA Civ 320');
            expect(citations).toContain('[2016] UKSC 42');
        });

        it('ignores statutory references (not case citations)', () => {
            const text = 'Consumer Rights Act 2015, s.9 provides that goods must be of satisfactory quality.';
            const results = extractCitations(text);
            expect(results).toHaveLength(0);
        });
    });
});

describe('containsCitations', () => {
    it('returns true when citations are present', () => {
        expect(containsCitations('See [2020] UKSC 5.')).toBe(true);
    });

    it('returns false when no citations are present', () => {
        expect(containsCitations('No case law here, just statute.')).toBe(false);
    });

    it('detects traditional citations', () => {
        expect(containsCitations('[1932] AC 562')).toBe(true);
    });
});
