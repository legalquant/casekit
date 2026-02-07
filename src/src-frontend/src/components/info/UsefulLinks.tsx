interface ResourceLink {
    title: string;
    url: string;
    description: string;
    category: string;
}

// TODO: Verify all URLs are still live — gov.uk and judiciary.uk reorganise pages periodically
const RESOURCES: ResourceLink[] = [
    // Court & Procedure
    {
        title: 'Civil Procedure Rules',
        url: 'https://www.justice.gov.uk/courts/procedure-rules/civil',
        description: 'The full text of the CPR, practice directions, and pre-action protocols.',
        category: 'Court & Procedure',
    },
    {
        title: 'HMCTS Guidance for Litigants in Person',
        url: 'https://www.judiciary.uk/guidance-and-resources/litigants-in-person/',
        description: 'Official judiciary guidance and resources for unrepresented parties.',
        category: 'Court & Procedure',
    },
    {
        title: 'Money Claims Online (MCOL)',
        url: 'https://www.gov.uk/make-money-claim',
        description: 'Issue a money claim online for claims up to £100,000.',
        category: 'Court & Procedure',
    },
    {
        title: 'HMCTS Court and Tribunal Forms',
        url: 'https://www.gov.uk/government/collections/court-and-tribunal-forms',
        description: 'Full index of court forms — N1, N9, N244, N260, and more.',
        category: 'Court & Procedure',
    },
    {
        title: 'Court and Tribunal Fees',
        url: 'https://www.gov.uk/court-fees-what-they-are',
        description: 'Current court fees and information on fee remission (help with fees).',
        category: 'Court & Procedure',
    },

    // Legislation
    {
        title: 'Consumer Rights Act 2015 (Full Text)',
        url: 'https://www.legislation.gov.uk/ukpga/2015/15/contents',
        description: 'The full text of the CRA 2015 on legislation.gov.uk.',
        category: 'Legislation',
    },
    {
        title: 'Limitation Act 1980',
        url: 'https://www.legislation.gov.uk/ukpga/1980/58/contents',
        description: 'Time limits for bringing claims — see s.5 for contract claims (6 years).',
        category: 'Legislation',
    },
    {
        title: 'Pre-Action Protocol for Debt Claims',
        url: 'https://www.justice.gov.uk/courts/procedure-rules/civil/protocol/prot_debt',
        description: 'Applicable to most consumer money claims. Sets out required pre-action steps.',
        category: 'Legislation',
    },

    // Free Advice & Support
    {
        title: 'Citizens Advice — Consumer Rights',
        url: 'https://www.citizensadvice.org.uk/consumer/',
        description: 'Comprehensive plain-English guidance on consumer rights and disputes.',
        category: 'Free Advice & Support',
    },
    {
        title: 'Advicenow',
        url: 'https://www.advicenow.org.uk/',
        description: 'Practical, judiciary-endorsed guides for navigating legal processes.',
        category: 'Free Advice & Support',
    },
    {
        title: 'Support Through Court',
        url: 'https://www.supportthroughcourt.org/',
        description: 'Free, non-legal support before, during, and after court hearings.',
        category: 'Free Advice & Support',
    },
    {
        title: 'LawWorks — Free Legal Advice',
        url: 'https://www.lawworks.org.uk/',
        description: 'Pro bono legal advice through clinics across England & Wales.',
        category: 'Free Advice & Support',
    },
    {
        title: 'Advocate (formerly the Bar Pro Bono Unit)',
        url: 'https://weareadvocate.org.uk/',
        description: 'Free legal help from volunteer barristers for people who cannot afford representation.',
        category: 'Free Advice & Support',
    },

    // Legal Research
    {
        title: 'BAILII — Free Case Law',
        url: 'https://www.bailii.org/',
        description: 'Free access to judgments from courts and tribunals across the UK and Ireland.',
        category: 'Legal Research',
    },
    {
        title: 'The National Archives — Legislation',
        url: 'https://www.legislation.gov.uk/',
        description: 'Official source for all UK legislation, including as amended.',
        category: 'Legal Research',
    },
];

export default function UsefulLinks() {
    const categories = [...new Set(RESOURCES.map((r) => r.category))];

    return (
        <div className="page">
            <div className="page-header">
                <h1>Useful Links</h1>
                <p>
                    Curated links to official court resources, legislation, free advice services,
                    and legal research tools. All links point to authoritative, publicly available sources.
                </p>
            </div>

            {categories.map((category) => (
                <div key={category} style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ marginBottom: 'var(--space-3)', fontSize: '1.05rem' }}>{category}</h2>
                    <div className="resource-grid">
                        {RESOURCES.filter((r) => r.category === category).map((resource) => (
                            <a
                                key={resource.url}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card card-interactive" style={{ height: '100%' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-1)', color: 'var(--accent)' }}>
                                        {resource.title}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 'var(--space-1)' }}>↗</span>
                                    </h3>
                                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {resource.description}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            ))}

            <div className="citation" style={{ marginTop: 'var(--space-4)' }}>
                <strong>Note:</strong> All links are to external websites maintained by third parties.
                CaseKit has no control over their content. Government websites in particular may reorganise
                their URLs without notice. If you find a broken link, the information is usually still
                available by searching the relevant site directly.
            </div>
        </div>
    );
}
