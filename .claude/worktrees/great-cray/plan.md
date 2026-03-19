# Landing Page Hero Section - Implementation Plan

## Approach
Replace `src/app/page.tsx` with the new Framer-based landing page design, starting with the Hero section (Nav + Hero + Preview). Build as a single page component to match the Framer export pattern.

## Changes

### 1. Add Inter Display font to `src/app/layout.tsx`
The Framer design uses **Inter Display** (weight 500-700) for headings. Add it alongside existing Inter/Geist fonts. We'll use `next/font/google` to load "Inter Display" or fallback to using Inter with `font-variation-settings`.

Actually, Inter Display is not available in Google Fonts directly. We'll use the `Inter` font with `display` optical sizing, or import from the Framer CDN URLs. Simplest: use Inter with appropriate weights since Inter Display is visually very similar to Inter at display sizes.

### 2. Add Framer landing page CSS tokens to `src/app/globals.css`
Add new CSS custom properties under a `.lp-framer` scope or directly to `:root`:
- `--lp-bg: #f7f7f5` (warm off-white page background)
- `--lp-text-primary: #0a0a0a` (near-black headings)
- `--lp-text-secondary: #5b5b5b` (gray body text)
- `--lp-purple: #6c3ff5` (CTA purple)
- `--lp-border: rgba(59, 59, 59, 0.12)` (light border)
- `--lp-glass-bg: rgba(255, 255, 255, 0.9)` (nav frosted glass)
- `--lp-glass-card: rgba(255, 255, 255, 0.54)` (preview card glass)

### 3. Replace `src/app/page.tsx` with new landing page
Start with just Nav + Hero + Preview section. Structure:

```
<main style={{ background: '#f7f7f5' }}>
  <Nav />           — Fixed, frosted glass, logo + 4 links + Masuk button
  <HeroSection />   — Centered headline, subtitle, CTA button
  <PreviewSection /> — Stepper tabs + dashboard mockup on purple gradient BG
</main>
```

#### Nav details:
- Fixed position, z-10, max-width 1072px, centered
- Frosted glass: `backdrop-filter: blur(10px)`, `bg: rgba(255,255,255,0.9)`
- Border: `1px solid rgba(117,115,114,0.15)`, border-radius: 100px outer / 12px inner
- Logo: Nuave SVG + "Nuave" text (Inter 600, 20px)
- Links: Cara Kerja, Harga, FAQ, Kontak (with arrow icon)
- Button: "Masuk" — dark/black pill button

#### Hero details:
- Padding: 120px top (for nav clearance), center-aligned
- H1: "Lihat seberapa sering ChatGPT menyebut brand Anda" — Inter Display 600, 60px, -1px letter-spacing, #0a0a0a
- Subtitle: "Jutaan orang kini melakukan pencarian lewat AI..." — Inter 400, 18px, 1.7em line-height, #5b5b5b
- CTA: "Audit brand Anda — Gratis!" — purple (#6c3ff5) button, white text, 6px radius, 12px 22px padding

#### Preview details:
- Purple gradient background image (from Framer CDN)
- Stepper bar: 3 steps (Tentukan Prompt, Audit Brand, Monitoring Harian)
- Dashboard mockup container: glassmorphism card with blur(54px), shadow
- Dashboard images: 3 screenshots (from Framer CDN URLs)
- Active step shows corresponding screenshot

### 4. Image assets
Reference directly from `framerusercontent.com` CDN URLs found in the HTML source:
- Logo SVG: `https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg`
- BG gradient: `https://framerusercontent.com/images/aaSazir73GbncCCLDZdoqquukeY.png`
- Dashboard 01: `https://framerusercontent.com/images/6KCcqoV5JsbhhakFNgDWYxdVzBA.png`
- Dashboard 02: `https://framerusercontent.com/images/YENU9KLYq8IxQPhP0g23k7epVQ.png`
- Dashboard 03: `https://framerusercontent.com/images/5z04w9x5IIQC2aQp3SPkEKtyT4.png`

### 5. Responsive behavior
- Desktop (>1200px): Full layout, 1200px max-width
- Tablet (768-1199px): 40px side margins
- Mobile (<768px): 16px side margins, smaller text sizes
