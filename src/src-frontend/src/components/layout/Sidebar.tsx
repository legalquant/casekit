import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCaseStore } from '../../hooks/useCase';

const NAV_SECTIONS_INFO = [
    { to: '/', label: 'Home' },
    { to: '/read-this-first', label: 'Read This First', highlight: true },
    { to: '/procedure', label: 'Procedural Outline' },
    { to: '/links', label: 'Useful Links' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/technical', label: 'Technical Overview' },
    { to: '/risks', label: 'Risks of Litigation' },
    { to: '/help', label: 'Find Help' },
];

const NAV_SECTIONS_CASE = [
    { to: '/cases', label: 'Case Overview', alwaysEnabled: true },
    { to: '/documents', label: 'Documents' },
    { to: '/how-to-save-emails', label: 'How to Save Emails', alwaysEnabled: true },
    { to: '/chronology', label: 'Chronology' },
    { to: '/ai-review', label: 'AI Drafting' },
    { to: '/templates', label: 'Templates & Forms', alwaysEnabled: true },
    { to: '/export', label: 'Export Bundle' },
];

const NAV_SECTIONS_RESEARCH = [
    { to: '/citation-audit', label: 'Citation Audit' },
];

const NAV_SECTIONS_AI = [
    { to: '/your-data', label: 'Your Data & AI' },
    { to: '/api-setup', label: 'API Key Setup' },
];

export default function Sidebar() {
    const cases = useCaseStore((s) => s.cases);
    const currentCase = useCaseStore((s) => s.currentCase);
    const selectCase = useCaseStore((s) => s.selectCase);
    const clearCurrentCase = useCaseStore((s) => s.clearCurrentCase);
    const navigate = useNavigate();
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);

    const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (name) {
            selectCase(name);
        }
    };

    const handleNewCase = () => {
        clearCurrentCase();
        navigate('/cases?new=1');
    };

    const linkStyle = (isActive: boolean, to: string, options?: { highlight?: boolean; disabled?: boolean }) => ({
        display: 'block' as const,
        padding: '6px 20px',
        fontSize: '0.8rem',
        fontWeight: isActive ? 500 : 400,
        color: options?.disabled
            ? '#334155'
            : isActive
                ? '#ffffff'
                : options?.highlight
                    ? '#fbbf24'
                    : '#94a3b8',
        background: isActive
            ? 'rgba(14, 165, 152, 0.15)'
            : hoveredLink === to && !options?.disabled
                ? 'rgba(255, 255, 255, 0.04)'
                : 'transparent',
        borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        textDecoration: 'none' as const,
        transition: 'all 0.1s ease',
        lineHeight: 1.6,
        opacity: options?.disabled ? 0.35 : 1,
        cursor: options?.disabled ? 'default' : 'pointer',
        pointerEvents: options?.disabled ? 'none' as const : 'auto' as const,
    });

    const sectionHeader = (label: string) => (
        <div
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: '#475569',
                padding: '12px 20px 4px',
            }}
        >
            {label}
        </div>
    );

    return (
        <aside
            style={{
                width: 240,
                flexShrink: 0,
                background: 'var(--bg-sidebar)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflowY: 'auto',
            }}
        >
            {/* Brand */}
            <div
                style={{
                    padding: '24px 20px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src="/casekit-logo.svg"
                        alt="CaseKit"
                        width={44}
                        height={44}
                        style={{ borderRadius: '10px', flexShrink: 0 }}
                    />
                    <div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                            CaseKit
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                            Organise, understand, resolve
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '8px 0' }}>
                {/* Information section */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('Information')}
                    {NAV_SECTIONS_INFO.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            style={({ isActive }) => linkStyle(isActive, item.to, { highlight: item.highlight })}
                            onMouseEnter={() => setHoveredLink(item.to)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* My Cases section — with case selector */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('My Cases')}

                    {/* Case selector dropdown + New button */}
                    <div style={{ padding: '4px 16px 8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                            value={currentCase?.name || ''}
                            onChange={handleCaseChange}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '5px 8px',
                                fontSize: '0.75rem',
                                background: '#1e293b',
                                color: currentCase ? '#e2e8f0' : '#64748b',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="" disabled>
                                {cases.length === 0 ? 'No cases yet' : 'Select a case\u2026'}
                            </option>
                            {cases.map((c) => (
                                <option key={c.name} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleNewCase}
                            title="Create new case"
                            style={{
                                flexShrink: 0,
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'var(--accent)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                lineHeight: 1.4,
                            }}
                        >
                            + New
                        </button>
                    </div>

                    {NAV_SECTIONS_CASE.map((item) => {
                        const needsCase = !item.alwaysEnabled;
                        const disabled = needsCase && !currentCase;
                        return disabled ? (
                            <span
                                key={item.to}
                                style={linkStyle(false, item.to, { disabled: true })}
                                title="Select a case first"
                            >
                                {item.label}
                            </span>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/cases'}
                                style={({ isActive }) => linkStyle(isActive, item.to)}
                                onMouseEnter={() => setHoveredLink(item.to)}
                                onMouseLeave={() => setHoveredLink(null)}
                            >
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Legal Research section */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('Legal Research')}
                    {NAV_SECTIONS_RESEARCH.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => linkStyle(isActive, item.to)}
                            onMouseEnter={() => setHoveredLink(item.to)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* AI Tools section */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('AI Tools')}
                    {NAV_SECTIONS_AI.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => linkStyle(isActive, item.to)}
                            onMouseEnter={() => setHoveredLink(item.to)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div
                style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.75rem',
                    color: '#475569',
                    lineHeight: 1.5,
                }}
            >
                <div>Not legal advice. For information only.</div>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Built by</span>
                    <a
                        href="https://github.com/legalquant"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#14b8a6', textDecoration: 'none' }}
                    >
                        AnonLQ
                    </a>
                </div>
            </div>
        </aside>
    );
}
