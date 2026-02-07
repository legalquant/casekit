import { useCaseStore } from '../../hooks/useCase';

export default function CaseOverview() {
    const currentCase = useCaseStore((s) => s.currentCase);

    if (!currentCase) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>No case selected. Please select or create a case.</p>
            </div>
        );
    }

    const statusLabels: Record<string, string> = {
        intake: 'Case Intake',
        pre_action: 'Pre-Action',
        adr: 'ADR / Mediation',
        issued: 'Claim Issued',
        served: 'Claim Served',
        allocated: 'Allocated to Track',
        hearing: 'Hearing',
        judgment: 'Judgment',
        closed: 'Closed',
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                {currentCase.name}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Parties */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Parties</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Claimant</span>
                            <p style={{ fontWeight: 500 }}>{currentCase.claimant_name}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Defendant</span>
                            <p style={{ fontWeight: 500 }}>{currentCase.defendant_name}</p>
                            <span className="badge badge-grey" style={{ marginTop: '0.25rem', textTransform: 'capitalize' }}>
                                {currentCase.defendant_type.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status & Key Info */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Case Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Current Stage</span>
                            <p style={{ fontWeight: 500 }}>{statusLabels[currentCase.status] || currentCase.status}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Claim Value</span>
                            <p style={{ fontWeight: 500 }}>£{currentCase.claim_value.toLocaleString()}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Risk Assessment</span>
                            <span
                                className={`badge ${currentCase.overall_risk === 'within_scope'
                                    ? 'badge-green'
                                    : currentCase.overall_risk === 'borderline'
                                        ? 'badge-amber'
                                        : 'badge-red'
                                    }`}
                            >
                                {currentCase.overall_risk === 'within_scope'
                                    ? 'Within Scope'
                                    : currentCase.overall_risk === 'borderline'
                                        ? 'Borderline'
                                        : 'Seek Advice'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Description</h2>
                    <p style={{ fontSize: '0.875rem', color: currentCase.description ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {currentCase.description || 'No description provided yet. Complete the case intake to add detail.'}
                    </p>
                </div>

                {/* Key Dates */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Key Dates</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Purchase / Service</span>
                            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                {currentCase.date_of_purchase || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Problem Discovered</span>
                            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                {currentCase.date_problem_discovered || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>First Complaint</span>
                            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                {currentCase.date_first_complained || 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Complexity Triggers */}
                {currentCase.complexity_triggers.length > 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'var(--color-warning)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-warning)' }}>
                            ⚠ Complexity Triggers
                        </h2>
                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {currentCase.complexity_triggers.map((trigger, i) => (
                                <li key={i} style={{ fontSize: '0.875rem' }}>{trigger}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
