import { NavLink } from 'react-router-dom';

const NAV_SECTIONS = [
    {
        label: 'Information',
        items: [
            { to: '/', label: 'Home' },
            { to: '/read-this-first', label: 'Read This First', highlight: true },
            { to: '/procedure', label: 'Step-by-Step Guide' },
            { to: '/links', label: 'Useful Links' },
            { to: '/pricing', label: 'Pricing' },
            { to: '/technical', label: 'Technical Overview' },
            { to: '/risks', label: 'Risks of Litigation' },
            { to: '/help', label: 'Find Help' },
        ],
    },
    {
        label: 'My Cases',
        items: [
            { to: '/cases', label: 'Case Overview' },
            { to: '/documents', label: 'Documents' },
            { to: '/how-to-save-emails', label: 'How to Save Emails' },
            { to: '/chronology', label: 'Chronology' },
            { to: '/templates', label: 'Letter Templates' },
            { to: '/export', label: 'Export Bundle' },
        ],
    },
    {
        label: 'AI Tools',
        items: [
            { to: '/your-data', label: 'Your Data & AI' },
            { to: '/api-setup', label: 'API Key Setup' },
            { to: '/ai-review', label: 'Case Review' },
        ],
    },
];

export default function Sidebar() {
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
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label} style={{ marginBottom: '4px' }}>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#475569',
                                padding: '12px 20px 4px',
                            }}
                        >
                            {section.label}
                        </div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                style={({ isActive }) => ({
                                    display: 'block',
                                    padding: '6px 20px',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 500 : 400,
                                    color: isActive
                                        ? '#ffffff'
                                        : 'highlight' in item && item.highlight
                                            ? '#fbbf24'
                                            : '#94a3b8',
                                    background: isActive ? 'rgba(14, 165, 152, 0.15)' : 'transparent',
                                    borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'all 0.1s ease',
                                    lineHeight: 1.6,
                                })}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
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
