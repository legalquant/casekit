import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';
import { saveAiCall } from '../../lib/tauri-commands';
import type { AiCallType, AssembledContext, AiCallRecord, ParsedMeritsResponse, DraftingInstructions } from '../../types/ai';
import type { UserRole } from '../../types/case';

/* ─── Analysis types, filtered by user role ─── */
const ALL_ANALYSIS_TYPES: { type: AiCallType; label: string; desc: string; roles: UserRole[] }[] = [
    { type: 'merits_assessment', label: 'Case Analysis', desc: 'Objective analysis of both parties\' positions, limitation, and evidence', roles: ['claimant', 'defendant'] },
    { type: 'pre_action_letter', label: 'Pre-Action Letter', desc: 'Draft a Letter Before Claim to the defendant', roles: ['claimant'] },
    { type: 'response_to_letter', label: 'Response to Letter', desc: 'Draft a response to a pre-action letter', roles: ['defendant'] },
    { type: 'response_review', label: 'Response Review', desc: 'Analyse the opposing party\'s correspondence', roles: ['claimant', 'defendant'] },
    { type: 'particulars_draft', label: 'Particulars of Claim', desc: 'Draft Particulars for the N1 form', roles: ['claimant'] },
    { type: 'defence_draft', label: 'Defence', desc: 'Draft a Defence (and Counterclaim if applicable)', roles: ['defendant'] },
];

const NEEDS_INSTRUCTIONS: AiCallType[] = ['pre_action_letter', 'response_to_letter', 'particulars_draft', 'defence_draft'];

/* ─── Model options with pricing (verify at provider sites — prices change) ─── */
const MODEL_OPTIONS: { id: string; label: string; provider: string; inputPer1M: number; outputPer1M: number; note?: string }[] = [
    // Anthropic — https://docs.anthropic.com/en/about-claude/pricing
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', provider: 'anthropic', inputPer1M: 3, outputPer1M: 15, note: 'Recommended' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic', inputPer1M: 5, outputPer1M: 25, note: 'Most capable' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic', inputPer1M: 1, outputPer1M: 5, note: 'Fast, cheapest' },
    // OpenAI — https://platform.openai.com/docs/pricing
    { id: 'gpt-5.2', label: 'GPT-5.2', provider: 'openai', inputPer1M: 1.75, outputPer1M: 14, note: 'Most capable OpenAI' },
    { id: 'gpt-5', label: 'GPT-5', provider: 'openai', inputPer1M: 1.25, outputPer1M: 10 },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai', inputPer1M: 0.25, outputPer1M: 2, note: 'Fast, cheap' },
    { id: 'o3', label: 'o3 (reasoning)', provider: 'openai', inputPer1M: 2, outputPer1M: 8, note: 'Reasoning' },
    { id: 'o4-mini', label: 'o4-mini (reasoning)', provider: 'openai', inputPer1M: 1.10, outputPer1M: 4.40, note: 'Fast reasoning' },
    // Google — https://ai.google.dev/gemini-api/docs/pricing
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', provider: 'gemini', inputPer1M: 2, outputPer1M: 12, note: 'Most capable Google' },
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', provider: 'gemini', inputPer1M: 0.50, outputPer1M: 3, note: 'Fast' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini', inputPer1M: 1.25, outputPer1M: 10 },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini', inputPer1M: 0.30, outputPer1M: 2.50, note: 'Cheapest' },
];

/* Default model per provider */
const DEFAULT_MODELS: Record<string, string> = {
    anthropic: 'claude-sonnet-4-5',
    openai: 'gpt-5.2',
    gemini: 'gemini-3-pro-preview',
};

