import { useState } from 'react';
import { useCaseStore } from '../../hooks/useCase';
import type { UserRole } from '../../types/case';
import DeadlineCalculator from './DeadlineCalculator';

/* ─── Types ─── */
interface StepNode {
    id: string;
    title: string;
    timeline: string;
    cprBasis: string;
    description: string;
    claimantAction: string;
    defendantAction: string;
    tips: string;
    claimantTip?: string;
    defendantTip?: string;
    form?: string;
    formUrl?: string;
    defendantForm?: string;
    defendantFormUrl?: string;
    phase: Phase;
    decision?: { question: string; resolved: boolean; nextId?: string };
}

type Phase = 'pre-action' | 'issuing' | 'management' | 'hearing';

const PHASE_CONFIG: Record<Phase, { colour: string; bg: string; label: string; icon: string }> = {
    'pre-action': { colour: '#3b82f6', bg: '#eff6ff', label: 'Pre-Action', icon: '📋' },
    'issuing': { colour: '#8b5cf6', bg: '#f5f3ff', label: 'Issuing & Responding', icon: '📄' },
    'management': { colour: '#f59e0b', bg: '#fffbeb', label: 'Case Management', icon: '⚖️' },
    'hearing': { colour: '#10b981', bg: '#ecfdf5', label: 'Hearing & Resolution', icon: '🏛️' },
};

