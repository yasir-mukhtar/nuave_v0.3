'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [context, setContext] = useState<'audit' | 'upgrade' | 'default'>('default');
  const [pendingBrand, setPendingBrand] = useState('');
  const [pendingPackage, setPendingPackage] = useState('');
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const brand = sessionStorage.getItem('nuave_pending_brand');
    const pkg = sessionStorage.getItem('nuave_pending_package');
    if (pkg) {
      setPendingPackage(pkg);
      setContext('upgrade');
    } else if (brand) {
      setPendingBrand(brand);
      setContext('audit');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    const pkg = sessionStorage.getItem('nuave_pending_package');
    const brand = sessionStorage.getItem('nuave_pending_brand');
    
    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (pkg) callbackUrl += `?package=${pkg}`;
    else if (brand) callbackUrl += `?brand=${encodeURIComponent(brand)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {context === 'upgrade' && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px 0', textAlign: 'center' }}>
                Aktifkan paket Anda
              </h1>
              {pendingPackage && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--purple-light)', border: '1px solid #C4B5FD',
                  borderRadius: '999px', padding: '4px 14px',
                  fontSize: '12px', fontWeight: 500, color: 'var(--purple)',
                  marginBottom: '12px',
                }}>
                  Paket dipilih: {pendingPackage.charAt(0).toUpperCase() + pendingPackage.slice(1)}
                </div>
              )}
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 24px 0' }}>
                Masuk untuk melanjutkan pembayaran.
              </p>
            </>
          )}

          {context === 'audit' && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px 0', textAlign: 'center' }}>
                Lanjutkan audit gratis Anda
              </h1>
              {pendingBrand && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--purple-light)', border: '1px solid #C4B5FD',
                  borderRadius: '999px', padding: '4px 14px',
                  fontSize: '12px', fontWeight: 500, color: 'var(--purple)',
                  marginBottom: '12px',
                }}>
                  Mengaudit: {pendingBrand}
                </div>
              )}
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 24px 0' }}>
                Masuk untuk melihat skor visibilitas AI merek Anda.
              </p>
            </>
          )}

          {context === 'default' && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 8px 0', textAlign: 'center' }}>
                Masuk ke Nuave
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 24px 0' }}>
                Kelola audit AI dan visibilitas merek Anda.
              </p>
            </>
          )}
        </div>

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
