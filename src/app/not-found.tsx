import Link from 'next/link'

export default function NotFound() {
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
          {/* 404 badge */}
          <div className="flex items-center gap-2.5 mb-16">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-[#533AFD] shrink-0" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.4px',
              color: '#533AFD',
              lineHeight: 1,
            }}>
              404
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ margin: 0, marginBottom: '4px', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'var(--font-geist-sans), Geist, sans-serif',
              fontSize: '40px',
              fontWeight: 500,
              letterSpacing: '-1.6px',
              color: '#111827',
            }}>
              Maaf
            </span>
            <span style={{ fontSize: '34px', marginLeft: '8px' }}>🙏🏻</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 400,
            color: '#6B7280',
            margin: 0,
            lineHeight: 1.4,
          }}>
            Halaman yang Anda cari tidak ditemukan.
          </p>

          {/* Button */}
          <Link
            href="/"
            className="flex items-center justify-center w-full bg-[#111827] text-white rounded-[10px] px-4 py-3 mt-10 hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
          >
            Ke halaman utama
          </Link>
        </div>
      </div>

      {/* ── Desktop layout (>= md) ── */}
      <div className="min-h-screen bg-white hidden md:flex items-center justify-center">
        <div className="flex items-start gap-16">

          {/* 404 badge — aligned to top of heading */}
          <div className="flex items-center gap-2.5 pt-2">
            <div className="dot-blink w-2 h-2 rounded-[2px] bg-[#533AFD] shrink-0" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.48px',
              color: '#533AFD',
              lineHeight: 1,
            }}>
              404
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col">
            <h1 style={{ margin: 0, marginBottom: '6px', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-geist-sans), Geist, sans-serif',
                fontSize: '48px',
                fontWeight: 500,
                letterSpacing: '-1.92px',
                color: '#111827',
              }}>
                Maaf
              </span>
              <span style={{ fontSize: '40px', marginLeft: '10px' }}>🙏🏻</span>
            </h1>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#6B7280',
              margin: 0,
            }}>
              Halaman yang Anda cari tidak ditemukan.
            </p>

            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#111827] text-white rounded-[8px] px-5 py-3 w-fit mt-10 hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
            >
              Ke halaman utama
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
