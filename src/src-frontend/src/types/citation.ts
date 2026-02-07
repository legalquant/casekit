// Citation resolution types (matching Rust backend)

export interface UrlCheckResult {
    url: string;
    exists: boolean;
    statusCode: number;
    title?: string;
}

export interface ResolvedCandidate {
    url: string;
    source: 'bailii' | 'find_case_law' | string;
    confidence: number;
    title?: string;
    resolutionMethod: string;
}

export interface CitationResolution {
    citation: string;
    caseName?: string;
    candidates: ResolvedCandidate[];
    status: 'resolved' | 'unresolvable';
    attemptsLog: string[];
}

export interface FetchedJudgment {
    url: string;
    title?: string;
    contentType: string;
    content: string;
    ok: boolean;
}

export interface Authority {
    id: string;
    citation: string;
    caseName?: string;
    url: string;
    source: string;
    title?: string;
    dateAdded: string;
    notes?: string;
}

// Citation extraction types (client-side)

export interface ExtractedCitation {
    citation: string;
    caseName?: string;
    isNeutral: boolean;
    sourceText?: string;
}

export type CitationVerificationStatus =
    | 'pending'
    | 'resolving'
    | 'verified'
    | 'not_found'
    | 'error';

export interface VerifiedCitation extends ExtractedCitation {
    status: CitationVerificationStatus;
    resolution?: CitationResolution;
    error?: string;
}
