'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .dot-blink {
          animation: blink 1s ease-in-out infinite;
        }
      `}</style>

      {/* ── Mobile layout (< md) ── */}
      <div className="min-h-screen bg-white flex md:hidden flex-col px-6 pt-24">
        <div className="max-w-[360px]">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-[#EF4444] shrink-0" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.4px',
              color: '#EF4444',
              lineHeight: 1,
            }}>
              Error
            </span>
          </div>

          <h1 style={{ margin: 0, marginBottom: '4px', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'var(--font-geist-sans), Geist, sans-serif',
              fontSize: '40px',
              fontWeight: 500,
              letterSpacing: '-1.6px',
              color: '#111827',
            }}>
              Oops
            </span>
          </h1>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#6B7280',
            margin: 0,
            lineHeight: 1.4,
          }}>
            Terjadi kesalahan. Silakan coba lagi.
          </p>

          <button
            onClick={reset}
            className="flex items-center justify-center w-full bg-[#111827] text-white rounded-[10px] px-4 py-3 mt-10 hover:opacity-90 transition-opacity cursor-pointer border-none"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
          >
            Coba lagi
          </button>
        </div>
      </div>

      {/* ── Desktop layout (>= md) ── */}
      <div className="min-h-screen bg-white hidden md:flex items-center justify-center">
        <div className="flex items-start gap-16">
          <div className="flex items-center gap-2.5 pt-2">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-[#EF4444] shrink-0" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.48px',
              color: '#EF4444',
              lineHeight: 1,
            }}>
              Error
            </span>
          </div>

          <div className="flex flex-col">
            <h1 style={{ margin: 0, marginBottom: '6px', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-geist-sans), Geist, sans-serif',
                fontSize: '48px',
                fontWeight: 500,
                letterSpacing: '-1.92px',
                color: '#111827',
              }}>
                Oops
              </span>
            </h1>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#6B7280',
              margin: 0,
            }}>
              Terjadi kesalahan. Silakan coba lagi.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center justify-center bg-[#111827] text-white rounded-[8px] px-5 py-3 w-fit mt-10 hover:opacity-90 transition-opacity cursor-pointer border-none"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
