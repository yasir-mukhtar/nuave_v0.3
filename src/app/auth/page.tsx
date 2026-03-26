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
    const nextParam = new URLSearchParams(window.location.search).get('next');
    let callbackUrl = `${window.location.origin}/auth/callback`;

    if (nextParam) {
      try {
        const nextUrl = new URL(nextParam, window.location.origin);
        const pkg = nextUrl.searchParams.get('package');
        if (pkg) callbackUrl += `?package=${pkg}`;
      } catch (e) {
        console.error("Error parsing next param:", e);
      }
    } else {
      const pkg = sessionStorage.getItem('nuave_pending_package');
      const brand = sessionStorage.getItem('nuave_pending_brand');

      if (pkg) callbackUrl += `?package=${pkg}`;
      else if (brand) callbackUrl += `?brand=${encodeURIComponent(brand)}`;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) console.error(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-6">
      <style>{`
        .btn-google {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; height: 44px; background: #FFFFFF;
          border: 1px solid #E5E7EB; border-radius: var(--radius-md);
          font-size: 15px; font-weight: 500; color: #111827;
          cursor: pointer; transition: all 150ms ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-google:hover { background: #F9FAFB; border-color: #D1D5DB; }
      `}</style>

      <div className="card max-w-[400px] w-full px-8 py-10 text-center flex flex-col gap-6">
        {/* Logo */}
        <Link href="/" className="flex flex-row gap-2 items-center justify-center no-underline">
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" className="block" />
          <span className="text-[18px] font-bold text-text-heading">Nuave</span>
        </Link>

        {/* Content */}
        <div className="flex flex-col gap-2 items-center">
          {context === 'upgrade' && (
            <>
              <h1 className="text-[22px] m-0 mb-2 text-center">Aktifkan paket Anda</h1>
              {pendingPackage && (
                <div className="inline-flex items-center gap-1.5 bg-[var(--purple-light)] border border-[#C4B5FD] rounded-full px-3.5 py-1 type-caption font-medium text-brand mb-3">
                  Paket dipilih: {pendingPackage.charAt(0).toUpperCase() + pendingPackage.slice(1)}
                </div>
              )}
              <p className="type-body text-text-muted text-center m-0 mb-6">
                Masuk untuk melanjutkan ke pembayaran.
              </p>
            </>
          )}

          {context === 'audit' && (
            <>
              <h1 className="text-[22px] m-0 mb-2 text-center">Lanjutkan audit gratis kamu</h1>
              {pendingBrand && (
                <div className="inline-flex items-center gap-1.5 bg-[var(--purple-light)] border border-[#C4B5FD] rounded-full px-3.5 py-1 type-caption font-medium text-brand mb-3">
                  Mengaudit: {pendingBrand}
                </div>
              )}
              <p className="type-body text-text-muted text-center m-0 mb-6">
                Masuk untuk melihat visibility score brand kamu.
              </p>
            </>
          )}

          {context === 'default' && (
            <>
              <h1 className="text-[22px] m-0 mb-2 text-center">Masuk ke Nuave</h1>
              <p className="type-body text-text-muted text-center m-0 mb-6">
                Kelola audit AI dan visibilitas brand kamu.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button onClick={handleGoogleSignIn} className="btn-google">
            <img src="/google-icon.svg" width={18} height={18} alt="Google" />
            Lanjutkan dengan Google
          </button>

          <p className="type-caption text-text-muted leading-snug m-0">
            Dengan melanjutkan, Anda menyetujui{' '}
            <Link href="/terms" className="text-text-body underline">Syarat & Ketentuan</Link> dan{' '}
            <Link href="/privacy" className="text-text-body underline">Kebijakan Privasi</Link> kami.
          </p>
        </div>
      </div>
    </div>
  );
}
