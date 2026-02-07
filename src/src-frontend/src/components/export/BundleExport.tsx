export default function BundleExport() {
    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Bundle Export
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Export your case documents in a court-bundle-ready structure following CPR PD 32.
            </p>

            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Bundle export is available once you have uploaded documents to your case.
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    The exported zip will contain sections for: Claim, Defence, Orders, Correspondence, and Evidence.
                </p>
            </div>
        </div>
    );
}
