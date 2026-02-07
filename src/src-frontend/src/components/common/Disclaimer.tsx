export default function Disclaimer() {
    return (
        <div
            role="status"
            aria-label="Legal disclaimer"
            style={{
                background: 'var(--color-bg-disclaimer)',
                borderBottom: '1px solid #f6e05e',
                padding: '0.375rem 1rem',
                fontSize: '0.75rem',
                color: '#744210',
                textAlign: 'center',
                flexShrink: 0,
                fontWeight: 500,
            }}
        >
            CaseKit is a self-help organisational tool. It does not provide legal advice. You are responsible for all decisions regarding your case.
        </div>
    );
}