/* ─── Step Data — CPR-verified timescales ─── */
const STEPS: StepNode[] = [
    /* ── Phase 1: Pre-Action ── */
    {
        id: '1a', phase: 'pre-action',
        title: 'Assess the position',
        timeline: 'As early as possible',
        cprBasis: 'Limitation Act 1980, ss.2, 5',
        description: 'Both parties should identify the factual basis of the dispute, the outcome they seek, and any applicable limitation periods.',
        claimantAction: 'Identify the legal basis of the claim — what duty was owed and how it was breached. Check limitation: 6 years for contract/tort, 3 years for personal injury (from knowledge of injury).',
        defendantAction: 'Assess the complaint received and identify the factual basis for any defence. Consider whether there is a basis for a counterclaim.',
        tips: 'Write a clear factual summary before taking any other step. This helps identify gaps in evidence early.',
        claimantTip: 'Use CaseKit\'s AI analysis to check your case strength objectively before investing time and money.',
        defendantTip: 'Even if liability seems clear, assess contributory negligence, limitation, and quantum — all can reduce exposure.',
    },
    {
        id: '1b', phase: 'pre-action',
        title: 'Gather evidence',
        timeline: '1–2 weeks',
        cprBasis: 'CPR PD Pre-Action Conduct, paras 6–7',
        description: 'Collect all relevant documents — contracts, correspondence, invoices, photographs, receipts. Organise chronologically.',
        claimantAction: 'Assemble documents supporting the claim. Identify key documents the defendant is likely to hold.',
        defendantAction: 'Preserve all relevant documents. Do not destroy anything that may be relevant to the dispute.',
        tips: 'Upload documents to CaseKit early and build a chronology — it reveals gaps and strengthens preparation.',
    },
    {
        id: '1c', phase: 'pre-action',
        title: 'Attempt direct resolution',
        timeline: '14 days (straightforward) to 3 months (complex)',
        cprBasis: 'CPR PD Pre-Action Conduct, paras 6–16',
        description: 'The claimant writes to the defendant setting out the complaint. The defendant should respond substantively within a reasonable period.',
        claimantAction: 'Send a clear, factual letter setting out what happened, why the defendant is responsible, and what remedy is sought. Give a deadline of at least 14 days.',
        defendantAction: 'Respond substantively: accept, deny, or propose resolution. Ignoring pre-action correspondence may lead to costs penalties.',
        tips: 'Keep the tone factual and professional. Both parties should disclose key documents at this stage.',
        decision: { question: 'Has the dispute been resolved?', resolved: true },
    },
    {
        id: '1d', phase: 'pre-action',
        title: 'Letter Before Claim / Response',
        timeline: '14 days for response (may be up to 3 months if complex)',
        cprBasis: 'CPR PD Pre-Action Conduct, paras 6–16',
        description: 'If informal resolution fails, the claimant sends a formal Letter Before Claim. The defendant responds with a Letter of Response.',
        claimantAction: 'Send a formal letter before claim giving notice that court proceedings will follow if the matter is not resolved. Include a summary of facts, the legal basis, the remedy sought, and a deadline.',
        defendantAction: 'Send a substantive Letter of Response. State clearly what is accepted, what is denied, and why. Propose ADR if appropriate.',
        tips: 'The court expects compliance with pre-action protocols. Failure can result in costs sanctions even if the claim succeeds.',
        form: 'Template in Templates & Forms', formUrl: '/templates',
        decision: { question: 'Has the dispute been resolved?', resolved: true },
    },
    {
        id: '1e', phase: 'pre-action',
        title: 'Consider ADR',
        timeline: '4–8 weeks (mediation typically)',
        cprBasis: 'CPR r.1.4(2)(e); Churchill v Merthyr Tydfil CBC [2023] EWCA Civ 1416',
        description: 'Both parties should consider whether mediation, an ombudsman, or another form of ADR could resolve the dispute before court proceedings.',
        claimantAction: 'Propose mediation or another appropriate ADR process. The Small Claims Mediation Service is free for qualifying claims.',
        defendantAction: 'Consider and respond to any ADR proposal. An unreasonable refusal to mediate may result in costs sanctions.',
        tips: 'Since Churchill v Merthyr Tydfil (2023), courts can compel parties to attempt ADR. Unreasonable refusal carries real costs risk.',
        decision: { question: 'Has the dispute been resolved?', resolved: true },
    },

    /* ── Phase 2: Issuing & Responding ── */
    {
        id: '2a', phase: 'issuing',
        title: 'Issue the claim',
        timeline: 'Claim form valid for 4 months from issue for service',
        cprBasis: 'CPR Part 7; r.7.5 (validity); PD 7A',
        description: 'The claimant files a claim with the court using Form N1 (or Money Claims Online for straightforward money claims) and pays the court fee.',
        claimantAction: 'Complete Form N1 or use MCOL. Pay the court fee (depends on claim value). The claim form must be served within 4 months of issue.',
        defendantAction: 'No action required at this stage — the claim has not yet been received.',
        tips: 'MCOL is usually cheaper and faster for straightforward money claims under £100,000.',
        form: 'N1', formUrl: 'https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7',
    },
    {
        id: '2b', phase: 'issuing',
        title: 'Service of the claim',
        timeline: 'Deemed served on 2nd business day after posting',
        cprBasis: 'CPR Part 6; r.6.14 (deemed service); r.7.5 (4-month validity)',
        description: 'The court (or the claimant) serves the claim form and particulars of claim on the defendant. Service is deemed to take place on the second business day after the relevant step.',
        claimantAction: 'If serving personally, file a Certificate of Service (Form N215). Check deemed service date carefully — all deadlines run from this date.',
        defendantAction: 'Note the deemed date of service — this starts the clock for acknowledgment and defence deadlines.',
        tips: 'Service by first class post is deemed on the second business day after posting. If posted on Friday, deemed served on Tuesday (assuming no bank holidays).',
        form: 'N215', formUrl: 'https://www.gov.uk/government/publications/form-n215-certificate-of-service',
    },
    {
        id: '2c', phase: 'issuing',
        title: 'Acknowledge service',
        timeline: '14 days from deemed service of claim form',
        cprBasis: 'CPR Part 10; r.10.3',
        description: 'The defendant files an Acknowledgment of Service if they wish to contest the claim. This extends the defence deadline to 28 days.',
        claimantAction: 'Monitor whether acknowledgment is filed. If neither acknowledgment nor defence is filed within 14 days, apply for default judgment.',
        defendantAction: 'File Acknowledgment of Service within 14 days to gain additional time for the defence (extends to 28 days total from service).',
        tips: 'Filing an acknowledgment is optional but highly advisable — it extends the defence deadline from 14 to 28 days from service.',
        defendantForm: 'N9', defendantFormUrl: 'https://www.gov.uk/government/publications/form-n9-response-pack',
    },
    {
        id: '2d', phase: 'issuing',
        title: 'File the defence',
        timeline: '14 days from service (or 28 days if acknowledged)',
        cprBasis: 'CPR Part 15; r.15.4; r.15.5',
        description: 'The defendant files a defence setting out their response to the claim. The parties may agree to extend by up to 28 further days without court permission.',
        claimantAction: 'If no defence is filed in time, apply for default judgment promptly using Form N225 (specified amount) or N227 (unspecified).',
        defendantAction: 'File a defence within the deadline. Set out which facts are admitted, denied, or not admitted. Include any counterclaim if appropriate.',
        tips: 'Missing this deadline is critical. The claimant can apply for default judgment, which may be set aside but only with good reason and at cost.',
        form: 'N225/N227', formUrl: 'https://www.gov.uk/government/publications/form-n225-request-for-judgment-and-reply-to-admission-specified-amount',
        defendantForm: 'N11 (counterclaim)', defendantFormUrl: 'https://www.gov.uk/government/publications/form-n211-part-20-claim-form',
        decision: { question: 'Has a defence been filed?', resolved: false, nextId: '3b' },
    },

    /* ── Phase 3: Case Management ── */
    {
        id: '3a', phase: 'management',
        title: 'Directions questionnaire',
        timeline: 'Return within 14 days of receipt',
        cprBasis: 'CPR Part 26; r.26.3',
        description: 'Both parties complete a Directions Questionnaire (N180 for small claims, N181 for other tracks). This helps the court allocate the case to the appropriate track.',
        claimantAction: 'Complete and return the DQ by the date specified. Indicate willingness to use ADR. Identify witnesses and any expert evidence needed.',
        defendantAction: 'Complete and return the DQ by the date specified. Indicate willingness to use ADR. Identify witnesses and any expert evidence needed.',
        tips: 'Both parties answer the same questionnaire. Failure to return it can result in sanctions including strike-out.',
        form: 'N180/N181', formUrl: 'https://www.gov.uk/government/publications/form-n181-directions-questionnaire-fast-track-and-multi-track',
    },
    {
        id: '3b', phase: 'management',
        title: 'Allocation to track',
        timeline: '2–4 weeks after defence filed',
        cprBasis: 'CPR r.26.6 (as amended October 2023)',
        description: 'The court allocates the case to a track based on value, complexity, and likely trial length. Track thresholds (from October 2023): Small Claims (up to £10,000), Fast Track (£10,000–£25,000), Intermediate Track (£25,000–£100,000), Multi-Track (over £100,000 or exceptional complexity).',
        claimantAction: 'Note the track allocation. Small claims = very limited costs recovery. Fast/intermediate track = fixed recoverable costs apply.',
        defendantAction: 'Note the track allocation. On small claims track, costs risk is minimal. On other tracks, consider the costs implications.',
        tips: 'The intermediate track (new from October 2023) applies fixed costs to claims £25,000–£100,000. Personal injury RTA claims have a lower small claims limit of £5,000.',
    },
    {
        id: '3c', phase: 'management',
        title: 'Comply with directions',
        timeline: 'As ordered by the court (typically 4–12 weeks)',
        cprBasis: 'CPR r.27.4 (small claims); r.28.2 (fast track); r.28A (intermediate)',
        description: 'The court issues directions — a timetable for disclosure, witness statements, and expert evidence. Both parties must comply strictly.',
        claimantAction: 'Prepare and exchange documents, witness statements, and any expert evidence by each deadline. Apply for extensions before deadlines expire.',
        defendantAction: 'Prepare and exchange documents, witness statements, and any expert evidence by each deadline. Apply for extensions before deadlines expire.',
        tips: 'Missing a deadline can result in evidence being excluded or the case being struck out. Always apply for an extension before the deadline, not after.',
    },

    /* ── Phase 4: Hearing & Resolution ── */
    {
        id: '4a', phase: 'hearing',
        title: 'Prepare the hearing bundle',
        timeline: '3–7 days before hearing (as directed)',
        cprBasis: 'CPR PD 27, para 2.3 (small claims); PD 28A (fast/intermediate)',
        description: 'The bundle of documents for the hearing is prepared — paginated, indexed, and agreed between the parties where possible.',
        claimantAction: 'Prepare the hearing bundle (unless the court directs otherwise). Include all relevant documents, paginate, and serve copies.',
        defendantAction: 'Cooperate in agreeing the bundle contents. Ensure any documents you rely on are included.',
        tips: 'Bring 3 copies to court (judge, witness, yourself). A clear, well-organised bundle makes a significant difference to the judge\'s impression.',
    },
    {
        id: '4b', phase: 'hearing',
        title: 'The hearing',
        timeline: 'Small claims: typically 15–60 minutes. Fast/intermediate: 1–3 days',
        cprBasis: 'CPR r.27.8 (small claims hearing); Part 28 (fast track trial)',
        description: 'Both parties attend court. Each presents their case, the judge may ask questions, and both respond to the other party\'s arguments.',
        claimantAction: 'Present the claim clearly and concisely. Focus on the facts, the remedy sought, and evidence. Let the judge guide proceedings.',
        defendantAction: 'Present the defence. Focus on the facts that support your position. Challenge specific points rather than general denials.',
        tips: 'Arrive early. Address the judge as "Sir" or "Madam". Speak clearly and factually. Do not interrupt — both sides will have their opportunity.',
    },
    {
        id: '4c', phase: 'hearing',
        title: 'Judgment',
        timeline: 'Usually given on the day (small claims) or reserved',
        cprBasis: 'CPR Part 40',
        description: 'The court gives judgment. In small claims, this is usually immediate. In fast track or above, judgment may be reserved and handed down later.',
        claimantAction: 'If judgment is in your favour, note the terms carefully — amount, interest, costs. If not, consider the merits of an appeal (strict time limit: 21 days).',
        defendantAction: 'If judgment is against you, note the deadline for payment (usually 14 days). Consider whether there are grounds for appeal (21-day time limit).',
        tips: 'An appeal is not a re-hearing — it requires an error of law or serious procedural irregularity. Permission to appeal must be sought.',
    },
    {
        id: '4d', phase: 'hearing',
        title: 'Enforcement',
        timeline: '14 days for voluntary payment, then enforcement steps',
        cprBasis: 'CPR Parts 70–73',
        description: 'If the judgment debtor does not pay voluntarily, the judgment creditor may use court enforcement methods.',
        claimantAction: 'If payment is not received within 14 days, consider enforcement: warrant of control (bailiffs), attachment of earnings, third party debt order, or charging order.',
        defendantAction: 'If unable to pay in full, apply to vary the judgment to pay by instalments. Respond promptly to any enforcement action.',
        tips: 'Each enforcement method has a separate court fee. A warrant of control (county court bailiffs) is usually the quickest first step.',
    },
];

