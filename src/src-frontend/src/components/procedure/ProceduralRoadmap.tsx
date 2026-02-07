import { useState } from 'react';

interface RoadmapStep {
    number: number;
    title: string;
    description: string;
    reference: string;
    form?: string;
    formUrl?: string;
    estimatedTimeline: string;
    tips: string;
}

const STEPS: RoadmapStep[] = [
    {
        number: 1,
        title: 'Understand your position',
        description: 'Identify the basis of your claim or dispute. Gather the key facts: what happened, when, who was involved, and what outcome you want. Consider whether any specific legislation applies to your situation.',
        reference: 'Limitation Act 1980 (general limitation periods)',
        estimatedTimeline: 'Immediate',
        tips: 'Write a clear, factual summary of what happened before taking any other steps. This will form the foundation for every document you produce later. Check that your claim is within the limitation period — typically 6 years for contract and tort claims, 3 years for personal injury.',
    },
    {
        number: 2,
        title: 'Gather your evidence',
        description: 'Collect all relevant documents — contracts, correspondence, invoices, photographs, receipts, and any other records that support your position. Organise them chronologically.',
        reference: 'CPR r.31.6 (standard disclosure)',
        estimatedTimeline: '1–2 weeks',
        tips: 'Use CaseKit\'s document management to upload and tag everything. Build your chronology early — it helps you spot gaps in your evidence and identify what you still need. Save emails as PDFs (see How to Save Emails).',
    },
    {
        number: 3,
        title: 'Try to resolve it directly',
        description: 'Write to the other party setting out what happened, why you believe they are responsible, and what you want them to do. Give a reasonable deadline (usually 14 days) for a response.',
        reference: 'CPR PD Pre-Action Conduct, para 6',
        estimatedTimeline: '14–28 days',
        tips: 'Keep the tone factual and professional. State the outcome you want clearly. Send by email and keep a copy. This correspondence is important — the court will look at whether both parties tried to resolve things before issuing proceedings.',
    },
    {
        number: 4,
        title: 'Send a letter before claim',
        description: 'If direct contact does not resolve the matter, send a formal pre-action letter. This gives the other party notice that you intend to issue court proceedings if the matter is not resolved.',
        reference: 'CPR PD Pre-Action Conduct, paras 6–16',
        form: 'Template in Templates section',
        estimatedTimeline: '14 days for response',
        tips: 'The court expects both parties to follow the Practice Direction on Pre-Action Conduct. Failing to send a letter before claim, or failing to respond to one, can result in costs penalties. Set a clear deadline (14 days is standard).',
    },
    {
        number: 5,
        title: 'Consider alternative dispute resolution',
        description: 'Before issuing a claim, consider whether mediation, an ombudsman scheme, or another form of ADR could resolve the dispute. The court expects parties to have considered this.',
        reference: 'CPR r.1.4(2)(e); Churchill v Merthyr Tydfil CBC [2023] EWCA Civ 1416',
        estimatedTimeline: '2–6 weeks',
        tips: 'The court may penalise parties who unreasonably refuse to engage in ADR. Many sectors have ombudsman schemes (financial services, energy, telecoms, property). The Small Claims Mediation Service is free for claims allocated to the small claims track.',
    },
    {
        number: 6,
        title: 'Decide whether to proceed',
        description: 'Assess the strength of your case, the likely costs, and whether the other party can pay. Consider whether professional advice would be worthwhile at this stage.',
        reference: 'CPR r.1.1 (overriding objective — proportionality)',
        estimatedTimeline: '1–2 days',
        tips: 'CaseKit\'s AI merits analysis can help you assess your position. Be realistic: consider the court fees, your time, the stress of proceedings, and whether a judgment would actually be enforceable. For complex or high-value claims, a solicitor consultation may save you money in the long run.',
    },
    {
        number: 7,
        title: 'Issue the claim',
        description: 'File your claim with the court. For most money claims, you can use Money Claims Online (MCOL) or submit Form N1. Pay the court fee.',
        reference: 'CPR Part 7; CPR PD 7A',
        form: 'N1',
        formUrl: 'https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7',
        estimatedTimeline: '1–2 days to prepare',
        tips: 'Court fees depend on claim value: up to £300 → £35; £300–500 → £50; £500–1,000 → £70; £1,000–1,500 → £80; £1,500–3,000 → £115; £3,000–5,000 → £205; £5,000–10,000 → £455. MCOL is usually cheaper and faster for straightforward money claims.',
    },
    {
        number: 8,
        title: 'Service',
        description: 'The court serves the claim on the defendant. Alternatively, you can serve the claim yourself and file a certificate of service.',
        reference: 'CPR Part 6; CPR r.6.14 (deemed service)',
        form: 'N215 (Certificate of Service)',
        formUrl: 'https://www.gov.uk/government/publications/form-n215-certificate-of-service',
        estimatedTimeline: '14 days from issue',
        tips: 'The court usually serves by first class post. Service is deemed to have taken place on the second business day after posting. If serving yourself, keep proof of the method used.',
    },
    {
        number: 9,
        title: 'Defendant responds',
        description: 'The defendant has 14 days to acknowledge service and then 28 days from service to file a defence. If they do not respond, you may apply for default judgment.',
        reference: 'CPR r.10.3 (acknowledgment); r.15.4 (defence)',
        form: 'N225/N227 (default judgment)',
        formUrl: 'https://www.gov.uk/government/publications/form-n225-request-for-judgment-and-reply-to-admission-specified-amount',
        estimatedTimeline: '14–28 days',
        tips: 'If no defence is filed, apply for default judgment promptly. If a defence is filed, read it carefully and identify which facts are agreed and which are disputed — this narrows the issues for trial.',
    },
    {
        number: 10,
        title: 'Allocation to track',
        description: 'Both parties complete a directions questionnaire. The court allocates the claim to a track: small claims (up to £10,000), fast track (£10,000–£25,000), or multi-track (above £25,000).',
        reference: 'CPR Part 26; r.26.6',
        form: 'N149/N150 (Directions Questionnaire)',
        formUrl: 'https://www.gov.uk/government/publications/form-n150-allocation-questionnaire',
        estimatedTimeline: '2–4 weeks after defence',
        tips: 'The track determines costs rules, procedure, and formality. Small claims track has very limited costs liability — you generally cannot recover legal fees even if you win, but equally you are not at risk of paying the other side\'s legal costs if you lose.',
    },
    {
        number: 11,
        title: 'Comply with directions',
        description: 'The court issues directions — a timetable for exchanging documents, witness statements, and any expert evidence. Follow these strictly.',
        reference: 'CPR r.27.4 (small claims); r.28.2 (fast track)',
        estimatedTimeline: 'As ordered by the court',
        tips: 'Missing a deadline can result in your evidence being excluded or your case being struck out. If you need more time, apply to the court before the deadline expires. Use CaseKit\'s bundle export to produce an organised evidence pack.',
    },
    {
        number: 12,
        title: 'Prepare for the hearing',
        description: 'Prepare your witness statement, organise your evidence bundle, and plan what you need to say. The bundle should be paginated and indexed.',
        reference: 'CPR PD 27, para 2.3 (small claims)',
        estimatedTimeline: '2–4 weeks before hearing',
        tips: 'Bring 3 copies of your bundle: one for you, one for the judge, one for the other side. Practice summarising your case in 5 minutes. Focus on the facts and the remedy you are asking for. Small claims hearings are informal — the judge will guide you through the process.',
    },
    {
        number: 13,
        title: 'The hearing',
        description: 'Attend court at the scheduled time. Present your case, answer the judge\'s questions, and respond to the other party\'s arguments. The judge will give a decision, usually on the day.',
        reference: 'CPR r.27.8 (small claims hearing)',
        estimatedTimeline: 'As scheduled',
        tips: 'Arrive early. Dress appropriately. Address the judge as "Sir" or "Madam". Speak clearly and factually. Do not interrupt the other party — you will have your chance to respond. If you disagree with a point, make a note and address it when it is your turn.',
    },
    {
        number: 14,
        title: 'Judgment and enforcement',
        description: 'The court gives judgment. If you win and the other party does not pay voluntarily, you may need to take enforcement action.',
        reference: 'CPR Parts 70–73 (enforcement methods)',
        estimatedTimeline: '14 days for payment, then enforcement',
        tips: 'Enforcement options include: warrant of control (bailiffs), attachment of earnings, third party debt order, or charging order. Each has a court fee. Consider the debtor\'s ability to pay before choosing a method — a judgment is only worth something if it can be enforced.',
    },
];

