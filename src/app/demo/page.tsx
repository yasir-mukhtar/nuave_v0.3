"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

const B = "https://framerusercontent.com/images/";

// ─── Background objects ────────────────────────────────────────────────────
// Positioned for 1440px viewport. Section has overflow:hidden so edge objects
// clip naturally. Positions derived from screenshot visual analysis.
type Pos = { left?: number | string; right?: number | string; top?: number | string; bottom?: number | string };

const BG: { src: string; pos: Pos; w: number; h: number; fit?: "cover" | "contain" }[] = [
  // ── Left side ──
  // Brown leather notebook (top-left)
  { src: `${B}sKWaRtYyMiCpwyq3FvYupBQ.png`,          pos: { left: 73,  top: 62  }, w: 175, h: 190 },
  // Left edge payment UI + currency notes (partially clipped)
  { src: `${B}ww9zfRq1vgo3ieVxHc88ClZA.png`,          pos: { left: -25, top: 250 }, w: 165, h: 360, fit: "cover" },
  // Tether (USDT) teal diamond
  { src: `${B}OeRe5EWy8ZquuWnq9zHFLw0e9zU.png`,       pos: { left: 92,  top: 308 }, w: 65,  h: 72  },
  // Payment app notification bubble (mid-left)
  { src: `${B}bJUuEIi2lda5EWBSYxToOk2yIk.png`,        pos: { left: 72,  top: 228 }, w: 250, h: 162 },
  // Binance yellow hexagon (lower-left)
  { src: `${B}9p7ofckBv6xcSR0PcxysJYTx5vs.png`,       pos: { left: 108, bottom: 108 }, w: 86, h: 86 },
  // Small icons row (bottom-left edge)
  { src: `${B}99sNwx2Z9ALDjGDZT4DqonQQQ.png`,         pos: { left: 0,   bottom: 62  }, w: 88, h: 85 },
  // Transaction UI strip (bottom-left)
  { src: `${B}M8dMDgBAq1J2ykwnlui5gM.png`,            pos: { left: 218, bottom: -5  }, w: 345, h: 195 },

  // ── Right side ──
  // $100 bill (top-right, partially clipped)
  { src: `${B}eWfkRqAvu4cjFr6Tfy5Rl7iJYA.png`,        pos: { right: -45, top: 28    }, w: 220, h: 320, fit: "cover" },
  // Ethereum blue diamond
  { src: `${B}uuOGPNo5BpwuLNKabYniDE1UzUY.png`,       pos: { right: 124, top: 138   }, w: 93,  h: 105 },
  // 3D silver paperclip
  { src: `${B}xSlSoRNuNvwBiqoU3wy9eo2OE.png`,         pos: { right: 285, top: 338   }, w: 52,  h: 112 },
  // Invoice / app UI (right side, partially clipped)
  { src: `${B}BdZnBNJh3RoRsMgck5Y9VqJVwZA.png`,       pos: { right: -55, top: 192   }, w: 315, h: 505 },
  // USDC blue circle
  { src: `${B}RVnK7dBpLbgTLHY59HUFE9joXmQ.png`,       pos: { right: -18, top: 385   }, w: 88,  h: 88  },
  // Dark blue coin / circle
  { src: `${B}Z220Qtzh7Q2kkJ8I7KOM3wCic.png`,         pos: { right: -22, top: 474   }, w: 86,  h: 92  },
  // Right bottom UI strip
  { src: `${B}PbIK1Qi2AW9ayIWiEepIZ4X9Y.png`,         pos: { right: -52, bottom: -18 }, w: 305, h: 195 },

  // ── Center bottom ──
  // Main invoice preview
  { src: `${B}nFUOUAeW9flvYLUoZRRkTs2Q.png`,          pos: { left: "calc(50% + 20px)", bottom: -38 }, w: 338, h: 412 },
  // Transaction list / activity
  { src: `${B}dQJNJ0OnZHuxzUD4wpsXx9rPOo.png`,        pos: { left: "calc(50% - 315px)", bottom: -28 }, w: 430, h: 305 },
];

