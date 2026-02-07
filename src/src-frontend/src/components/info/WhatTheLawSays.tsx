import { Link } from 'react-router-dom';

export default function WhatTheLawSays() {
    return (
        <div className="page" style={{ maxWidth: '48rem' }}>
            <div className="page-header">
                <h1>What the Law Says</h1>
                <p>
                    Key provisions of the Consumer Rights Act 2015 relevant to consumer disputes.
                    This is a factual summary, not legal advice.
                </p>
            </div>

            <div className="info-block">
                <h3>Goods (physical products)</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    Under CRA 2015, goods must be:
                </p>
                <ul>
                    <li><strong>Of satisfactory quality</strong> (s.9) — including fitness for purpose, appearance, durability, safety, and freedom from minor defects</li>
                    <li><strong>Fit for a particular purpose</strong> (s.10) — if you told the seller what you needed it for</li>
                    <li><strong>As described</strong> (s.11) — matching any description given before purchase</li>
                    <li><strong>Matching a sample or model</strong> (s.13–14) — if you decided to buy based on one</li>
                </ul>
                <div className="citation">
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        Consumer Rights Act 2015, Part 1, Chapter 2 (ss.9–18).
                        These rights cannot be excluded or restricted by the trader.
                    </p>
                </div>
            </div>

            <div className="info-block">
                <h3>Services</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    Under CRA 2015, services must be:
                </p>
                <ul>
                    <li><strong>Performed with reasonable care and skill</strong> (s.49)</li>
                    <li><strong>Performed for a reasonable price</strong> (s.51) — if no price was agreed</li>
                    <li><strong>Performed within a reasonable time</strong> (s.52) — if no time was agreed</li>
                    <li><strong>In accordance with information provided</strong> (s.50) — what you were told before agreeing</li>
                </ul>
                <div className="citation">
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        Consumer Rights Act 2015, Part 1, Chapter 4 (ss.48–57).
                    </p>
                </div>
            </div>

            <div className="info-block">
                <h3>Digital content</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    Digital content (software, downloads, streaming) must be:
                </p>
                <ul>
                    <li><strong>Of satisfactory quality</strong> (s.34)</li>
                    <li><strong>Fit for a particular purpose</strong> (s.35)</li>
                    <li><strong>As described</strong> (s.36)</li>
                </ul>
                <div className="citation">
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        Consumer Rights Act 2015, Part 1, Chapter 3 (ss.33–47).
                    </p>
                </div>
            </div>

            <div className="info-block">
                <h3>Remedies timeline</h3>
                <ul>
                    <li><strong>First 30 days</strong> — short-term right to reject (full refund for goods)</li>
                    <li><strong>After 30 days, within 6 months</strong> — right to repair or replacement; if that fails, right to price reduction or final right to reject</li>
                    <li><strong>After 6 months</strong> — burden shifts to consumer to prove the fault was present at delivery</li>
                    <li><strong>Limitation period</strong> — generally 6 years from breach (Limitation Act 1980, s.5)</li>
                </ul>
                <div className="citation">
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        CRA 2015, ss.20–24 (goods); ss.42–46 (digital content); Limitation Act 1980, s.5.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-5) 0', flexWrap: 'wrap' }}>
                <Link to="/procedure" className="btn btn-primary">
                    View the Step-by-Step Guide
                </Link>
                <Link to="/templates" className="btn btn-secondary">
                    Browse Letter Templates
                </Link>
            </div>
        </div>
    );
}
