/**
 * Tests for chronology sorting logic.
 * Verifies that entries are correctly sorted by date for display.
 */
import { describe, it, expect } from 'vitest';
import type { ChronologyEntry } from '../types/ai';

// Replicate the sort logic from ChronologyView
function sortChronology(entries: ChronologyEntry[]): ChronologyEntry[] {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

describe('chronology sorting', () => {
    it('sorts entries chronologically by ISO date', () => {
        const entries: ChronologyEntry[] = [
            { id: '3', date: '2024-09-01', description: 'Third', source: 'manual', significance: 'key' },
            { id: '1', date: '2024-01-15', description: 'First', source: 'manual', significance: 'key' },
            { id: '2', date: '2024-06-20', description: 'Second', source: 'manual', significance: 'supporting' },
        ];

        const sorted = sortChronology(entries);

        expect(sorted[0].description).toBe('First');
        expect(sorted[1].description).toBe('Second');
        expect(sorted[2].description).toBe('Third');
    });

    it('handles entries on the same date', () => {
        const entries: ChronologyEntry[] = [
            { id: '2', date: '2024-06-15', description: 'B', source: 'manual', significance: 'supporting' },
            { id: '1', date: '2024-06-15', description: 'A', source: 'document', significance: 'key' },
        ];

        const sorted = sortChronology(entries);

        // Same date — order is stable (original insertion order preserved by sort)
        expect(sorted).toHaveLength(2);
        expect(sorted[0].date).toBe('2024-06-15');
        expect(sorted[1].date).toBe('2024-06-15');
    });

    it('handles empty chronology', () => {
        expect(sortChronology([])).toEqual([]);
    });

    it('handles single entry', () => {
        const entries: ChronologyEntry[] = [
            { id: '1', date: '2024-03-15', description: 'Only entry', source: 'manual', significance: 'key' },
        ];

        const sorted = sortChronology(entries);
        expect(sorted).toHaveLength(1);
        expect(sorted[0].description).toBe('Only entry');
    });

    it('sorts across year boundaries', () => {
        const entries: ChronologyEntry[] = [
            { id: '2', date: '2025-01-05', description: 'New year', source: 'manual', significance: 'key' },
            { id: '1', date: '2024-12-20', description: 'End of year', source: 'manual', significance: 'key' },
        ];

        const sorted = sortChronology(entries);

        expect(sorted[0].description).toBe('End of year');
        expect(sorted[1].description).toBe('New year');
    });

    it('handles month-only dates (YYYY-MM)', () => {
        const entries: ChronologyEntry[] = [
            { id: '2', date: '2024-09', description: 'September', source: 'document', significance: 'background' },
            { id: '1', date: '2024-03', description: 'March', source: 'document', significance: 'background' },
            { id: '3', date: '2024-06-15', description: 'June 15th', source: 'manual', significance: 'key' },
        ];

        const sorted = sortChronology(entries);

        expect(sorted[0].description).toBe('March');
        expect(sorted[1].description).toBe('June 15th');
        expect(sorted[2].description).toBe('September');
    });

    it('does not mutate the original array', () => {
        const entries: ChronologyEntry[] = [
            { id: '2', date: '2024-09-01', description: 'Later', source: 'manual', significance: 'key' },
            { id: '1', date: '2024-01-01', description: 'Earlier', source: 'manual', significance: 'key' },
        ];

        const sorted = sortChronology(entries);

        expect(entries[0].description).toBe('Later');  // Original unchanged
        expect(sorted[0].description).toBe('Earlier'); // Sorted copy
    });
});
