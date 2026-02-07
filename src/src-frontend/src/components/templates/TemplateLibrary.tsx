interface HMCTSForm {
    name: string;
    formNumber: string;
    description: string;
    url: string;
    whenToUse: string;
}

const HMCTS_FORMS: HMCTSForm[] = [
    {
        name: 'Claim Form',
        formNumber: 'N1',
        description: 'Standard claim form for issuing proceedings in the County Court or High Court.',
        url: 'https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7',
        whenToUse: 'When you are ready to issue your claim after pre-action steps are exhausted.',
    },
    {
        name: 'Defence and Counterclaim',
        formNumber: 'N9',
        description: 'Form for filing a defence (N9B) and/or counterclaim (N9A) to a claim.',
        url: 'https://www.gov.uk/government/publications/form-n9a-admission-specified-amount',
        whenToUse: 'If you have been served with a claim and need to file a defence.',
    },
    {
        name: 'Application Notice',
        formNumber: 'N244',
        description: 'General application notice for making applications to the court during proceedings.',
        url: 'https://www.gov.uk/government/publications/form-n244-application-notice',
        whenToUse: 'For interim applications such as extensions of time, strike out, or summary judgment.',
    },
    {
        name: 'Certificate of Service',
        formNumber: 'N215',
        description: 'Certificate to prove that documents have been served on the other party.',
        url: 'https://www.gov.uk/government/publications/form-n215-certificate-of-service',
        whenToUse: 'After you have served a document and need to file proof of service with the court.',
    },
    {
        name: 'Request for Judgment (Default)',
        formNumber: 'N225',
        description: 'Request for default judgment for a specified amount when no defence has been filed.',
        url: 'https://www.gov.uk/government/publications/form-n225-request-for-judgment-and-reply-to-admission-specified-amount',
        whenToUse: 'If the defendant has not responded to your claim within the time limit.',
    },
    {
        name: 'Request for Judgment (Unspecified)',
        formNumber: 'N227',
        description: 'Request for judgment when the defendant has not filed a defence and the amount is unspecified.',
        url: 'https://www.gov.uk/government/publications/form-n227-request-for-judgment-by-default-amount-to-be-decided-by-the-court',
        whenToUse: 'If the defendant has not responded and your claim is for an unspecified amount.',
    },
    {
        name: 'Directions Questionnaire (Small Claims)',
        formNumber: 'N149',
        description: 'Questionnaire to help the court allocate your case to the appropriate track.',
        url: 'https://www.gov.uk/government/publications/form-n150-allocation-questionnaire',
        whenToUse: 'After the defendant has filed a defence and the court sends allocation directions.',
    },
    // TODO: Verify all URLs are current — gov.uk reorganises form pages periodically
];

interface TemplateLetter {
    name: string;
    description: string;
    content: string;
}

const TEMPLATE_LETTERS: TemplateLetter[] = [
    {
        name: 'Pre-Action Letter (Consumer — Goods)',
        description: 'Letter before claim for faulty goods under CRA 2015.',
        content: `{{YOUR_NAME}}
{{YOUR_ADDRESS}}
{{YOUR_EMAIL}}

{{DATE}}

{{DEFENDANT_NAME}}
{{DEFENDANT_ADDRESS}}

Dear {{DEFENDANT_NAME}},

RE: {{BRIEF_DESCRIPTION_OF_GOODS}} — LETTER BEFORE CLAIM

I am writing in relation to {{DESCRIPTION_OF_GOODS}} purchased from you on {{DATE_OF_PURCHASE}} for £{{PRICE}}.

The Facts

{{DESCRIBE_WHAT_HAPPENED — include dates, what the goods were, and what went wrong}}

Legal Basis

Under the Consumer Rights Act 2015, s.9, goods supplied under a contract must be of satisfactory quality. Under s.10, they must be fit for a particular purpose made known to the trader. Under s.11, they must match the description given.

I consider that the goods fail to meet these statutory requirements because {{EXPLAIN_WHY}}.

Remedy Sought

In accordance with my rights under CRA 2015, I am seeking {{REPAIR / REPLACEMENT / REFUND / COMPENSATION}} in the sum of £{{AMOUNT}}.

I refer you to the Practice Direction on Pre-Action Conduct and ask that you respond substantively to this letter within 14 days of receipt, by {{DEADLINE_DATE}}.

If I do not receive a satisfactory response, I may wish to consider issuing court proceedings without further notice, in which case I will draw the court's attention to this letter and your response (or lack thereof) when the question of costs is considered.

I would also draw your attention to the availability of alternative dispute resolution, and invite you to confirm whether you would be willing to engage in mediation or another form of ADR to resolve this matter.

Yours {{faithfully / sincerely}},

{{YOUR_NAME}}`,
    },
    {
        name: 'Complaint Letter (Initial)',
        description: 'First complaint to a seller about faulty goods or poor service.',
        content: `{{YOUR_NAME}}
{{YOUR_ADDRESS}}
{{YOUR_EMAIL}}

{{DATE}}

{{SELLER_NAME}}
{{SELLER_ADDRESS}}

Dear {{SELLER_NAME}},

RE: Complaint — {{DESCRIPTION_OF_GOODS_OR_SERVICE}}

I am writing to complain about {{GOODS/SERVICES}} purchased/received on {{DATE}}.

{{DESCRIBE THE PROBLEM — what went wrong, when you noticed it, what you expected vs what you received}}

I believe this matter falls within {{state whether goods, services, or digital content}} and I would like {{state what you want — repair, replacement, refund, or other remedy}}.

I would be grateful for your response within 14 days.

Yours {{faithfully / sincerely}},

{{YOUR_NAME}}`,
    },
];

export default function TemplateLibrary() {
    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                Templates & Forms
            </h1>

            {/* HMCTS Forms */}
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>HMCTS Court Forms</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Official court forms from gov.uk. Click to download the form from the government website.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {HMCTS_FORMS.map((form) => (
                    <div key={form.formNumber} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span className="badge badge-grey">{form.formNumber}</span>
                                    <a
                                        href={form.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-accent)' }}
                                    >
                                        {form.name} ↗
                                    </a>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{form.description}</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.375rem' }}>
                                    <strong>When to use:</strong> {form.whenToUse}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Template Letters */}
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Template Letters</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Starting points with placeholders. These are not auto-filled — review and adapt to your circumstances.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {TEMPLATE_LETTERS.map((template) => (
                    <div key={template.name} className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{template.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                            {template.description}
                        </p>
                        <pre
                            style={{
                                background: '#f7fafc',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.375rem',
                                padding: '1rem',
                                fontSize: '0.75rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontFamily: 'Consolas, Monaco, monospace',
                            }}
                        >
                            {template.content}
                        </pre>
                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                            onClick={() => navigator.clipboard.writeText(template.content)}
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