/* ─── Automatic PII redaction patterns ─── */
function autoRedact(text: string): string {
    return text
        // UK mobile & landline numbers (require leading +44 or 0, with typical length)
        .replace(/(?:\+44|0)\s*[1-9]\d{1,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, '[PHONE REDACTED]')
        // Email addresses
        .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
        // National Insurance numbers (e.g. AB 12 34 56 C)
        .replace(/\b[A-Z]{2}\s*\d{2}\s*\d{2}\s*\d{2}\s*[A-D]\b/gi, '[NI NUMBER REDACTED]')
        // UK sort codes — require context keywords nearby to avoid matching dates
        .replace(/(?:sort\s*code|s\/c|sc)[:\s]*\d{2}[\s-]\d{2}[\s-]\d{2}/gi, '[SORT CODE REDACTED]')
        // Bank account numbers — require context keywords nearby to avoid matching reference numbers
        .replace(/(?:account\s*(?:no\.?|number|num|#)|a\/c)[:\s]*\d{6,8}/gi, '[ACCOUNT NO. REDACTED]')
        // Dates of birth patterns (DOB: dd/mm/yyyy etc)
        .replace(/\b(?:DOB|Date of Birth|D\.O\.B)[:\s]+\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/gi, '[DOB REDACTED]');
}
/* ─── Source-lock rules injected into every drafting prompt ─── */
const SOURCE_LOCK = `
CRITICAL SOURCE RULES — YOU MUST FOLLOW THESE:
1. You may ONLY state facts that appear in the documents provided. For every factual claim, cite the source document in [square brackets], e.g. "On 5 October 2025 [receipt_05oct.txt]".
2. Do NOT cite any case law whatsoever. Refer ONLY to Acts of Parliament and statutory instruments by their correct title and section (e.g. Consumer Rights Act 2015, s.9).
3. If you need a fact that is not in the documents, insert a placeholder: [USER TO CONFIRM: description of what is needed].
4. Do NOT assume any facts about the parties' situation. If the documents do not state it, do not state it.
5. Do NOT invent dates, amounts, names, or any other factual details. Use ONLY what appears in the source documents.
`;

function buildPrompt(type: AiCallType, ctx: AssembledContext): string {
    const roleLabel = ctx.userRole === 'claimant' ? 'Claimant' : 'Defendant';

    const header = `You are a legal analysis assistant in England & Wales. You are providing INFORMATION, NOT ADVICE.
The user represents the ${roleLabel} in this matter.
Case: ${ctx.parties.claimant.name} v ${ctx.parties.defendant.name} (${ctx.parties.defendant.type})
Case type: ${ctx.caseType === 'cra_goods' ? 'Consumer Rights Act 2015 — Goods' : 'Consumer Rights Act 2015 — Services'}

Timeline:
${ctx.timeline.map((e) => `- ${e.date}: ${e.description}`).join('\n')}

Documents provided:
${ctx.selectedDocuments
            .map((d) => `--- ${d.filename} (${d.type}, dated ${d.dateTagged || 'unknown'}) ---\n${d.userDescription ? `User note: ${d.userDescription}\n` : ''}${d.extractedText}`)
            .join('\n\n')}

${ctx.userQuestion ? `User's specific question: ${ctx.userQuestion}` : ''}
${ctx.previousAiCalls?.length ? `\nPrevious analyses:\n${ctx.previousAiCalls.map((c) => `- ${c.callType}: ${c.summary}`).join('\n')}` : ''}`;

    const instBlock = ctx.instructions ? `
DRAFTING INSTRUCTIONS FROM THE USER:
- Remedy/outcome sought: ${ctx.instructions.remedySought || '[not specified]'}
- Response deadline: ${ctx.instructions.deadline || '14 days'}
- Key points to emphasise: ${ctx.instructions.keyPoints || '[none specified]'}
- Tone: ${ctx.instructions.tone || 'formal'}
- Prior offers/negotiations: ${ctx.instructions.priorOffers || '[none]'}
- Additional context: ${ctx.instructions.additionalContext || '[none]'}
${ctx.instructions.exactAmount ? `- Exact amount claimed: ${ctx.instructions.exactAmount}` : ''}
${ctx.instructions.interestClaimed !== undefined ? `- Interest claimed: ${ctx.instructions.interestClaimed ? 'Yes (statutory rate)' : 'No'}` : ''}
` : '';

    switch (type) {
        case 'merits_assessment':
            return `${header}

You are providing an OBJECTIVE, NEUTRAL analysis. Do NOT advise either party. Do NOT recommend whether to proceed.
For every factual claim, cite the source document in [square brackets].
Do NOT cite case law. Refer only to Acts of Parliament by title and section.

QUANTUM: Carefully search ALL documents for any monetary amounts — purchase prices, invoice totals, amounts paid, repair costs, refund amounts, or claimed losses. If ANY document (receipt, invoice, email, letter) contains a price or amount, you MUST use it in the quantum analysis. Do not say quantum cannot be assessed if a monetary figure appears anywhere in the provided documents.

Respond in strict JSON with ONLY these fields (no markdown, no text outside the JSON):
{
  "factualSummary": "neutral chronological statement of facts, referencing source documents in [brackets]",
  "documentReferences": [{"document": "filename", "relevance": "what this document establishes"}],
  "legalFramework": [{"provision": "e.g. Consumer Rights Act 2015, s.9", "application": "how it applies to these facts"}],
  "claimantPosition": {
    "potentialCausesOfAction": ["each with supporting evidence and doc reference"],
    "strengthsOfPosition": ["with doc references"],
    "weaknesses": ["with doc references"]
  },
  "defendantPosition": {
    "potentialDefences": ["each with supporting evidence and doc reference"],
    "strengthsOfPosition": ["with doc references"],
    "weaknesses": ["with doc references"]
  },
  "limitationPeriod": {
    "applicablePeriod": "e.g. 6 years from breach under Limitation Act 1980, s.5",
    "expiryEstimate": "calculated date if possible",
    "notes": "any relevant considerations"
  },
  "quantumAnalysis": {"low": 0, "high": 0, "basis": "explanation of range, including the purchase price or amounts found in the documents"},
  "proceduralConsiderations": ["e.g. Pre-action protocol obligations, ADR, likely court track"],
  "keyUncertainties": ["things that cannot be determined from the available evidence"]
}`;

        case 'pre_action_letter':
            return `${header}
${SOURCE_LOCK}
${instBlock}
Draft a Pre-Action Letter (Letter Before Claim) in accordance with the Practice Direction — Pre-Action Conduct and Protocols.
The letter should:
1. Clearly state the claim, citing source documents for every factual assertion
2. Reference relevant legislation by Act title and section only (NO case law)
3. Specify the remedy sought (use the user's instructions above)
4. Give a reasonable deadline for response (use the user's instructions above, default 14 days)
5. Reference the consequences of failure to respond
6. Be written professionally but understandable
7. Insert [USER TO CONFIRM: ...] for any facts not found in the documents

Output the full letter text only.`;

        case 'response_to_letter':
            return `${header}
${SOURCE_LOCK}
${instBlock}
Draft a response to the pre-action letter (which should be among the documents provided).
The response should:
1. Acknowledge receipt of the letter
2. Address each allegation, citing source documents for every factual rebuttal
3. Set out any defences, referencing relevant legislation by Act title and section only (NO case law)
4. State the defendant's position on the remedy sought
5. Propose any counter-offers or ADR if instructed
6. Insert [USER TO CONFIRM: ...] for any facts not found in the documents

Output the full response letter text only.`;

        case 'response_review':
            return `${header}
${SOURCE_LOCK}

Analyse the opposing party's response (if provided in the documents). Structure your analysis as:
1. **Summary of Their Position** — what are they saying?
2. **Factual Claims** — which of their claims are supported by documents, and which are unsupported? Cite [documents].
3. **Legal Arguments** — what legal basis do they rely on? Is it correctly stated?
4. **Key Admissions** — have they admitted anything significant?
5. **Gaps and Weaknesses** — what have they failed to address?
6. **Key Uncertainties** — what cannot be assessed from available information?

Do NOT recommend a course of action. Present the analysis objectively.
If no opposing response is provided, state this clearly.`;

        case 'particulars_draft':
            return `${header}
${SOURCE_LOCK}
${instBlock}
Draft Particulars of Claim suitable for the N1 claim form for the County Court Money Claims Centre.
Structure:
1. Parties (brief identification)
2. Background facts (chronological, numbered paragraphs — cite source document for EACH fact in [brackets])
3. Legal basis (legislation relied upon — Acts and sections ONLY, no case law)
4. Breach (how the defendant breached, with document references)
5. Loss and damage (amounts MUST come from user instructions or documents, never invented)
6. Remedy sought (use exact amount from user instructions: ${ctx.instructions?.exactAmount || '[USER TO CONFIRM: exact amount]'})
7. Interest (${ctx.instructions?.interestClaimed ? 'statutory interest claimed under s.69 County Courts Act 1984' : 'no interest claimed'})
8. Statement of truth

Insert [USER TO CONFIRM: ...] for any missing details. Output only the Particulars text.`;

        case 'defence_draft':
            return `${header}
${SOURCE_LOCK}
${instBlock}
Draft a Defence (and Counterclaim if instructed) suitable for filing at the County Court.
Structure:
1. Parties
2. Response to each paragraph of the Particulars of Claim (if provided in documents):
   - Admit, deny, or state unable to admit/deny each allegation
   - For denials, cite the source document supporting the denial in [brackets]
3. Positive case / Defence (cite relevant legislation by Act and section ONLY, no case law)
4. Counterclaim (only if instructed by the user)
5. Statement of truth

Insert [USER TO CONFIRM: ...] for any facts not in the documents. Output only the Defence text.`;
    }
}

export default function AiReviewPanel() {
    const [savedMsg, setSavedMsg] = useState('');
    const hasApiKey = !!localStorage.getItem('casekit_api_key');
    const cases = useCaseStore((s) => s.cases);
    const currentCase = useCaseStore((s) => s.currentCase);
    const selectCase = useCaseStore((s) => s.selectCase);
    const clearCurrentCase = useCaseStore((s) => s.clearCurrentCase);
    const documents = useCaseStore((s) => s.documents);
    const chronology = useCaseStore((s) => s.chronology);

    // Cases are loaded centrally in AppShell — no redundant load here

    const userRole: UserRole = currentCase?.user_role || 'claimant';
    const availableTypes = ALL_ANALYSIS_TYPES.filter((t) => t.roles.includes(userRole));

    const storedProvider = localStorage.getItem('casekit_api_provider') || 'anthropic';
    const providerModels = MODEL_OPTIONS.filter((m) => m.provider === storedProvider);
    const defaultModel = DEFAULT_MODELS[storedProvider] || providerModels[0]?.id || MODEL_OPTIONS[0].id;

    const [selectedType, setSelectedType] = useState<AiCallType | null>(null);
    const [userQuestion, setUserQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [selectedModel, setSelectedModel] = useState(defaultModel);
    const [result, setResult] = useState<AiCallRecord | null>(null);
    const [error, setError] = useState<string | null>(null);

    /* Ensure documents are loaded when panel mounts */
    const loadDocuments = useCaseStore((s) => s.loadDocuments);
    useEffect(() => {
        if (currentCase && documents.length === 0) {
            loadDocuments();
        }
    }, [currentCase, documents.length, loadDocuments]);

    /* Editable document texts — initialised with auto-redaction applied */
    const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

    /* Drafting instruction fields */
    const [instRemedySought, setInstRemedySought] = useState('');
    const [instDeadline, setInstDeadline] = useState('14 days');
    const [instKeyPoints, setInstKeyPoints] = useState('');
    const [instTone, setInstTone] = useState<'formal' | 'firm' | 'conciliatory'>('formal');
    const [instPriorOffers, setInstPriorOffers] = useState('');
    const [instAdditionalContext, setInstAdditionalContext] = useState('');
    const [instExactAmount, setInstExactAmount] = useState('');
    const [instInterest, setInstInterest] = useState(false);

    const assembleContext = (): AssembledContext => {
        const instructions: DraftingInstructions | undefined =
            selectedType && NEEDS_INSTRUCTIONS.includes(selectedType)
                ? {
                    remedySought: instRemedySought,
                    deadline: instDeadline,
                    keyPoints: instKeyPoints,
                    tone: instTone,
                    priorOffers: instPriorOffers,
                    additionalContext: instAdditionalContext,
                    exactAmount: instExactAmount || undefined,
                    interestClaimed: instInterest,
                }
                : undefined;

        return {
            caseType: (currentCase as any)?.case_type || 'cra_goods',
            userRole,
            parties: {
                claimant: { name: currentCase?.claimant_name || 'Claimant' },
                defendant: { name: currentCase?.defendant_name || 'Defendant', type: 'company' },
            },
            timeline: chronology,
            selectedDocuments: documents
                .filter((d) => selectedDocs.has(d.filename))
                .map((d) => ({
                    filename: d.filename,
                    type: d.document_type,
                    extractedText: editedTexts[d.filename] ?? d.extracted_text ?? '',
                    dateTagged: d.date || '',
                    userDescription: d.description || '',
                })),
            userQuestion,
            instructions,
        };
    };

    const handleAnalyse = async () => {
        if (!selectedType) return;
        setLoading(true);
        setError(null);

        const ctx = assembleContext();
        const prompt = buildPrompt(selectedType, ctx);
        const apiKey = localStorage.getItem('casekit_api_key');
        const provider = localStorage.getItem('casekit_api_provider') || 'anthropic';

        try {
            let responseText = '';
            let model = '';
            let inputTokens = 0;
            let outputTokens = 0;

            const chosenModel = MODEL_OPTIONS.find((m) => m.id === selectedModel);
            const chosenProvider = chosenModel?.provider || provider;

            if (chosenProvider === 'anthropic') {
                const { default: Anthropic } = await import('@anthropic-ai/sdk');
                const client = new Anthropic({ apiKey: apiKey!, dangerouslyAllowBrowser: true });
                model = selectedModel;
                const response = await client.messages.create({
                    model,
                    max_tokens: 16000,
                    messages: [{ role: 'user', content: prompt }],
                });
                // Opus 4.6+ may return thinking blocks before text blocks.
                // Extract text from ALL text-type content blocks, skipping thinking blocks.
                responseText = response.content
                    .filter((block: { type: string }) => block.type === 'text')
                    .map((block: { type: string; text?: string }) => block.text || '')
                    .join('\n\n');
                inputTokens = response.usage.input_tokens;
                outputTokens = response.usage.output_tokens;
            } else if (chosenProvider === 'openai') {
                model = selectedModel;
                const body: Record<string, unknown> = { model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] };
                // Force JSON output for merits assessment
                if (selectedType === 'merits_assessment') {
                    body.response_format = { type: 'json_object' };
                }
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify(body),
                });
                if (!res.ok) { const err = await res.text(); throw new Error(`OpenAI error: ${err}`); }
                const data = await res.json();
                responseText = data.choices?.[0]?.message?.content || '';
                inputTokens = data.usage?.prompt_tokens || 0;
                outputTokens = data.usage?.completion_tokens || 0;
            } else if (chosenProvider === 'gemini') {
                model = selectedModel;
                const genConfig: Record<string, unknown> = { maxOutputTokens: 4096 };
                // Force JSON output for merits assessment
                if (selectedType === 'merits_assessment') {
                    genConfig.responseMimeType = 'application/json';
                }
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: genConfig }),
                    },
                );
                if (!res.ok) { const err = await res.text(); throw new Error(`Gemini error: ${err}`); }
                const data = await res.json();
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                inputTokens = data.usageMetadata?.promptTokenCount || 0;
                outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
            } else {
                setError(`Unknown provider: ${chosenProvider}. Please select a model from the dropdown.`);
                setLoading(false);
                return;
            }

            let parsedResponse: ParsedMeritsResponse | undefined;
            if (selectedType === 'merits_assessment') {
                try {
                    // Strip ALL markdown code fences regardless of position
                    let cleanedText = responseText
                        .trim()
                        .replace(/```json\s*/gi, '')
                        .replace(/```\s*/g, '')
                        .trim();
                    // Strategy 1: direct parse of cleaned text
                    try {
                        parsedResponse = JSON.parse(cleanedText);
                    } catch {
                        // Strategy 2: extract outermost JSON object
                        const firstBrace = cleanedText.indexOf('{');
                        const lastBrace = cleanedText.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace > firstBrace) {
                            try {
                                parsedResponse = JSON.parse(cleanedText.slice(firstBrace, lastBrace + 1));
                            } catch {
                                // Strategy 3: try original responseText with brace extraction
                                const fb2 = responseText.indexOf('{');
                                const lb2 = responseText.lastIndexOf('}');
                                if (fb2 !== -1 && lb2 > fb2) {
                                    parsedResponse = JSON.parse(responseText.slice(fb2, lb2 + 1));
                                }
                            }
                        }
                    }
                } catch {
                    // fallback to raw text display
                }
            }

            const record: AiCallRecord = {
                id: `ai-${Date.now()}`,
                callType: selectedType,
                timestamp: new Date().toISOString(),
                inputTokens,
                outputTokens,
                model,
                response: responseText,
                parsedResponse,
            };
            setResult(record);

            // Persist to ai-history.json
            if (currentCase) {
                saveAiCall(currentCase.name, {
                    id: record.id,
                    callType: record.callType,
                    timestamp: record.timestamp,
                    inputTokens: record.inputTokens,
                    outputTokens: record.outputTokens,
                    model: record.model,
                    response: record.response,
                    summary: parsedResponse?.factualSummary?.slice(0, 200) || record.response.slice(0, 200),
                }).then(() => {
                    setSavedMsg(`Saved to ${currentCase.name}/ai-history.json`);
                    setTimeout(() => setSavedMsg(''), 5000);
                }).catch(() => {
                    setSavedMsg('⚠ Could not save — check case folder permissions.');
                    setTimeout(() => setSavedMsg(''), 5000);
                });
            }
        } catch (e: any) {
            if (e.status === 401) {
                setError('Authentication failed. Check your API key is correct.');
            } else if (e.status === 429) {
                setError('Rate limit reached. Please wait a moment and try again.');
            } else if (e.status === 400) {
                setError('Request error. Your documents may be too large. Try selecting fewer documents.');
            } else {
                setError(e.message || String(e));
            }
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const selectedDocsList = documents.filter((d) => selectedDocs.has(d.filename));
    const totalChars = selectedDocsList.reduce((sum, d) => sum + ((editedTexts[d.filename] ?? d.extracted_text)?.length || 0), 0);
    const estimatedInputTokens = Math.ceil(totalChars / 4) + 2000;
    const estimatedOutputTokens = 2000;

    const modelConfig = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];
    const estimatedCost = () => {
        const inputCost = (estimatedInputTokens / 1_000_000) * modelConfig.inputPer1M;
        const outputCost = (estimatedOutputTokens / 1_000_000) * modelConfig.outputPer1M;
        return (inputCost + outputCost).toFixed(3);
    };

    /* ─── Display-time JSON re-parse (safety net for saved results / parse failures) ─── */
    const meritsData: ParsedMeritsResponse | undefined = (() => {
        if (!result) return undefined;
        if (result.parsedResponse) return result.parsedResponse;
        if (result.callType !== 'merits_assessment') return undefined;
        // Try to re-parse from raw response text
        try {
            const raw = result.response || '';
            const cleaned = raw.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            try { return JSON.parse(cleaned); } catch { }
            const fb = cleaned.indexOf('{');
            const lb = cleaned.lastIndexOf('}');
            if (fb !== -1 && lb > fb) {
                try { return JSON.parse(cleaned.slice(fb, lb + 1)); } catch { }
            }
            const fb2 = raw.indexOf('{');
            const lb2 = raw.lastIndexOf('}');
            if (fb2 !== -1 && lb2 > fb2) {
                return JSON.parse(raw.slice(fb2, lb2 + 1));
            }
        } catch { }
        return undefined;
    })();

    /* ─── Helper: highlight [document.txt] refs and [USER TO CONFIRM] in rendered text ─── */
    const renderAnnotatedText = (text: string) => {
        const parts = text.split(/(\[[^\]]+\])/g);
        return parts.map((part, i) => {
            if (part.startsWith('[USER TO CONFIRM')) {
                return <span key={i} style={{ background: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>{part}</span>;
            }
            if (part.startsWith('[') && part.endsWith(']') && (part.includes('.txt') || part.includes('.pdf') || part.includes('.doc') || part.includes('.eml'))) {
                return <span key={i} style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 4px', borderRadius: 3, fontSize: '0.8em' }}>{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="page">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                AI Drafting
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                AI-assisted analysis and document drafting using your own API key.
                <Link to="/api-setup" style={{ marginLeft: '0.5rem', fontWeight: 500 }}>Manage key</Link>
                {currentCase && (
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '2px 6px', borderRadius: 3, background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>
                        {userRole === 'claimant' ? 'Claimant' : 'Defendant'}
                    </span>
                )}
            </p>

            {/* Methodology explanation */}
            <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#475569',
                lineHeight: 1.7,
            }}>
                <p style={{ fontWeight: 600, marginBottom: '0.375rem', color: '#1e293b' }}>How this works</p>
                <p style={{ margin: '0 0 0.5rem' }}>
                    This tool helps you <strong>draft documents and analyse your case</strong> based on the files you have uploaded.
                    It does not give legal advice — it assists with drafting based on <strong>your instructions and your documents</strong>.
                </p>

                <p style={{ fontWeight: 600, marginBottom: '0.25rem', marginTop: '0.75rem', color: '#1e293b', fontSize: '0.75rem' }}>What you can draft</p>
                <ul style={{ paddingLeft: '1.25rem', margin: '0 0 0.5rem' }}>
                    <li><strong>Case Analysis</strong> — an objective, neutral assessment of both parties' positions, limitation periods, quantum, and evidence strength.</li>
                    <li><strong>Pre-Action Letter</strong> (claimants) — a Letter Before Claim setting out your case, based on your documents and the outcome you specify (full refund, repair, replacement, or compromise).</li>
                    <li><strong>Response to Letter</strong> (defendants) — a reply to a pre-action letter, setting out your position and any counter-offer or rebuttal you instruct.</li>
                    <li><strong>Response Review</strong> — analysis of the other side's correspondence, identifying strengths, weaknesses, and what to address.</li>
                    <li><strong>Particulars of Claim</strong> (claimants) — a draft for the N1 court form, structured to the format the court expects.</li>
                    <li><strong>Defence</strong> (defendants) — a draft Defence (and Counterclaim if you instruct one).</li>
                </ul>

                <p style={{ fontWeight: 600, marginBottom: '0.25rem', marginTop: '0.75rem', color: '#1e293b', fontSize: '0.75rem' }}>You define the outcome</p>
                <p style={{ margin: '0 0 0.5rem' }}>
                    For every draft, you tell the AI what result you want — full value claim, compromise, counterclaim, rejection, or anything else.
                    The AI drafts to <strong>your instructions</strong>. It will not decide strategy for you.
                </p>

                <p style={{ fontWeight: 600, marginBottom: '0.25rem', marginTop: '0.75rem', color: '#1e293b', fontSize: '0.75rem' }}>Source rules</p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                    <li><strong>Source-locked</strong> — every factual claim is cited to a specific document. Nothing is invented.</li>
                    <li><strong>No case law</strong> — references are limited to Acts of Parliament and statutory instruments (e.g. Consumer Rights Act 2015, s.9). The AI will not cite or fabricate case names.</li>
                    <li><strong>Saved to your case</strong> — results are saved automatically and will appear on your Case Overview page.</li>
                </ul>
            </div>

            {/* Case selector bar */}
            <div style={{
                background: currentCase ? 'rgba(14, 165, 152, 0.08)' : '#f8fafc',
                border: `1px solid ${currentCase ? 'rgba(14, 165, 152, 0.25)' : 'var(--border)'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontWeight: 500, color: currentCase ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {currentCase ? 'Current case:' : 'Select a case to begin:'}
                </span>
                <select
                    value={currentCase?.name || ''}
                    onChange={(e) => { if (e.target.value) selectCase(e.target.value); }}
                    style={{
                        flex: 1,
                        minWidth: 160,
                        padding: '5px 8px',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer',
                    }}
                >
                    <option value="" disabled>
                        {cases.length === 0 ? 'No cases yet' : 'Choose a case\u2026'}
                    </option>
                    {cases.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                </select>
                <Link
                    to="/cases?new=1"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => clearCurrentCase()}
                >
                    + New Case
                </Link>
            </div>

            {!hasApiKey ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>API Key Required</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        You need an API key to use AI drafting features. Set one up in API Key Setup.
                    </p>
                    <Link to="/api-setup" className="btn btn-primary">
                        Set up API Key
                    </Link>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                        CaseKit has no internet connection by default. AI features are the only thing that sends data,
                        and only when you explicitly press "Analyse".
                    </p>
                </div>
            ) : !currentCase ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>No case selected</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Use the dropdown above to select an existing case, or create a new one to get started.
                    </p>
                </div>
            ) : loading ? (
                /* ─── Loading state ─── */
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>
                        Generating: {ALL_ANALYSIS_TYPES.find((t) => t.type === selectedType)?.label || selectedType}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Sending your case details and documents to the AI. This usually takes 15–45 seconds depending on the number of documents.
                    </p>
                    {/* Animated progress bar */}
                    <div style={{
                        width: '100%',
                        maxWidth: 400,
                        height: 6,
                        background: '#e2e8f0',
                        borderRadius: 3,
                        overflow: 'hidden',
                        margin: '0 auto 1rem',
                    }}>
                        <div style={{
                            width: '40%',
                            height: '100%',
                            background: 'var(--accent, #3b82f6)',
                            borderRadius: 3,
                            animation: 'loadingSlide 1.8s ease-in-out infinite',
                        }} />
                    </div>
                    <style>{`
                        @keyframes loadingSlide {
                            0% { transform: translateX(-100%); width: 40%; }
                            50% { transform: translateX(100%); width: 60%; }
                            100% { transform: translateX(-100%); width: 40%; }
                        }
                    `}</style>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Your data is sent directly to the API provider. Nothing is stored externally.
                    </p>
                </div>
            ) : result ? (
                /* ─── Result view ─── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {ALL_ANALYSIS_TYPES.find((t) => t.type === result.callType)?.label || result.callType}
                        </h2>
                        <button className="btn btn-secondary" onClick={() => { setResult(null); setSelectedType(null); }}>
                            New Analysis
                        </button>
                    </div>

                    {/* Objective Case Analysis (merits) structured view */}
                    {meritsData ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Factual Summary */}
                            <div className="card">
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Factual Summary</h3>
                                <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{renderAnnotatedText(meritsData.factualSummary)}</p>
                            </div>

                            {/* Document References */}
                            {meritsData.documentReferences.length > 0 && (
                                <div className="card">
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Document Evidence</h3>
                                    {meritsData.documentReferences.map((ref, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 3, fontWeight: 500, whiteSpace: 'nowrap', fontSize: '0.8em' }}>{ref.document}</span>
                                            <span>{ref.relevance}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Legal Framework */}
                            {meritsData.legalFramework.length > 0 && (
                                <div className="card">
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Legal Framework</h3>
                                    {meritsData.legalFramework.map((lf, i) => (
                                        <div key={i} style={{ marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{lf.provision}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lf.application}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Two-column: Claimant vs Defendant positions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="card" style={{ borderLeft: '3px solid #3b82f6' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>Claimant Position</h3>
                                    {meritsData.claimantPosition.potentialCausesOfAction.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Causes of Action</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.claimantPosition.potentialCausesOfAction.map((c, i) => <li key={i}>{renderAnnotatedText(c)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {meritsData.claimantPosition.strengthsOfPosition.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>Strengths</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.claimantPosition.strengthsOfPosition.map((s, i) => <li key={i}>{renderAnnotatedText(s)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {meritsData.claimantPosition.weaknesses.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>Weaknesses</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.claimantPosition.weaknesses.map((w, i) => <li key={i}>{renderAnnotatedText(w)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>Defendant Position</h3>
                                    {meritsData.defendantPosition.potentialDefences.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Potential Defences</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.defendantPosition.potentialDefences.map((d, i) => <li key={i}>{renderAnnotatedText(d)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {meritsData.defendantPosition.strengthsOfPosition.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>Strengths</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.defendantPosition.strengthsOfPosition.map((s, i) => <li key={i}>{renderAnnotatedText(s)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {meritsData.defendantPosition.weaknesses.length > 0 && (
                                        <div>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>\u26a0\ufe0f Weaknesses</p>
                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                                {meritsData.defendantPosition.weaknesses.map((w, i) => <li key={i}>{renderAnnotatedText(w)}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Limitation Period */}
                            <div className="card" style={{ borderColor: '#7c3aed' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#5b21b6' }}>Limitation Period</h3>
                                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{meritsData.limitationPeriod.applicablePeriod}</p>
                                {meritsData.limitationPeriod.expiryEstimate && (
                                    <p style={{ fontSize: '0.85rem' }}>Estimated expiry: <strong>{meritsData.limitationPeriod.expiryEstimate}</strong></p>
                                )}
                                {meritsData.limitationPeriod.notes && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{meritsData.limitationPeriod.notes}</p>
                                )}
                            </div>

                            {/* Quantum */}
                            <div className="card">
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Quantum Analysis</h3>
                                <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                                    £{meritsData.quantumAnalysis.low.toLocaleString()} – £{meritsData.quantumAnalysis.high.toLocaleString()}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{meritsData.quantumAnalysis.basis}</p>
                            </div>

                            {/* Procedural Considerations */}
                            {meritsData.proceduralConsiderations.length > 0 && (
                                <div className="card">
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Procedural Considerations</h3>
                                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                                        {meritsData.proceduralConsiderations.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Uncertainties */}
                            {meritsData.keyUncertainties.length > 0 && (
                                <div className="card" style={{ borderColor: '#f59e0b' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>Key Uncertainties</h3>
                                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                                        {meritsData.keyUncertainties.map((u, i) => <li key={i}>{u}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Raw text response for letters/particulars/defence */
                        <div className="card">
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                margin: 0,
                            }}>
                                {renderAnnotatedText(result.response)}
                            </pre>
                        </div>
                    )}

                    {/* Usage & cost */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                        <span>Model: {result.model}</span>
                        <span>Tokens: {result.inputTokens.toLocaleString()} in / {result.outputTokens.toLocaleString()} out</span>
                        <span>≈ £{((result.inputTokens * 0.003 + result.outputTokens * 0.015) / 1000).toFixed(3)}</span>
                    </div>

                    {savedMsg && (
                        <div style={{
                            padding: '0.5rem 0.75rem',
                            background: savedMsg.startsWith('⚠') ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${savedMsg.startsWith('⚠') ? '#fde68a' : '#bbf7d0'}`,
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            color: savedMsg.startsWith('⚠') ? '#92400e' : '#166534',
                        }}>
                            {savedMsg}
                        </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        ⚠ This is information only, not legal advice. All AI output should be reviewed carefully. Verify all statutory references. Seek professional advice for important decisions.
                    </div>
                </div>
            ) : (
                /* ─── Analysis selection & confirmation ─── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card">
                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Select Analysis Type</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Tools available for your role as <strong>{userRole}</strong>.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {availableTypes.map((item) => (
                                <button
                                    key={item.type}
                                    className="card"
                                    onClick={() => {
                                        setSelectedType(item.type);
                                        setShowConfirm(true);
                                        setError(null);
                                        setSelectedDocs(new Set(documents.map(d => d.filename)));
                                        // Initialise edited texts with auto-redaction
                                        const texts: Record<string, string> = {};
                                        documents.forEach(d => { texts[d.filename] = autoRedact(d.extracted_text || ''); });
                                        setEditedTexts(texts);
                                        setExpandedDoc(null);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        padding: '1rem',
                                        transition: 'border-color 0.15s, background 0.15s',
                                        border: selectedType === item.type ? '2px solid var(--accent)' : '1px solid var(--border)',
                                        background: selectedType === item.type ? '#f0fdfa' : 'white',
                                    }}
                                    aria-label={item.label}
                                >
                                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {item.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Confirmation step + instruction form */}
                    {showConfirm && selectedType && (
                        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Confirm: {ALL_ANALYSIS_TYPES.find((t) => t.type === selectedType)?.label}
                            </h3>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>Documents to include (review and edit text before sending):</p>
                                {documents.length === 0 ? (
                                    <p style={{ color: '#991b1b' }}>No documents uploaded. Upload documents via the Documents tab first.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                        {documents.map((d) => {
                                            const isSelected = selectedDocs.has(d.filename);
                                            const text = editedTexts[d.filename] ?? d.extracted_text ?? '';
                                            const isExpanded = expandedDoc === d.filename;
                                            const redactedCount = (text.match(/\[.+? REDACTED\]/g) || []).length;
                                            return (
                                                <div key={d.filename} style={{
                                                    border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`,
                                                    borderRadius: '0.375rem',
                                                    background: isSelected ? '#f0fdf4' : '#f8fafc',
                                                    transition: 'all 0.15s',
                                                }}>
                                                    {/* Header row: checkbox, filename, type, chars, expand */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.375rem 0.5rem', cursor: 'pointer',
                                                        fontSize: '0.78rem',
                                                    }}>
                                                        <input type="checkbox" checked={isSelected}
                                                            onChange={() => {
                                                                setSelectedDocs(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(d.filename)) next.delete(d.filename);
                                                                    else next.add(d.filename);
                                                                    return next;
                                                                });
                                                            }}
                                                        />
                                                        <span style={{ flex: 1, fontWeight: 500 }}>{d.filename}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{d.document_type}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: 65, textAlign: 'right' }}>
                                                            {text.length.toLocaleString()} chars
                                                        </span>
                                                        {redactedCount > 0 && (
                                                            <span style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>
                                                                {redactedCount} redacted
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setExpandedDoc(isExpanded ? null : d.filename); }}
                                                            style={{
                                                                background: 'none', border: 'none', cursor: 'pointer',
                                                                fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500,
                                                                padding: '2px 6px',
                                                            }}
                                                        >
                                                            {isExpanded ? 'Hide text' : 'View / edit text'}
                                                        </button>
                                                    </div>

                                                    {/* Expanded: editable text area */}
                                                    {isExpanded && (
                                                        <div style={{ padding: '0 0.5rem 0.5rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditedTexts(prev => ({ ...prev, [d.filename]: autoRedact(d.extracted_text || '') }))}
                                                                    style={{ fontSize: '0.7rem', padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 3, background: '#fff7ed', cursor: 'pointer', color: '#9a3412' }}
                                                                >
                                                                    Re-run auto-redact
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditedTexts(prev => ({ ...prev, [d.filename]: d.extracted_text || '' }))}
                                                                    style={{ fontSize: '0.7rem', padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 3, background: 'white', cursor: 'pointer', color: '#475569' }}
                                                                >
                                                                    Undo all redactions
                                                                </button>
                                                            </div>
                                                            <textarea
                                                                value={text}
                                                                onChange={(e) => setEditedTexts(prev => ({ ...prev, [d.filename]: e.target.value }))}
                                                                style={{
                                                                    width: '100%',
                                                                    minHeight: '200px',
                                                                    maxHeight: '400px',
                                                                    padding: '0.5rem',
                                                                    fontSize: '0.78rem',
                                                                    fontFamily: 'monospace',
                                                                    lineHeight: 1.5,
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '0.25rem',
                                                                    resize: 'vertical',
                                                                    boxSizing: 'border-box',
                                                                    background: '#fafafa',
                                                                }}
                                                            />
                                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                                Edit freely — remove or redact any text you do not want sent to the AI provider.
                                                                This is the exact text that will be included in the prompt.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                        Model <span style={{ fontWeight: 400, color: '#94a3b8' }}>
                                            ({storedProvider} key — <Link to="/api-setup" style={{ color: '#64748b' }}>change provider</Link>)
                                        </span>
                                    </label>
                                    <select className="input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={{ width: '100%' }}>
                                        {providerModels.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.label}{m.note ? ` — ${m.note}` : ''} (${m.inputPer1M}/Mtok in, ${m.outputPer1M}/Mtok out)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', padding: '0.375rem 0.5rem', background: '#f1f5f9', borderRadius: '0.25rem' }}>
                                    <span><strong>{selectedDocs.size}</strong> of {documents.length} documents selected</span>
                                    <span>{totalChars.toLocaleString()} characters</span>
                                    <span>~{estimatedInputTokens.toLocaleString()} tokens</span>
                                    <span>Estimated cost: ~${estimatedCost()} ({modelConfig.label})</span>
                                </div>
                                <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.4 }}>
                                    Cost is an estimate based on published API pricing as at February 2026. Prices may change.{' '}
                                    <Link to="/read-this-first" style={{ color: '#94a3b8' }}>Verify current rates</Link>
                                </p>

                                {selectedDocs.size === 0 && (
                                    <p style={{ color: '#991b1b', fontWeight: 500, marginTop: '0.375rem' }}>Select at least one document to proceed.</p>
                                )}
                            </div>

                            {/* Instruction form — only for drafting types */}
                            {NEEDS_INSTRUCTIONS.includes(selectedType) && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Drafting Instructions</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                        Guide the AI with your specific instructions. The more detail you provide, the better the output.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                Remedy / outcome sought *
                                            </label>
                                            <input className="input" value={instRemedySought} onChange={(e) => setInstRemedySought(e.target.value)}
                                                placeholder="e.g. Full refund of £849.99 / Repair / Replacement" style={{ width: '100%' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                    Response deadline
                                                </label>
                                                <input className="input" value={instDeadline} onChange={(e) => setInstDeadline(e.target.value)}
                                                    placeholder="14 days" style={{ width: '100%' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>Tone</label>
                                                <select className="input" value={instTone} onChange={(e) => setInstTone(e.target.value as any)} style={{ width: '100%' }}>
                                                    <option value="formal">Formal</option>
                                                    <option value="firm">Firm</option>
                                                    <option value="conciliatory">Conciliatory</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                Key points to emphasise
                                            </label>
                                            <textarea className="input" value={instKeyPoints} onChange={(e) => setInstKeyPoints(e.target.value)}
                                                placeholder="e.g. The laptop was only 2 weeks old when it failed" rows={2} style={{ width: '100%', resize: 'vertical' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                Prior offers / negotiations
                                            </label>
                                            <input className="input" value={instPriorOffers} onChange={(e) => setInstPriorOffers(e.target.value)}
                                                placeholder="e.g. They offered a repair but I want a refund" style={{ width: '100%' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                Additional context (not in documents)
                                            </label>
                                            <textarea className="input" value={instAdditionalContext} onChange={(e) => setInstAdditionalContext(e.target.value)}
                                                placeholder="e.g. I also spoke to their manager by phone on 15 Nov" rows={2} style={{ width: '100%', resize: 'vertical' }} />
                                        </div>

                                        {/* Particulars / Defence specific fields */}
                                        {(selectedType === 'particulars_draft' || selectedType === 'defence_draft') && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                                                        Exact amount claimed (£) *
                                                    </label>
                                                    <input className="input" value={instExactAmount} onChange={(e) => setInstExactAmount(e.target.value)}
                                                        placeholder="e.g. 849.99" style={{ width: '100%' }} />
                                                </div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 500, paddingBottom: 6 }}>
                                                    <input type="checkbox" checked={instInterest} onChange={(e) => setInstInterest(e.target.checked)} />
                                                    Claim interest
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
                                Optional — ask a specific question:
                            </label>
                            <input
                                className="input"
                                value={userQuestion}
                                onChange={(e) => setUserQuestion(e.target.value)}
                                placeholder="e.g. Is the limitation period an issue here?"
                                style={{ marginBottom: '0.75rem' }}
                            />

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={handleAnalyse} disabled={loading || selectedDocs.size === 0}>
                                    {loading ? 'Analysing...' : 'Analyse Now'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => { setShowConfirm(false); setSelectedType(null); }}>
                                    Cancel
                                </button>
                            </div>

                            {error && (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#991b1b' }}>
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.5rem',
                        padding: '0.875rem 1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        fontSize: '0.8rem',
                        color: '#166534',
                    }}>
                        <div>
                            <strong>Privacy:</strong> Before any AI call, you will see exactly what information will be sent.
                            No data is transmitted without your explicit confirmation.
                            CaseKit has <strong>no internet connection</strong> outside of these explicit AI calls.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
