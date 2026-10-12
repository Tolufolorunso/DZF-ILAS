'use client';

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Global Layout Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#0b1d2e',
          color: '#ffffff',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '90%',
            backgroundColor: '#ffffff',
            color: '#171717',
            borderRadius: '12px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0b1d2e',
              margin: '0 0 12px 0',
            }}
          >
            Critical Application Error
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}
          >
            {error.message ||
              'A critical error interrupted the application layout. Please refresh or return to the system homepage.'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#6f1111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh Application
            </button>
            <a
              href="/"
              style={{
                backgroundColor: '#17324d',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
