"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

const B = "https://framerusercontent.com/images/";

// ─── Logo SVG logos for marquee ──────────────────────────────────────────────
const LOGOS = [
  { src: `${B}1Qy4nO9eawrvXqYd9ILHfHG5VA.svg?width=98&height=24`, w: 106, h: 26 },
  { src: `${B}PdwCanOeNG0AbS4iruy4sPRfdas.svg?width=92&height=20`, w: 120, h: 26 },
  { src: `${B}qQyt0pI4hotJKK8RE7TMneKyptI.svg?width=94&height=24`, w: 102, h: 26 },
  { src: `${B}5UMspUrrkMvfl7lWs0vuweD8Tyk.svg?width=89&height=24`, w: 97, h: 26 },
  { src: `${B}2WjKGtr45KhKPD7xLIEf4X0qRM.svg?width=110&height=24`, w: 119, h: 26 },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function NuaveHero() {
  return (
    <main>
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <nav className="n-nav">
        <div className="n-nav-inner">
          <Link href="/" className="n-nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4L12 20L20 4" stroke="rgb(108,63,245)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Nuave
          </Link>
          <div className="n-nav-links">
            {["Fitur", "Harga", "FAQ", "Bantuan"].map(l => (
              <a key={l} href="#" className="n-nav-link">{l}</a>
            ))}
          </div>
          <a href="#" className="n-nav-login">Masuk</a>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="n-hero">
        <div className="n-hero-inner">
          <div className="n-hero-content">

            {/* Text block */}
            <div className="n-text-block">
              <div className="n-heading-wrap">
                <h1 className="n-heading">
                  Lihat seberapa sering ChatGPT menyebut brand Anda
                </h1>
              </div>
              <div className="n-sub-wrap">
                <p className="n-sub">
                  Jutaan orang kini melakukan pencarian lewat AI. Nuave melacak brand Anda dalam jawaban ChatGPT dan memberi rekomendasi perbaikan.
                </p>
              </div>
              <div className="n-cta-wrap">
                <Link href="#" className="n-cta">
                  Audit brand Anda — Gratis!
                </Link>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="n-dashboard-section">
              {/* Background image */}
              <div className="n-dashboard-bg">
                <img
                  src={`${B}f6VADZPgYRtolWOOjexOP0Aaw.png?width=2800&height=1600`}
                  alt=""
                  className="n-dashboard-bg-img"
                />
              </div>

              {/* Floating dashboard card */}
              <div className="n-dashboard-float">
                <div className="n-dashboard-card">
                  {/* Tab bar */}
                  <div className="n-tabs">
                    <div className="n-tab">
                      <span className="n-tab-dot" />
                      <span className="n-tab-label">Audit Brand</span>
                    </div>
                    <div className="n-tab">
                      <span className="n-tab-dot" />
                      <span className="n-tab-label">Rekomendasi Konten</span>
                    </div>
                    <div className="n-tab n-tab-active">
                      <span className="n-tab-badge">3</span>
                      <span className="n-tab-label n-tab-label-active">Monitoring Harian</span>
                    </div>
                  </div>

                  {/* Dashboard screenshot */}
                  <div className="n-dashboard-img-wrap">
                    <img
                      src={`${B}pzeNgHOZKXxn6A34yeaLOJicqs0.png?scale-down-to=2048&width=3644&height=2716`}
                      alt="Dashboard"
                      className="n-dashboard-img"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Benefits section ── */}
      <section className="nb-section">
        <div className="nb-inner">
          <h2 className="nb-title">Apakah brand Anda muncul di ChatGPT?</h2>
          <div className="nb-cards">

            {/* Left card */}
            <div className="nb-card">
              <img
                src={`${B}qVUUNgJqqz1AaVQQVnnCPh1PSoQ.png?width=1280&height=960`}
                alt=""
                className="nb-card-bg"
                style={{ objectPosition: "left center" }}
              />
              <div className="nb-card-top">
                <h2 className="nb-card-heading">49% pencarian di ChatGPT meminta panduan dan rekomendasi</h2>
              </div>
              <div className="nb-card-bottom">
                {["Sepatu lari merek lokal terbaik", "Klinik kecantikan terpercaya di Jakarta", "Aplikasi budgeting terbaik untuk orang awam"].map(t => (
                  <span key={t} className="nb-chip">{t}</span>
                ))}
              </div>
            </div>

            {/* Right card */}
            <div className="nb-card">
              <img
                src={`${B}tpVjKAZVOsOUYxZQFyPJd7vVp0E.png?width=1280&height=960`}
                alt=""
                className="nb-card-bg"
                style={{ objectPosition: "right center" }}
              />
              <div className="nb-card-top">
                <h2 className="nb-card-heading">90% klien B2B menggunakan ChatGPT untuk riset pembelian</h2>
              </div>
              <div className="nb-card-bottom">
                {["Jasa digital marketing untuk startup", "Software akuntansi terbaik untuk UMKM", "Vendor cloud storage terpercaya di Indonesia"].map(t => (
                  <span key={t} className="nb-chip">{t}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Logo marquee section ── */}
      <section className="n-marquee-section">
        <div className="n-marquee-inner">
          <p className="n-marquee-text">
            Dikembangkan untuk pencarian berbasis AI — sekarang dan di masa depan
          </p>
          <div className="n-marquee-fade">
            <ul className="n-marquee-track" aria-hidden="true">
              {[...Array(4)].flatMap((_, s) =>
                LOGOS.map((logo, i) => (
                  <li key={`${s}-${i}`} className="n-marquee-logo">
                    <img src={logo.src} alt="Logo" style={{ width: logo.w, height: logo.h, objectFit: "contain" }} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const CSS = `
  /* Nav */
  .n-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgb(247, 247, 245);
  }
  .n-nav-inner {
    max-width: 1260px;
    margin: 0 auto;
    padding: 0 30px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 40px;
  }
  .n-nav-logo {
    font-family: var(--font-geist-sans), sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #0a0a0a;
    text-decoration: none;
    letter-spacing: -0.4px;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .n-nav-links {
    display: flex;
    gap: 32px;
    flex: 1;
    justify-content: center;
  }
  .n-nav-link {
    font-family: var(--font-inter), sans-serif;
    font-size: 15px;
    color: #555;
    text-decoration: none;
  }
  .n-nav-link:hover { color: #0a0a0a; }
  .n-nav-login {
    font-family: var(--font-inter), sans-serif;
    font-size: 15px;
    color: #0a0a0a;
    text-decoration: none;
    margin-left: auto;
  }

  /* Hero */
  .n-hero {
    background-color: rgb(247, 247, 245);
    width: 100%;
  }
  .n-hero-inner {
    max-width: 1260px;
    margin: 0 auto;
    padding: 60px 30px 0;
  }
  .n-hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 102px;
  }

  /* Text block */
  .n-text-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    max-width: 800px;
    width: 100%;
  }
  .n-heading-wrap {
    width: 100%;
  }
  .n-heading {
    font-family: var(--font-geist-sans), "Inter Display", sans-serif;
    font-size: 60px;
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 60px;
    text-align: center;
    color: rgb(10, 10, 10);
    margin: 0;
  }
  .n-sub-wrap {
    max-width: 740px;
    width: 100%;
  }
  .n-sub {
    font-family: var(--font-inter), sans-serif;
    font-size: 18px;
    letter-spacing: -0.5px;
    line-height: 30.6px;
    text-align: center;
    color: rgb(133, 133, 133);
    margin: 0;
  }
  .n-cta-wrap {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  .n-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(108, 63, 245);
    border-radius: 12px;
    padding: 14px 22px;
    color: #fff;
    font-family: var(--font-inter), sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 23.8px;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .n-cta:hover { opacity: 0.88; }

  /* Dashboard section */
  .n-dashboard-section {
    position: relative;
    width: 100%;
    max-width: 1200px;
  }
  .n-dashboard-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 55%;
    border-radius: 16px;
    overflow: hidden;
  }
  .n-dashboard-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 16px;
    display: block;
  }
  .n-dashboard-float {
    position: relative;
    z-index: 1;
    padding: 56px 10% 0;
  }
  .n-dashboard-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 64px;
    max-width: 911px;
    width: 100%;
    margin: 0 auto;
  }

  /* Tabs */
  .n-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #fff;
    border-radius: 100px;
    padding: 8px;
    max-width: 560px;
    width: 100%;
    overflow: hidden;
  }
  .n-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    overflow: hidden;
  }
  .n-tab-dot {
    width: 8px;
    height: 8px;
    border-radius: 100px;
    background: rgba(59, 59, 59, 0.12);
    flex-shrink: 0;
  }
  .n-tab-badge {
    width: 24px;
    height: 24px;
    border-radius: 100px;
    background: rgb(10, 10, 10);
    color: #fff;
    font-family: var(--font-geist-sans), "Inter Display", sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .n-tab-label {
    font-family: var(--font-inter), sans-serif;
    font-size: 16px;
    font-weight: 500;
    line-height: 27.2px;
    color: rgb(133, 133, 133);
    white-space: nowrap;
  }
  .n-tab-label-active {
    color: rgb(10, 10, 10);
  }

  /* Dashboard image */
  .n-dashboard-img-wrap {
    width: 100%;
    aspect-ratio: 1.32799 / 1;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.54);
    backdrop-filter: blur(54px);
    -webkit-backdrop-filter: blur(54px);
    box-shadow: rgba(0, 0, 0, 0.08) 0px 8px 32px 0px;
    padding: 16px 17px;
    position: relative;
  }
  .n-dashboard-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }

  /* Marquee section */
  .n-marquee-section {
    background-color: rgb(247, 247, 245);
    padding: 0 30px 30px;
    overflow: hidden;
    width: 100%;
  }
  .n-marquee-inner {
    max-width: 1200px;
    margin: 0 auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 34px;
  }
  .n-marquee-text {
    font-family: var(--font-inter), sans-serif;
    font-size: 18px;
    letter-spacing: -0.5px;
    line-height: 30.6px;
    color: rgb(10, 10, 10);
    text-align: center;
    margin: 0;
  }
  .n-marquee-fade {
    width: 100%;
    overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 12.5%, black 87.5%, transparent 100%);
  }
  .n-marquee-track {
    display: flex;
    align-items: center;
    gap: 90px;
    list-style: none;
    margin: 0;
    padding: 10px 0;
    width: fit-content;
    animation: n-scroll 30s linear infinite;
  }
  @keyframes n-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-25%); }
  }
  .n-marquee-logo {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Benefits section */
  .nb-section {
    background-color: rgb(247, 247, 245);
    padding: 80px 30px 100px;
  }
  .nb-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 48px;
  }
  .nb-title {
    font-family: var(--font-geist-sans), sans-serif;
    font-size: 48px;
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 52px;
    text-align: center;
    color: rgb(10, 10, 10);
    margin: 0;
    white-space: nowrap;
  }
  .nb-cards {
    display: flex;
    gap: 20px;
    width: 100%;
  }
  .nb-card {
    position: relative;
    flex: 1;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px;
    min-height: 500px;
  }
  .nb-card-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 24px;
    z-index: 0;
  }
  .nb-card-top {
    position: relative;
    z-index: 1;
  }
  .nb-card-heading {
    font-family: var(--font-geist-sans), sans-serif;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 42px;
    color: rgb(255, 255, 255);
    margin: 0;
  }
  .nb-card-bottom {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .nb-chip {
    display: inline-flex;
    align-items: center;
    background: rgb(255, 255, 255);
    border: 1px solid rgba(59, 59, 59, 0.12);
    border-radius: 20px;
    padding: 8px 16px;
    font-family: var(--font-inter), sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgb(10, 10, 10);
    white-space: nowrap;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .n-hero-content { gap: 60px; }
    .n-heading { font-size: 40px; letter-spacing: -1px; line-height: 44px; }
    .n-dashboard-float { width: 95%; }
    .n-dashboard-section { padding-bottom: 0; }
    .n-marquee-inner { gap: 24px; }
    .nb-cards { flex-direction: column; }
    .nb-title { font-size: 32px; line-height: 36px; white-space: normal; }
    .nb-card-heading { font-size: 24px; line-height: 30px; }
  }
`;