/* ─── Component ─── */
export default function ProceduralRoadmap() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const userRole: UserRole = currentCase?.user_role || 'claimant';
    const [expandedId, setExpandedId] = useState<string | null>(null);

    let lastPhase: Phase | '' = '';

    return (
        <div className="page">
            {/* Header */}
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                Procedural Outline
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                Civil court procedure in England &amp; Wales — adapted to your role.
            </p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.4 }}>
                CPR references and timescales correct as at February 2026. Verify current rules at{' '}
                <a href="https://www.justice.gov.uk/courts/procedure-rules/civil" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>justice.gov.uk</a>.
            </p>

            {/* Role indicator + Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.5rem',
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: userRole === 'claimant' ? '#eff6ff' : '#fef3c7',
                    border: `1px solid ${userRole === 'claimant' ? '#bfdbfe' : '#fcd34d'}`,
                    borderRadius: '2rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: userRole === 'claimant' ? '#1e40af' : '#92400e',
                }}>
                    {userRole === 'claimant' ? '⚔️' : '🛡️'} Viewing as: {userRole === 'claimant' ? 'Claimant' : 'Defendant'}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {Object.values(PHASE_CONFIG).map((p) => (
                        <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.colour, display: 'inline-block' }} />
                            {p.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {STEPS.map((step) => {
                    const phaseConf = PHASE_CONFIG[step.phase];
                    const isExpanded = expandedId === step.id;
                    const showPhaseHeader = step.phase !== lastPhase;
                    if (showPhaseHeader) lastPhase = step.phase;

                    return (
                        <div key={step.id}>
                            {/* Phase section header */}
                            {showPhaseHeader && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 0',
                                    marginTop: step.id === '1a' ? 0 : '1.25rem',
                                    borderBottom: `2px solid ${phaseConf.colour}`,
                                    marginBottom: '0.5rem',
                                }}>
                                    <span style={{ fontSize: '1.1rem' }}>{phaseConf.icon}</span>
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        color: phaseConf.colour,
                                    }}>
                                        {phaseConf.label}
                                    </span>
                                </div>
                            )}

                            {/* Step card */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : step.id)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '1rem 1.25rem',
                                    background: isExpanded ? phaseConf.bg : 'white',
                                    border: `1px solid ${isExpanded ? phaseConf.colour : 'var(--border)'}`,
                                    borderLeft: `4px solid ${phaseConf.colour}`,
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                aria-expanded={isExpanded}
                                aria-label={`Step ${step.id}: ${step.title}`}
                            >
                                {/* Collapsed header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                background: phaseConf.colour,
                                                color: '#fff',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                flexShrink: 0,
                                            }}>
                                                {step.id}
                                            </span>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, lineHeight: 1.3 }}>
                                                    {step.title}
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0', lineHeight: 1.3 }}>
                                                    ⏱ {step.timeline}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        transition: 'transform 0.15s',
                                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                                        flexShrink: 0,
                                        marginLeft: '0.75rem',
                                    }}>
                                        ▶
                                    </span>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div
                                        style={{ marginTop: '1rem', borderTop: `1px solid ${phaseConf.colour}33`, paddingTop: '1rem' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* What happens */}
                                        <p style={{ fontSize: '0.9rem', margin: '0 0 1rem', lineHeight: 1.6, color: 'var(--text)' }}>
                                            {step.description}
                                        </p>

                                        {/* Your action — role-specific */}
                                        <div style={{
                                            background: userRole === 'claimant' ? '#eff6ff' : '#fffbeb',
                                            border: `1px solid ${userRole === 'claimant' ? '#bfdbfe' : '#fde68a'}`,
                                            borderRadius: '0.5rem',
                                            padding: '0.875rem 1rem',
                                            marginBottom: '0.75rem',
                                        }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: '0 0 0.375rem', color: userRole === 'claimant' ? '#1e40af' : '#92400e' }}>
                                                {userRole === 'claimant' ? '⚔️ Your action (Claimant)' : '🛡️ Your action (Defendant)'}
                                            </p>
                                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                                                {userRole === 'claimant' ? step.claimantAction : step.defendantAction}
                                            </p>
                                        </div>

                                        {/* Reference & forms */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.375rem',
                                            fontSize: '0.8rem',
                                            marginBottom: '0.75rem',
                                        }}>
                                            <p style={{ margin: 0, lineHeight: 1.5 }}>
                                                <strong>CPR basis:</strong>{' '}
                                                <span style={{ color: 'var(--accent)' }}>{step.cprBasis}</span>
                                            </p>
                                            {step.form && (
                                                <p style={{ margin: 0 }}>
                                                    <strong>Form:</strong>{' '}
                                                    {step.formUrl ? (
                                                        <a
                                                            href={step.formUrl}
                                                            target={step.formUrl.startsWith('http') ? '_blank' : undefined}
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'var(--accent)' }}
                                                        >
                                                            {step.form} ↗
                                                        </a>
                                                    ) : step.form}
                                                </p>
                                            )}
                                            {step.defendantForm && userRole === 'defendant' && (
                                                <p style={{ margin: 0 }}>
                                                    <strong>Form:</strong>{' '}
                                                    {step.defendantFormUrl ? (
                                                        <a
                                                            href={step.defendantFormUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'var(--accent)' }}
                                                        >
                                                            {step.defendantForm} ↗
                                                        </a>
                                                    ) : step.defendantForm}
                                                </p>
                                            )}
                                        </div>

                                        {/* Practical tip */}
                                        <div style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.5rem',
                                        }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.8rem', margin: '0 0 0.25rem', color: '#475569' }}>
                                                💡 Practical tip
                                            </p>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                                                {(userRole === 'claimant' && step.claimantTip) ? step.claimantTip
                                                    : (userRole === 'defendant' && step.defendantTip) ? step.defendantTip
                                                        : step.tips}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </button>

                            {/* Decision point */}
                            {step.decision && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 1rem 0.5rem 3.5rem',
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                }}>
                                    <span style={{
                                        width: 18, height: 18,
                                        border: `2px solid ${phaseConf.colour}`,
                                        transform: 'rotate(45deg)',
                                        flexShrink: 0,
                                        background: 'white',
                                    }} />
                                    <span style={{ fontWeight: 500 }}>{step.decision.question}</span>
                                    <span style={{
                                        background: '#dcfce7',
                                        color: '#166534',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}>
                                        Yes → Matter resolved ✓
                                    </span>
                                    <span style={{
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}>
                                        No → Continue ↓
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* End node */}
                <div style={{
                    padding: '1rem 1.25rem',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderLeft: '4px solid #10b981',
                    borderRadius: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#065f46',
                    marginTop: '0.5rem',
                }}>
                    🏁 Case resolved
                </div>
            </div>

            {/* CPR Deadline Calculator */}
            <DeadlineCalculator />

            {/* Footer disclaimer */}
            <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginTop: '2rem',
            }}>
                <strong>Disclaimer:</strong> This is a general outline of civil court procedure in England &amp; Wales based on the
                Civil Procedure Rules. Specific claim types (personal injury, housing, debt, etc.) may have additional
                pre-action protocols or requirements. Track thresholds are as of October 2023. If your claim is complex,
                high-value, or involves specialist proceedings, seek professional legal advice.
            </div>
        </div>
    );
}
