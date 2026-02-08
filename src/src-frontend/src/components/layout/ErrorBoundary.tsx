import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    maxWidth: '40rem',
                    margin: '0 auto',
                    textAlign: 'center',
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>
                        An unexpected error occurred. Your data is safe. Try navigating to another page
                        using the sidebar, or reload the application.
                    </p>
                    <details style={{
                        fontSize: '0.75rem', color: '#94a3b8', width: '100%',
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: '0.375rem', padding: '0.75rem', textAlign: 'left',
                    }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                            Error details
                        </summary>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                            {this.state.error?.message}
                            {'\n\n'}
                            {this.state.error?.stack}
                        </pre>
                    </details>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.hash = '/';
                            window.location.reload();
                        }}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: '#0d9488',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