// ─── Logo marquee ─────────────────────────────────────────────────────────
// Real text logos extracted from the screenshot
const LOGOS = [
  { label: "superteam",        weight: 400 },
  { label: "Z OpenZeppelin",   weight: 400 },
  { label: "⫴ forma",          weight: 400 },
  { label: "WONDERSTRUCK",     weight: 700 },
  { label: "accelera/talent",  weight: 400 },
  { label: "dYdX",             weight: 700 },
  { label: "△ PROSPERA",       weight: 400 },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function DemoHero() {
  return (
    <main>
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <nav className="h-nav">
        <div className="h-nav-inner">
          <Link href="/" className="h-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: "inline" }}>
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {" "}Acctual
          </Link>
          <div className="h-nav-links">
            {["Teams", "About", "Blog", "Guides"].map(l => (
              <a key={l} href="#" className="h-nav-link">{l}</a>
            ))}
          </div>
          <div className="h-nav-right">
            <a href="#" className="h-nav-login">Log in</a>
            <a href="#" className="h-nav-signup">Sign up for free</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="h-section">

        {/* Background layer */}
        <div className="h-bg" aria-hidden="true">
          {BG.map((item, i) => {
            const s: React.CSSProperties = {
              position: "absolute",
              width: item.w,
              height: item.h,
              overflow: "hidden",
              pointerEvents: "none",
              ...(item.pos as React.CSSProperties),
            };
            return (
              <div key={i} style={s}>
                <img
                  src={item.src}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: item.fit ?? "contain", display: "block" }}
                />
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="h-content">

          {/* Text block */}
          <div className="h-text">
            {/* Chat notifications stacked above heading */}
            <div className="h-bubble-wrap" aria-hidden="true">
              {/* Top bubble */}
              <img src={`${B}OXqvQpqs6AnUUuOjvmoxlKMjTw.png`} alt=""
                style={{ position:"absolute", right:7, top:0, width:215, objectFit:"contain" }} />
              {/* Middle bubble */}
              <img src={`${B}emGKgZosJ92EbMI0EBvaZif2qc.png`} alt=""
                style={{ position:"absolute", left:"50%", top:"51%", transform:"translate(-50%,-50%)", width:240, objectFit:"contain" }} />
              {/* Bottom bubble — Simone Perele */}
              <img src={`${B}LKULnrsix0tDPTq55VlsaKFozw.png`} alt=""
                style={{ position:"absolute", left:0, right:0, bottom:1, width:"100%", objectFit:"contain" }} />
            </div>

            <h1 className="h-heading">
              Get paid<br />same day
            </h1>

            <p className="h-sub">
              By sending customers the most<br />
              flexible invoice on the planet.
            </p>

            <Link href="https://app.acctual.com/signup" className="h-cta">
              Create invoice in seconds
            </Link>
          </div>

          {/* Social proof */}
          <div className="h-proof">
            <p className="h-proof-text">
              Used by 5,000+ businesses &amp; freelancers in 129+ countries
            </p>

            {/* Marquee */}
            <div className="h-marquee-fade">
              <ul className="h-marquee-track" aria-hidden="true">
                {[...Array(3)].flatMap((_, s) =>
                  LOGOS.map((logo, i) => (
                    <li
                      key={`${s}-${i}`}
                      className="h-logo"
                      style={{ fontWeight: logo.weight }}
                    >
                      {logo.label}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const CSS = `
  /* Nav */
  .h-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }
  .h-nav-inner {
    max-width: 1260px;
    margin: 0 auto;
    padding: 0 40px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 40px;
  }
  .h-logo {
    font-family: var(--font-geist-sans), sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #111;
    text-decoration: none;
    letter-spacing: -0.4px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .h-nav-links {
    display: flex;
    gap: 28px;
    flex: 1;
  }
  .h-nav-link {
    font-family: var(--font-inter), sans-serif;
    font-size: 15px;
    color: #555;
    text-decoration: none;
  }
  .h-nav-link:hover { color: #111; }
  .h-nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
  }
  .h-nav-login {
    font-family: var(--font-inter), sans-serif;
    font-size: 15px;
    color: #555;
    text-decoration: none;
  }
  .h-nav-signup {
    font-family: var(--font-inter), sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    background: #111;
    padding: 7px 16px;
    border-radius: 20px;
    text-decoration: none;
    white-space: nowrap;
  }

  /* Hero section */
  .h-section {
    position: relative;
    width: 100%;
    height: 699px;
    overflow: hidden;
    background-color: rgb(247, 250, 252);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Background */
  .h-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  /* Content column */
  .h-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 70px;
    width: 100%;
    max-width: 1260px;
    padding: 0 40px;
  }

  /* Text block */
  .h-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    width: 450px;
    max-width: 100%;
    position: relative;
  }

  /* Chat bubble above heading */
  .h-bubble-wrap {
    position: absolute;
    top: -111px;
    left: 50%;
    transform: translateX(-50%);
    width: 268px;
    height: 111px;
    overflow: hidden;
    background: rgb(247, 250, 252);
    pointer-events: none;
  }
  .h-bubble-img {
    width: 215px;
    position: absolute;
    right: 7px;
    top: 0;
    object-fit: cover;
  }

  /* Heading */
  .h-heading {
    font-family: var(--font-geist-sans), sans-serif;
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -1.44px;
    line-height: 1;
    text-align: center;
    color: rgba(0,0,0,0.9);
    margin: 0;
    max-width: 390px;
  }

  /* Subtitle */
  .h-sub {
    font-family: var(--font-inter), sans-serif;
    font-size: 20px;
    letter-spacing: -0.4px;
    line-height: 26px;
    text-align: center;
    color: rgb(102,102,102);
    margin: 0;
    max-width: 390px;
  }

  /* CTA button */
  .h-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-image: linear-gradient(rgb(64,64,64) 0%, rgb(26,26,26) 100%);
    border-radius: 40px;
    padding: 8px 20px;
    box-shadow:
      rgba(255,255,255,0.25) 0px 1px 1px 0px inset,
      rgba(0,0,0,0.15) 3px 3px 3px 0px;
    color: #fff;
    font-family: var(--font-inter), sans-serif;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.32px;
    line-height: 24px;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .h-cta:hover { opacity: 0.88; }

  /* Social proof */
  .h-proof {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    position: relative;
    z-index: 10;
  }
  .h-proof-text {
    font-family: var(--font-inter), sans-serif;
    font-size: 18px;
    letter-spacing: -0.32px;
    line-height: 28px;
    color: rgb(139,139,139);
    margin: 0;
    text-align: center;
  }

  /* Marquee */
  .h-marquee-fade {
    width: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
  }
  .h-marquee-track {
    display: flex;
    align-items: center;
    gap: 40px;
    list-style: none;
    margin: 0;
    padding: 4px 0;
    width: fit-content;
    animation: h-scroll 28s linear infinite;
  }
  @keyframes h-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-33.333%); }
  }
  .h-logo {
    font-family: var(--font-inter), sans-serif;
    font-size: 14px;
    color: rgb(185,185,185);
    white-space: nowrap;
    letter-spacing: 0px;
    list-style: none;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .h-section {
      height: auto;
      min-height: 100svh;
      padding: 100px 24px 60px;
      align-items: flex-start;
    }
    .h-bg { display: none; }
    .h-content { gap: 48px; padding: 0; }
    .h-text { width: 100%; padding-top: 60px; }
    .h-heading { font-size: 52px; letter-spacing: -1.5px; max-width: 250px; }
    .h-sub br { display: none; }
  }
`;
