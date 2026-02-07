import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Disclaimer banner */}
                <div className="disclaimer-banner" role="status" aria-label="Legal disclaimer">
                    CaseKit is a self-help organisational tool, not a legal advice service.{' '}
                    <Link to="/read-this-first">Read This First</Link>
                </div>
                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
