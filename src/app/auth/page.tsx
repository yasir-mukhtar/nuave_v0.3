'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [pendingBrand, setPendingBrand] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const brand = sessionStorage.getItem('nuave_pending_brand');
    setPendingBrand(brand);
  }, []);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: '24px',
      }}
    >
      <style>{`
        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 44px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          color: #111827;
          cursor: pointer;
          transition: all 150ms ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-google:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }
      `}</style>

      <div
        className="card"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center',
          gap: '24px',
        }}
      >
        {/* Logo */}
        <Link 
          href="/" 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '8px', 
            alignItems: 'center', 
            justifyContent: 'center',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              background: 'var(--purple)',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)' }}>
            Nuave
          </span>
        </Link>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Continue your free audit
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Sign in to run your AI visibility audit and get your free visibility score.
          </p>
        </div>

        {/* Brand Pill */}
        {pendingBrand && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--purple-light)',
              color: 'var(--purple)',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Auditing: {pendingBrand}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <button onClick={handleGoogleSignIn} className="btn-google">
            <img src="/google-icon.svg" width={18} height={18} alt="Google" />
            Continue with Google
          </button>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            By continuing, you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--text-body)', textDecoration: 'underline' }}>Terms of Service</Link> and{' '}
            <Link href="/privacy" style={{ color: 'var(--text-body)', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
