import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCaseStore } from '../../hooks/useCase';
import { loadAiHistory } from '../../lib/tauri-commands';
import type { AiHistoryRecord } from '../../lib/tauri-commands';
import type { UserRole } from '../../types/case';
import type { ParsedMeritsResponse } from '../../types/ai';

const AI_TYPE_LABELS: Record<string, string> = {
    merits_assessment: 'Case Analysis',
    pre_action_letter: 'Pre-Action Letter',
    response_to_letter: 'Response to Letter',
    response_review: 'Response Review',
    particulars_draft: 'Particulars of Claim',
    defence_draft: 'Defence',
};

export default function CaseOverview() {
    const currentCase = useCaseStore((s) => s.currentCase);
    const cases = useCaseStore((s) => s.cases);
    const loading = useCaseStore((s) => s.loading);
    const error = useCaseStore((s) => s.error);
    const loadCases = useCaseStore((s) => s.loadCases);
    const selectCase = useCaseStore((s) => s.selectCase);
    const createNewCase = useCaseStore((s) => s.createNewCase);
    const clearCurrentCase = useCaseStore((s) => s.clearCurrentCase);

    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newClaimant, setNewClaimant] = useState('');
    const [newDefendant, setNewDefendant] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('claimant');
    const [createError, setCreateError] = useState<string | null>(null);
    const [aiHistory, setAiHistory] = useState<AiHistoryRecord[]>([]);
    const [expandedAi, setExpandedAi] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadCases();
    }, []);

    // Load latest AI analysis when a case is selected
    useEffect(() => {
        if (!currentCase) { setAiHistory([]); return; }
        loadAiHistory(currentCase.name)
            .then((history) => {
                const sorted = [...history].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                setAiHistory(sorted.slice(0, 5));
            })
            .catch(() => setAiHistory([]));
    }, [currentCase?.name]);

    const handleCreate = async () => {
        if (!newName.trim() || !newClaimant.trim() || !newDefendant.trim()) {
            setCreateError('All fields are required.');
            return;
        }
        try {
            setCreateError(null);
            await createNewCase(newName.trim(), newClaimant.trim(), newDefendant.trim(), newRole);
            setShowCreate(false);
            setNewName('');
            setNewClaimant('');
            setNewDefendant('');
        } catch (e) {
            setCreateError(String(e));
        }
    };

    if (currentCase) {

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
            <div className="page" style={{ maxWidth: 900 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                        {currentCase.name}
                    </h1>
                    <button className="btn btn-ghost" onClick={clearCurrentCase} style={{ fontSize: '0.8rem' }}>
                        ← All Cases
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Parties */}
                    <div className="card">
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Parties</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Claimant</span>
                                <p style={{ fontWeight: 500 }}>
                                    {currentCase.claimant_name}
                                    {currentCase.user_role === 'claimant' && (
                                        <span style={{ marginLeft: 8, fontSize: '0.65rem', padding: '2px 6px', borderRadius: 3, background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>YOU</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Defendant</span>
                                <p style={{ fontWeight: 500 }}>
                                    {currentCase.defendant_name}
                                    {currentCase.user_role === 'defendant' && (
                                        <span style={{ marginLeft: 8, fontSize: '0.65rem', padding: '2px 6px', borderRadius: 3, background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>YOU</span>
                                    )}
                                </p>
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
                            {currentCase.description || 'No description provided yet.'}
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

                    {/* AI Analysis Summary */}
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>AI Analysis</h2>
                        {aiHistory.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {aiHistory.map((entry, i) => {
                                    const entryId = entry.id || String(i);
                                    const isExpanded = expandedAi.has(entryId);
                                    return (
                                        <div key={entryId} style={{
                                            padding: '0.625rem 0.75rem',
                                            background: '#f8fafc',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.15s',
                                        }}
                                            onClick={() => {
                                                setExpandedAi(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(entryId)) next.delete(entryId);
                                                    else next.add(entryId);
                                                    return next;
                                                });
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                                    {AI_TYPE_LABELS[entry.callType] || entry.callType}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                        {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                                                        &#9660;
                                                    </span>
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <div style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                    {(() => {
                                                        // Try to parse merits assessment JSON
                                                        if (entry.callType === 'merits_assessment') {
                                                            try {
                                                                const jsonMatch = entry.response.match(/\{[\s\S]*\}/);
                                                                if (jsonMatch) {
                                                                    const parsed: ParsedMeritsResponse = JSON.parse(jsonMatch[0]);
                                                                    return (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                                                            {/* Factual Summary */}
                                                                            <div>
                                                                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Factual Summary</p>
                                                                                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#334155' }}>{parsed.factualSummary}</p>
                                                                            </div>

                                                                            {/* Legal Framework */}
                                                                            {parsed.legalFramework?.length > 0 && (
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Legal Framework</p>
                                                                                    {parsed.legalFramework.map((lf, j) => (
                                                                                        <div key={j} style={{ marginBottom: '0.25rem' }}>
                                                                                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{lf.provision}</span>
                                                                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}> — {lf.application}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {/* Positions side by side */}
                                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                                                <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '0.25rem', borderLeft: '3px solid #3b82f6' }}>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>Claimant Position</p>
                                                                                    {parsed.claimantPosition?.potentialCausesOfAction?.length > 0 && (
                                                                                        <div style={{ marginBottom: '0.25rem' }}>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>Causes of Action</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.claimantPosition.potentialCausesOfAction.map((c, j) => <li key={j}>{c}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                    {parsed.claimantPosition?.strengthsOfPosition?.length > 0 && (
                                                                                        <div style={{ marginBottom: '0.25rem' }}>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Strengths</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.claimantPosition.strengthsOfPosition.map((s, j) => <li key={j}>{s}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                    {parsed.claimantPosition?.weaknesses?.length > 0 && (
                                                                                        <div>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#991b1b' }}>Weaknesses</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.claimantPosition.weaknesses.map((w, j) => <li key={j}>{w}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ padding: '0.5rem', background: '#fffbeb', borderRadius: '0.25rem', borderLeft: '3px solid #f59e0b' }}>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>Defendant Position</p>
                                                                                    {parsed.defendantPosition?.potentialDefences?.length > 0 && (
                                                                                        <div style={{ marginBottom: '0.25rem' }}>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>Potential Defences</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.defendantPosition.potentialDefences.map((d, j) => <li key={j}>{d}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                    {parsed.defendantPosition?.strengthsOfPosition?.length > 0 && (
                                                                                        <div style={{ marginBottom: '0.25rem' }}>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Strengths</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.defendantPosition.strengthsOfPosition.map((s, j) => <li key={j}>{s}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                    {parsed.defendantPosition?.weaknesses?.length > 0 && (
                                                                                        <div>
                                                                                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#991b1b' }}>Weaknesses</p>
                                                                                            <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                                {parsed.defendantPosition.weaknesses.map((w, j) => <li key={j}>{w}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Limitation */}
                                                                            {parsed.limitationPeriod && (
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.125rem' }}>Limitation Period</p>
                                                                                    <p style={{ fontSize: '0.8rem' }}>{parsed.limitationPeriod.applicablePeriod}</p>
                                                                                    {parsed.limitationPeriod.expiryEstimate && <p style={{ fontSize: '0.78rem', color: '#475569' }}>Estimated expiry: {parsed.limitationPeriod.expiryEstimate}</p>}
                                                                                    {parsed.limitationPeriod.notes && <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{parsed.limitationPeriod.notes}</p>}
                                                                                </div>
                                                                            )}

                                                                            {/* Quantum */}
                                                                            {parsed.quantumAnalysis && (
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.125rem' }}>Quantum Analysis</p>
                                                                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                                                        {parsed.quantumAnalysis.low || parsed.quantumAnalysis.high
                                                                                            ? `\u00a3${parsed.quantumAnalysis.low.toLocaleString()} \u2013 \u00a3${parsed.quantumAnalysis.high.toLocaleString()}`
                                                                                            : 'Cannot assess from available documents'}
                                                                                    </p>
                                                                                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{parsed.quantumAnalysis.basis}</p>
                                                                                </div>
                                                                            )}

                                                                            {/* Procedural + Uncertainties */}
                                                                            {parsed.proceduralConsiderations?.length > 0 && (
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.125rem' }}>Procedural Considerations</p>
                                                                                    <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                        {parsed.proceduralConsiderations.map((p, j) => <li key={j}>{p}</li>)}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                            {parsed.keyUncertainties?.length > 0 && (
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '0.125rem' }}>Key Uncertainties</p>
                                                                                    <ul style={{ paddingLeft: '1rem', fontSize: '0.78rem', margin: 0 }}>
                                                                                        {parsed.keyUncertainties.map((u, j) => <li key={j}>{u}</li>)}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                            } catch { /* fall through to plain text */ }
                                                        }
                                                        // Non-merits or failed parse: show formatted text
                                                        return (
                                                            <pre style={{
                                                                fontSize: '0.8rem',
                                                                lineHeight: 1.6,
                                                                color: '#334155',
                                                                whiteSpace: 'pre-wrap',
                                                                fontFamily: 'var(--font-body, inherit)',
                                                                margin: 0,
                                                                maxHeight: 400,
                                                                overflowY: 'auto',
                                                            }}>
                                                                {entry.response}
                                                            </pre>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#475569' }}>
                                                    {entry.summary || entry.response.slice(0, 200) + '...'}
                                                </p>
                                            )}
                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                <span>{entry.model}</span>
                                                <span>{entry.inputTokens + entry.outputTokens} tokens</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <Link to="/ai-review" style={{ fontSize: '0.8rem', fontWeight: 500 }}>View full analysis</Link>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                <p>No AI analysis has been run for this case yet.</p>
                                <Link to="/ai-review" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Run Case Analysis</Link>
                            </div>
                        )}
                    </div>

                    {/* Complexity Triggers */}
                    {currentCase.complexity_triggers.length > 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'var(--color-warning)' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-warning)' }}>
                                Complexity Triggers
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

    // No case selected — show case list and create form
    return (
        <div className="page" style={{ maxWidth: 700 }}>
            <div className="page-header">
                <h1>My Cases</h1>
                <p>Create a new case or select an existing one to continue working.</p>
            </div>

            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: '0.85rem', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            {/* Create new case */}
            {!showCreate ? (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginBottom: 'var(--space-5)' }}>
                    + New Case
                </button>
            ) : (
                <div className="card" style={{ marginBottom: 'var(--space-5)', border: '1px solid var(--accent)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Create New Case</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {/* Role selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-1)', color: 'var(--text-muted)' }}>
                                You are the…
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button
                                    type="button"
                                    className={`btn ${newRole === 'claimant' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setNewRole('claimant')}
                                    style={{ flex: 1 }}
                                >
                                    Claimant
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${newRole === 'defendant' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setNewRole('defendant')}
                                    style={{ flex: 1 }}
                                >
                                    Defendant
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-1)', color: 'var(--text-muted)' }}>
                                Case name
                            </label>
                            <input
                                className="input"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Smith v Jones Builders"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-1)', color: 'var(--text-muted)' }}>
                                    Claimant{newRole === 'claimant' ? ' (you)' : ''}
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    value={newClaimant}
                                    onChange={(e) => setNewClaimant(e.target.value)}
                                    placeholder={newRole === 'claimant' ? 'Your full name' : 'Claimant name'}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-1)', color: 'var(--text-muted)' }}>
                                    Defendant{newRole === 'defendant' ? ' (you)' : ''}
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    value={newDefendant}
                                    onChange={(e) => setNewDefendant(e.target.value)}
                                    placeholder={newRole === 'defendant' ? 'Your name or company' : 'Person or company name'}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                        {createError && (
                            <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>{createError}</div>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                                {loading ? 'Creating…' : 'Create Case'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setCreateError(null); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Case list */}
            {loading && cases.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    Loading cases…
                </div>
            ) : cases.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.9rem' }}>No cases yet. Create your first case above to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div className="section-label">Your Cases ({cases.length})</div>
                    {cases.map((c) => (
                        <button
                            key={c.name}
                            className="card card-interactive"
                            onClick={() => selectCase(c.name)}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {c.claimant_name} v {c.defendant_name}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                <span className="badge badge-grey" style={{ textTransform: 'capitalize' }}>
                                    {c.status.replace('_', ' ')}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
