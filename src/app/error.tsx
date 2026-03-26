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
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .dot-blink { animation: blink 1s ease-in-out infinite; }
      `}</style>

      {/* ── Mobile layout (< md) ── */}
      <div className="min-h-screen bg-white flex md:hidden flex-col px-6 pt-24">
        <div className="max-w-[360px]">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-error shrink-0" />
            <span className="text-[20px] font-semibold tracking-[-0.4px] text-error leading-none">
              Error
            </span>
          </div>

          <h1 className="m-0 mb-1 leading-none">
            <span className="text-[40px] font-medium tracking-[-1.6px] text-text-heading">Waduh</span>
          </h1>

          <p className="text-[18px] font-normal text-text-muted m-0 leading-snug">
            Terjadi kesalahan. Silakan coba lagi.
          </p>

          <button
            onClick={reset}
            className="flex items-center justify-center w-full bg-[#111827] text-white rounded-[10px] px-4 py-3 mt-10 hover:opacity-90 transition-opacity cursor-pointer border-none type-body font-medium"
          >
            Coba lagi
          </button>
        </div>
      </div>

      {/* ── Desktop layout (>= md) ── */}
      <div className="min-h-screen bg-white hidden md:flex items-center justify-center">
        <div className="flex items-start gap-16">
          <div className="flex items-center gap-2.5 pt-2">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-error shrink-0" />
            <span className="text-[24px] font-semibold tracking-[-0.48px] text-error leading-none">
              Error
            </span>
          </div>

          <div className="flex flex-col">
            <h1 className="m-0 mb-1.5 leading-none">
              <span className="text-[48px] font-medium tracking-[-1.92px] text-text-heading">Waduh</span>
            </h1>

            <p className="text-[20px] font-normal text-text-muted m-0">
              Terjadi kesalahan. Silakan coba lagi.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center justify-center bg-[#111827] text-white rounded-[8px] px-5 py-3 w-fit mt-10 hover:opacity-90 transition-opacity cursor-pointer border-none type-body font-medium"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
