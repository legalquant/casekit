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
}

export type AiCallType =
    | 'merits_assessment'
    | 'pre_action_letter'
    | 'response_review'
    | 'particulars_draft';

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
    claimSummary: string;
    legalBasis: string[];
    meritsRating: 'strong' | 'arguable' | 'weak' | 'no_claim';
    meritsReasoning: string;
    evidenceGaps: string[];
    opponentArguments: string;
    quantumEstimate: { low: number; high: number; basis: string };
    risks: string[];
    options: { option: string; tradeOff: string }[];
    uncertaintyFlags: string[];
}
