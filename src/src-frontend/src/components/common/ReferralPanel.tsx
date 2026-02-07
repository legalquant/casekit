interface ReferralProvider {
    name: string;
    url: string;
    description: string;
    tier: 1 | 2 | 3;
    categories: string[];
}

const REFERRAL_PROVIDERS: ReferralProvider[] = [
    // Tier 1: Free
    {
        name: 'Citizens Advice',
        url: 'https://www.citizensadvice.org.uk/',
        description: 'General legal guidance with consumer specialists. Available online, by phone, and in person.',
        tier: 1,
        categories: ['consumer', 'general'],
    },
    {
        name: 'LawWorks',
        url: 'https://www.lawworks.org.uk/',
        description: 'Free legal clinics run by volunteer solicitors across England & Wales.',
        tier: 1,
        categories: ['general'],
    },
    {
        name: 'Advocate (formerly Bar Pro Bono Unit)',
        url: 'https://weareadvocate.org.uk/',
        description: 'Free legal assistance from volunteer barristers for those who cannot afford legal help.',
        tier: 1,
        categories: ['general'],
    },
    {
        name: 'Personal Support Unit (PSU)',
        url: 'https://www.thepsu.org/',
        description: 'In-court support at major court centres. Emotional and practical help navigating proceedings.',
        tier: 1,
        categories: ['general'],
    },
    // Tier 2: Low-cost
    {
        name: 'Law Society — Find a Solicitor',
        url: 'https://solicitors.lawsociety.org.uk/',
        description: 'Search for solicitors by practice area and location. Many offer fixed-fee initial consultations.',
        tier: 2,
        categories: ['consumer', 'general'],
    },
    {
        name: 'Bar Council — Direct Access Portal',
        url: 'https://www.directaccessportal.co.uk/',
        description: 'Instruct a barrister directly without a solicitor. Often more cost-effective for discrete pieces of work.',
        tier: 2,
        categories: ['consumer', 'general'],
    },
];

export default function ReferralPanel() {
    const tiers = [
        { number: 1, label: 'Free Assistance', colour: '#38a169' },
        { number: 2, label: 'Low-Cost Professional Advice', colour: '#d69e2e' },
        { number: 3, label: 'Curated Directory (Coming Soon)', colour: '#a0aec0' },
    ];

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Find Professional Help
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Some cases benefit from professional legal advice. Here are resources available in England &amp; Wales.
            </p>

            {tiers.map((tier) => {
                const providers = REFERRAL_PROVIDERS.filter((p) => p.tier === tier.number);
                return (
                    <div key={tier.number} style={{ marginBottom: '1.5rem' }}>
                        <h2
                            style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: tier.colour,
                                    color: '#fff',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                }}
                            >
                                {tier.number}
                            </span>
                            {tier.label}
                        </h2>

                        {providers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {providers.map((provider) => (
                                    <div key={provider.name} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <a
                                                    href={provider.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-accent)' }}
                                                >
                                                    {provider.name} ↗
                                                </a>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                    {provider.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '1rem', background: '#f7fafc' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    This tier is planned for a future update.
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            <div
                style={{
                    background: '#f7fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                }}
            >
                Inclusion in this list does not constitute endorsement. Conduct your own due diligence before instructing any
                legal professional.
            </div>
        </div>
    );
}
