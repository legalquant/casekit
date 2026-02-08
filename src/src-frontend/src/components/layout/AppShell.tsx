import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import SetupCheck from '../common/SetupCheck';
import ErrorBoundary from './ErrorBoundary';
import { useCaseStore } from '../../hooks/useCase';

export default function AppShell() {
    const loadCases = useCaseStore((s) => s.loadCases);
    const [disclaimerDismissed, setDisclaimerDismissed] = useState(
        () => sessionStorage.getItem('casekit_disclaimer_dismissed') === '1'
    );

    // Single centralised case load for the whole app
    useEffect(() => {
        loadCases();
    }, []);

    const handleDismissDisclaimer = () => {
        setDisclaimerDismissed(true);
        sessionStorage.setItem('casekit_disclaimer_dismissed', '1');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* First-run dependency check */}
                <SetupCheck />
                {/* Disclaimer banner — dismissible per session */}
                {!disclaimerDismissed && (
                    <div
                        className="disclaimer-banner"
                        role="status"
                        aria-label="Legal disclaimer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                    >
                        <span>
                            CaseKit is a self-help organisational tool, not a legal advice service.{' '}
                            <Link to="/read-this-first">Read This First</Link>
                        </span>
                        <button
                            onClick={handleDismissDisclaimer}
                            aria-label="Dismiss disclaimer"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--disclaimer-text)',
                                fontSize: '0.85rem',
                                padding: '0 4px',
                                lineHeight: 1,
                                opacity: 0.7,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
