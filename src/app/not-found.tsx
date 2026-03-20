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
      <div className="min-h-screen bg-white flex md:hidden flex-col px-8 pt-32">
        <div className="flex flex-col justify-between h-[340px]">

          {/* 404 badge */}
          <div className="flex items-center gap-[10px]">
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

          {/* Content + button */}
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-[2px]">
              <h1 style={{ margin: 0, lineHeight: 1 }}>
                <span style={{
                  fontFamily: 'Geist, GeistSans, sans-serif',
                  fontSize: '48px',
                  fontWeight: 500,
                  letterSpacing: '-1.92px',
                  color: '#111827',
                }}>
                  Maaf&nbsp;&nbsp;
                </span>
                <span style={{ fontSize: '40px' }}>🙏🏻</span>
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
            </div>

            <Link
              href="/"
              className="flex items-center justify-center w-full bg-[#111827] text-white rounded-[6px] px-[14px] py-[12px] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
            >
              Ke halaman utama
            </Link>
          </div>
        </div>
      </div>

      {/* ── Desktop layout (≥ md) ── */}
      <div className="min-h-screen bg-white hidden md:flex items-center justify-center">
        <div className="flex items-start gap-16">

          {/* 404 badge */}
          <div className="flex items-center gap-[10px] pt-3">
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

          {/* Content + button */}
          <div className="flex flex-col">
            <h1 style={{ margin: 0, marginBottom: '20px', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'Geist, GeistSans, sans-serif',
                fontSize: '48px',
                fontWeight: 500,
                letterSpacing: '-1.92px',
                color: '#111827',
              }}>
                Maaf&nbsp;&nbsp;
              </span>
              <span style={{ fontSize: '40px' }}>🙏🏻</span>
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#6B7280',
              margin: 0,
              marginBottom: '72px',
            }}>
              Halaman yang Anda cari tidak ditemukan.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#111827] text-white rounded-[6px] px-[14px] py-[12px] w-fit hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
            >
              Ke halaman utama
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
