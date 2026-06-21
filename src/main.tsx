import React, { Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{
          minHeight: '100vh',
          background: '#f0f4f8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          padding: '2rem',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '640px',
            width: '100%',
          }}>
            <p style={{ color: '#d9293d', fontWeight: 700, marginBottom: '0.5rem' }}>
              ⚠ Application Error
            </p>
            <p style={{ color: '#0d1f2d', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {err.message}
            </p>
            <pre style={{
              background: '#f0f4f8',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.75rem',
              color: '#6a8fa8',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {err.stack}
            </pre>
            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#6a8fa8' }}>
              <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL ?? '❌ NOT SET'}</p>
              <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ set' : '❌ NOT SET'}</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);