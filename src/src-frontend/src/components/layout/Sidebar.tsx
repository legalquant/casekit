import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
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
    { to: '/cases', label: 'Case Overview' },
    { to: '/documents', label: 'Documents' },
    { to: '/how-to-save-emails', label: 'How to Save Emails' },
    { to: '/chronology', label: 'Chronology' },
    { to: '/templates', label: 'Templates & Forms' },
    { to: '/export', label: 'Export Bundle' },
];

const NAV_SECTIONS_RESEARCH = [
    { to: '/citation-audit', label: 'Citation Audit' },
];

const NAV_SECTIONS_AI = [
    { to: '/your-data', label: 'Your Data & AI' },
    { to: '/api-setup', label: 'API Key Setup' },
    { to: '/ai-review', label: 'AI Drafting' },
];

export default function Sidebar() {
    const cases = useCaseStore((s) => s.cases);
    const currentCase = useCaseStore((s) => s.currentCase);
    const selectCase = useCaseStore((s) => s.selectCase);
    const loadCases = useCaseStore((s) => s.loadCases);

    useEffect(() => {
        loadCases();
    }, []);

    const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        if (name) {
            selectCase(name);
        }
    };

    const linkStyle = (isActive: boolean, highlight?: boolean) => ({
        display: 'block' as const,
        padding: '6px 20px',
        fontSize: '0.8rem',
        fontWeight: isActive ? 500 : 400,
        color: isActive ? '#ffffff' : highlight ? '#fbbf24' : '#94a3b8',
        background: isActive ? 'rgba(14, 165, 152, 0.15)' : 'transparent',
        borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        textDecoration: 'none' as const,
        transition: 'all 0.1s ease',
        lineHeight: 1.6,
    });

    const sectionHeader = (label: string) => (
        <div
            style={{
                fontSize: '0.6rem',
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
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="3" width="20" height="18" rx="2" stroke="#14b8a6" strokeWidth="1.5" />
                        <path d="M7 8h10M7 12h6M7 16h8" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                            CaseKit
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    Organise, understand, resolve
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
                            style={({ isActive }) => linkStyle(isActive, item.highlight)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* My Cases section — with case selector */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('My Cases')}

                    {/* Case selector dropdown */}
                    <div style={{ padding: '4px 16px 8px' }}>
                        <select
                            value={currentCase?.name || ''}
                            onChange={handleCaseChange}
                            style={{
                                width: '100%',
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
                                {cases.length === 0 ? 'No cases yet' : 'Select a case…'}
                            </option>
                            {cases.map((c) => (
                                <option key={c.name} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {NAV_SECTIONS_CASE.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/cases'}
                            style={({ isActive }) => linkStyle(isActive)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Legal Research section */}
                <div style={{ marginBottom: '4px' }}>
                    {sectionHeader('Legal Research')}
                    {NAV_SECTIONS_RESEARCH.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => linkStyle(isActive)}
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
                            style={({ isActive }) => linkStyle(isActive)}
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
                    fontSize: '0.6rem',
                    color: '#475569',
                    lineHeight: 1.5,
                }}
            >
                Not legal advice. For information only.
            </div>
        </aside>
    );
}
