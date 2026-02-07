/**
 * Client-side citation extraction from text.
 * All parsing happens locally — no data is sent anywhere.
 * Only the extracted citation strings are later sent to BAILII/FCL.
 */

import type { ExtractedCitation } from '../types/citation';

// Neutral citation patterns for UK courts
const NEUTRAL_PATTERNS = [
    { code: 'UKSC', regex: /\[(\d{4})\]\s+UKSC\s+(\d+)/gi },
    { code: 'UKHL', regex: /\[(\d{4})\]\s+UKHL\s+(\d+)/gi },
    { code: 'UKPC', regex: /\[(\d{4})\]\s+UKPC\s+(\d+)/gi },
    { code: 'EWCA Civ', regex: /\[(\d{4})\]\s+EWCA\s+Civ\s+(\d+)/gi },
    { code: 'EWCA Crim', regex: /\[(\d{4})\]\s+EWCA\s+Crim\s+(\d+)/gi },
    { code: 'EWHC', regex: /\[(\d{4})\]\s+EWHC\s+(\d+)(?:\s+\([A-Za-z]+\))?/gi },
    { code: 'EWCOP', regex: /\[(\d{4})\]\s+EWCOP\s+(\d+)/gi },
    { code: 'EWFC', regex: /\[(\d{4})\]\s+EWFC\s+(\d+)/gi },
    { code: 'UKUT', regex: /\[(\d{4})\]\s+UKUT\s+(\d+)(?:\s+\([A-Za-z]+\))?/gi },
    { code: 'UKFTT', regex: /\[(\d{4})\]\s+UKFTT\s+(\d+)(?:\s+\([A-Za-z]+\))?/gi },
    { code: 'UKEAT', regex: /\[(\d{4})\]\s+UKEAT\s+(\d+)/gi },
];

// Traditional law report patterns
const TRADITIONAL_PATTERNS = [
    /\[\d{4}\]\s+\d*\s*AC\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*QB\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*KB\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*WLR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*All\s*ER\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*Ch\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*Fam\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*ICR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*IRLR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*FLR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*BCLC\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*BCC\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*Lloyd['']\s*s\s+Rep\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*P\s*&\s*CR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*HLR\s+\d+/gi,
    /\[\d{4}\]\s+\d*\s*CMLR\s+\d+/gi,
];

/**
 * Extract the case name from text preceding a citation.
 *
 * Uses a word-level backward walk from "v" to find where the first party
 * name actually starts, avoiding capture of surrounding prose like
 * "Defendant sought to rely upon" or "the Court of Appeal in".
 */
function extractCaseName(text: string, citationStart: number): string | undefined {
    // Grab text before the citation, strip trailing punctuation
    const before = text
        .substring(Math.max(0, citationStart - 300), citationStart)
        .replace(/[,;:\s]+$/, '')
        .trim();

    // --- Special case: "R v Name" or "R (Name) v Name" ---
    const rMatch = before.match(
        /\bR\s*(?:\([^)]+\)\s*)?v\.?\s+[A-Z][A-Za-z''\-]+(?:\s+[A-Za-z''\-&()]+)*$/
    );
    if (rMatch) {
        return rMatch[0].trim();
    }

    // --- Special case: "In re Name" or "Re Name" ---
    const reMatch = before.match(
        /\b(?:In\s+re|Re)\s+[A-Z][A-Za-z''\-]+(?:\s+[A-Za-z''\-&()]+)*$/i
    );
    if (reMatch) {
        return reMatch[0].trim();
    }

    // --- General "Party A v Party B" ---
    // Step 1: Find " v " or " v. " — the case separator
    const vRegex = /\s+v\.?\s+/g;
    let lastVMatch: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = vRegex.exec(before)) !== null) {
        lastVMatch = m;
    }
    if (!lastVMatch) return undefined;

    const vStart = lastVMatch.index;
    const vEnd = vStart + lastVMatch[0].length;

    // Step 2: Party 2 = everything after "v" to end of `before`
    const party2 = before.substring(vEnd).trim();
    if (!party2 || !/^[A-Z]/.test(party2)) return undefined;

    // Step 3: Party 1 = walk backwards from "v" word by word
    const party1Raw = before.substring(0, vStart).trim();
    const words = party1Raw.split(/\s+/);

    // Legal name connectors: allowed between proper nouns in a party name
    const NAME_CONNECTORS = new Set(['of', 'the', 'for', 'and', '&', 'de', 'van', 'von', 'du', 'la', 'le', 'el']);

    let startIdx = words.length; // will walk backwards

    for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i];
        const bare = word.replace(/[,;:()]/g, ''); // strip punctuation for testing

        const isUpperStart = /^[A-Z]/.test(bare);
        const isConnector = NAME_CONNECTORS.has(bare.toLowerCase());
        const isLegalSuffix = /^(Ltd|Limited|Plc|PLC|LLP|Inc|Corp|LLC|Council|Borough|NHS|CIC|Ors|ORS)$/i.test(bare);
        const isAmpersand = bare === '&';

        if (isUpperStart || isLegalSuffix || isAmpersand) {
            startIdx = i;
        } else if (isConnector) {
            // Only keep connector if the next word was already accepted into the name
            // This allows chains like "of State for the Home" but stops at prose connectors
            if (startIdx === i + 1) {
                startIdx = i;
            } else {
                break; // connector not adjacent to an accepted name word — stop
            }
        } else {
            break; // lowercase non-connector word — stop
        }
    }

    const party1 = words.slice(startIdx).join(' ');
    if (party1.length < 1 || party2.length < 1) return undefined;
    if (!/[A-Z]/.test(party1)) return undefined;

    const result = `${party1} v ${party2}`;
    if (result.length < 5 || result.length > 200) return undefined;

    return result;
}


/**
 * Extract all citations from a block of text.
 * Runs entirely client-side — no network requests.
 */
export function extractCitations(text: string): ExtractedCitation[] {
    const results: ExtractedCitation[] = [];
    const seen = new Set<string>();

    // First pass: neutral citations (higher priority)
    for (const pattern of NEUTRAL_PATTERNS) {
        // Reset regex lastIndex
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(text)) !== null) {
            const citation = match[0].trim();
            const normalised = citation.replace(/\s+/g, ' ');

            if (!seen.has(normalised)) {
                seen.add(normalised);
                const caseName = extractCaseName(text, match.index);
                results.push({
                    citation: normalised,
                    caseName,
                    isNeutral: true,
                    sourceText: text.substring(
                        Math.max(0, match.index - 50),
                        Math.min(text.length, match.index + match[0].length + 50)
                    ).trim(),
                });
            }
        }
    }

    // Second pass: traditional citations
    for (const pattern of TRADITIONAL_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
            const citation = match[0].trim();
            const normalised = citation.replace(/\s+/g, ' ');

            if (!seen.has(normalised)) {
                seen.add(normalised);
                const caseName = extractCaseName(text, match.index);
                results.push({
                    citation: normalised,
                    caseName,
                    isNeutral: false,
                    sourceText: text.substring(
                        Math.max(0, match.index - 50),
                        Math.min(text.length, match.index + match[0].length + 50)
                    ).trim(),
                });
            }
        }
    }

    return results;
}

/**
 * Check if text appears to contain any case law citations.
 * Quick check — doesn't extract them, just returns true/false.
 */
export function containsCitations(text: string): boolean {
    for (const pattern of NEUTRAL_PATTERNS) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(text)) return true;
    }
    for (const pattern of TRADITIONAL_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(text)) return true;
    }
    return false;
}
