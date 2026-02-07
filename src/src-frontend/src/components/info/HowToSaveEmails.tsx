import { Link } from 'react-router-dom';

const PROVIDERS = [
    {
        name: 'Gmail',
        methods: [
            {
                label: 'Print to PDF (easiest)',
                steps: [
                    'Open the email in Gmail',
                    'Click the three dots menu in the top-right of the email',
                    'Select "Print"',
                    'In the print dialog, change the destination to "Save as PDF"',
                    'Click "Save" and choose your CaseKit case folder',
                ],
            },
            {
                label: 'Download as .eml',
                steps: [
                    'Open the email in Gmail',
                    'Click the three dots menu in the top-right',
                    'Select "Show original"',
                    'Click "Download Original"',
                    'The .eml file will download — you can then import it into CaseKit',
                ],
            },
        ],
    },
    {
        name: 'Outlook.com / Hotmail',
        methods: [
            {
                label: 'Print to PDF (easiest)',
                steps: [
                    'Open the email in Outlook',
                    'Click the three dots menu at the top of the email',
                    'Select "Print"',
                    'Change the printer to "Microsoft Print to PDF" or "Save as PDF"',
                    'Click "Print" and save to your CaseKit case folder',
                ],
            },
            {
                label: 'Save as .eml (desktop app)',
                steps: [
                    'If using the Outlook desktop app, open the email',
                    'Go to File, then Save As',
                    'Choose "Outlook Message Format (.msg)" or drag the email to your desktop',
                    'Import the saved file into CaseKit',
                ],
            },
        ],
    },
    {
        name: 'Yahoo Mail',
        methods: [
            {
                label: 'Print to PDF',
                steps: [
                    'Open the email in Yahoo Mail',
                    'Click the three dots menu',
                    'Select "Print"',
                    'Change the printer to "Save as PDF"',
                    'Save to your CaseKit case folder',
                ],
            },
        ],
    },
    {
        name: 'Apple Mail',
        methods: [
            {
                label: 'Export as PDF',
                steps: [
                    'Open the email in Apple Mail',
                    'Go to File, then Export as PDF',
                    'Save to your CaseKit case folder',
                ],
            },
        ],
    },
];

export default function HowToSaveEmails() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>How to Save Emails</h1>
                <p>
                    Most consumer disputes involve email correspondence. Here's how to save
                    emails from common providers so you can import them into CaseKit.
                </p>
            </div>

            <div className="info-block" style={{ marginBottom: 'var(--space-5)' }}>
                <h3>Which method should I use?</h3>
                <ul>
                    <li><strong>Print to PDF</strong> is the easiest method and works with every email provider. The PDF preserves the email's visual layout including headers and dates.</li>
                    <li><strong>.eml files</strong> are the native email format. CaseKit can extract the sender, date, and subject automatically from .eml files — useful if you have many emails to process.</li>
                    <li><strong>Screenshots</strong> work as a last resort but can't be searched or have dates extracted automatically.</li>
                </ul>
            </div>

            {PROVIDERS.map((provider) => (
                <div key={provider.name} className="info-block" style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>{provider.name}</h3>
                    {provider.methods.map((method, idx) => (
                        <div key={idx} style={{ marginBottom: idx < provider.methods.length - 1 ? 'var(--space-4)' : 0 }}>
                            <h4 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: 'var(--space-2)' }}>
                                {method.label}
                            </h4>
                            <ol style={{ paddingLeft: 'var(--space-5)', margin: 0 }}>
                                {method.steps.map((step, stepIdx) => (
                                    <li
                                        key={stepIdx}
                                        style={{
                                            fontSize: '0.875rem',
                                            lineHeight: 1.7,
                                            marginBottom: 'var(--space-1)',
                                            color: 'var(--text)',
                                        }}
                                    >
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            ))}

            <div className="citation">
                <strong>Tips for organising email evidence:</strong>
                <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-5)' }}>
                    <li style={{ fontSize: '0.85rem', marginBottom: 'var(--space-1)' }}>
                        Save emails in date order where possible — this makes building your chronology easier
                    </li>
                    <li style={{ fontSize: '0.85rem', marginBottom: 'var(--space-1)' }}>
                        Include both your emails and the other party's replies — courts want to see the full correspondence
                    </li>
                    <li style={{ fontSize: '0.85rem', marginBottom: 'var(--space-1)' }}>
                        Save the complete email thread rather than individual replies where you can
                    </li>
                    <li style={{ fontSize: '0.85rem', marginBottom: 'var(--space-1)' }}>
                        Upload emails to the Correspondence folder in your case
                    </li>
                </ul>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/cases" className="btn btn-primary">
                    Go to Documents
                </Link>
                <Link to="/procedure" className="btn btn-secondary">
                    Step-by-Step Guide
                </Link>
            </div>
        </div>
    );
}
