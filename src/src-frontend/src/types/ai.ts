export interface ChronologyEntry {
    id: string;
    date: string;
    description: string;
    source: 'document' | 'intake' | 'manual' | 'ai_extracted';
    document_id?: string;
    source_document_path?: string;
    significance: 'key' | 'supporting' | 'background';
    confidence?: 'high' | 'medium' | 'low';
}

export interface AssembledContext {
    caseType: 'cra_goods' | 'cra_services';
    userRole: 'claimant' | 'defendant';
    parties: {
        claimant: { name: string };
        defendant: { name: string; type: 'individual' | 'company' | 'sole_trader' };
    };
    timeline: ChronologyEntry[];
    selectedDocuments: {
        filename: string;
        type: string;
        extractedText: string;
        dateTagged: string;
        userDescription: string;
    }[];
    userQuestion: string;
    previousAiCalls?: {
        callType: string;
        summary: string;
    }[];
    /** Drafting instructions — only for pre-action letter, defence, and particulars */
    instructions?: DraftingInstructions;
}

export type AiCallType =
    | 'merits_assessment'
    | 'pre_action_letter'
    | 'response_review'
    | 'particulars_draft'
    | 'response_to_letter'
    | 'defence_draft';

export interface DraftingInstructions {
    remedySought: string;
    deadline: string;
    keyPoints: string;
    tone: 'formal' | 'firm' | 'conciliatory';
    priorOffers: string;
    additionalContext: string;
    /** Particulars / Defence only */
    exactAmount?: string;
    interestClaimed?: boolean;
}

export interface AiCallRecord {
    id: string;
    callType: AiCallType;
    timestamp: string;
    inputTokens: number;
    outputTokens: number;
    model: string;
    response: string;
    parsedResponse?: ParsedMeritsResponse;
}

export interface ParsedMeritsResponse {
    factualSummary: string;
    documentReferences: { document: string; relevance: string }[];
    legalFramework: { provision: string; application: string }[];
    claimantPosition: {
        potentialCausesOfAction: string[];
        strengthsOfPosition: string[];
        weaknesses: string[];
    };
    defendantPosition: {
        potentialDefences: string[];
        strengthsOfPosition: string[];
        weaknesses: string[];
    };
    limitationPeriod: {
        applicablePeriod: string;
        expiryEstimate: string;
        notes: string;
    };
    quantumAnalysis: { low: number; high: number; basis: string };
    proceduralConsiderations: string[];
    keyUncertainties: string[];
}