export default function ProceduralRoadmap() {
    const [expandedStep, setExpandedStep] = useState<number | null>(null);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Step-by-Step Guide
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                A general procedural guide for civil claims in England & Wales.
                Each step includes the relevant legal reference, court forms, and practical guidance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {STEPS.map((step) => (
                    <div key={step.number} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <button
                            onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                width: '100%',
                                padding: '1rem',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                            aria-expanded={expandedStep === step.number}
                            aria-label={`Step ${step.number}: ${step.title}`}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    flexShrink: 0,
                                }}
                            >
                                {step.number}
                            </span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.title}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{step.estimatedTimeline}</p>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {expandedStep === step.number ? '▼' : '▶'}
                            </span>
                        </button>

                        {expandedStep === step.number && (
                            <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.75rem' }}>{step.description}</p>
                                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                    <p style={{ fontSize: '0.8rem' }}>
                                        <strong>Reference:</strong>{' '}
                                        <span style={{ color: 'var(--color-accent)' }}>{step.reference}</span>
                                    </p>
                                    {step.form && (
                                        <p style={{ fontSize: '0.8rem' }}>
                                            <strong>Form:</strong>{' '}
                                            {step.formUrl ? (
                                                <a href={step.formUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
                                                    {step.form}
                                                </a>
                                            ) : (
                                                step.form
                                            )}
                                        </p>
                                    )}
                                    <div style={{ background: '#f7fafc', padding: '0.75rem', borderRadius: '0.25rem', marginTop: '0.25rem' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Practical tip</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{step.tips}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div
                style={{
                    background: '#f7fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '1.5rem',
                }}
            >
                This is a general guide to civil court procedure in England & Wales. Specific claim types may have
                additional requirements or pre-action protocols. If your claim is complex, high-value, or involves
                issues outside the small claims track, consider seeking professional advice.
            </div>
        </div>
    );
}
