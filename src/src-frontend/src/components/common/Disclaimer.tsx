import { Link } from 'react-router-dom';

export default function Disclaimer() {
    return (
        <div
            role="status"
            aria-label="Legal disclaimer"
            style={{
                background: 'var(--disclaimer-bg)',
                borderBottom: '1px solid #f6e05e',
                padding: '0.375rem 1rem',
                fontSize: '0.75rem',
                color: '#744210',
                textAlign: 'center',
                flexShrink: 0,
                fontWeight: 500,
            }}
        >
            CaseKit is a self-help organisational tool, not a legal advice service.{' '}
            <Link to="/read-this-first" style={{ color: '#92400e', fontWeight: 600, textDecoration: 'underline' }}>Read This First</Link>
        </div>
    );
}

