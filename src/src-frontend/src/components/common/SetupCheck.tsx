import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DependencyStatus {
    name: string;
    installed: boolean;
    version: string | null;
    required: boolean;
    install_url: string;
    description: string;
}

export default function SetupCheck() {
    const [missing, setMissing] = useState<DependencyStatus[]>([]);
    const [dismissed, setDismissed] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Only check once per session
        if (sessionStorage.getItem('casekit_deps_checked')) {
            setChecked(true);
            return;
        }

        invoke<DependencyStatus[]>('check_dependencies')
            .then((deps) => {
                const notInstalled = deps.filter((d) => !d.installed);
                setMissing(notInstalled);
                setChecked(true);
                sessionStorage.setItem('casekit_deps_checked', '1');
            })
            .catch(() => {
                setChecked(true);
            });
    }, []);

    if (!checked || missing.length === 0 || dismissed) return null;

    return (
        <div
            style={{
                background: '#fef3c7',
                borderBottom: '1px solid #f59e0b',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: '#92400e',
                lineHeight: 1.5,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <strong style={{ fontSize: '0.85rem' }}>⚙ Optional setup needed</strong>
                    {missing.map((dep) => (
                        <div key={dep.name} style={{ marginTop: '0.375rem' }}>
                            <strong>{dep.name}</strong> is not installed — {dep.description.toLowerCase()}.
                            {' '}
                            <a
                                href={dep.install_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#92400e', fontWeight: 600, textDecoration: 'underline' }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Use Tauri's opener plugin to open URLs
                                    import('@tauri-apps/plugin-opener').then((mod) => {
                                        mod.openUrl(dep.install_url);
                                    });
                                }}
                            >
                                Download & install →
                            </a>
                            <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.125rem' }}>
                                After installing, restart CaseKit to enable full OCR support for scanned documents.
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        color: '#92400e',
                        padding: '0',
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                    title="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
