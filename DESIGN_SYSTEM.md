# Nuave Design System

> For AI and developers. When building UI, follow these rules exactly.
> Light mode only. UI language: Bahasa Indonesia. Reference: Acctual.com.

---

## 1. Color Tokens

### Semantic Colors — Use These Names

| Role | Token / Class | Hex | When to Use |
|------|---------------|-----|-------------|
| **Page background** | `bg-white` | `#FFFFFF` | Page and modal backgrounds |
| **Surface** | `bg-[#F9FAFB]` | `#F9FAFB` | Cards on colored backgrounds, table rows, sidebar |
| **Surface raised** | `bg-[#F3F4F6]` | `#F3F4F6` | Hover states on surfaces, selected items, badges |
| **Border default** | `border-[#E5E7EB]` | `#E5E7EB` | Card borders, dividers, table lines |
| **Border strong** | `border-[#D1D5DB]` | `#D1D5DB` | Active input borders, emphasized dividers |
| **Text heading** | `text-[#111827]` | `#111827` | Page titles, card titles, headings |
| **Text body** | `text-[#374151]` | `#374151` | Paragraphs, descriptions, table cells |
| **Text muted** | `text-[#6B7280]` | `#6B7280` | Helper text, timestamps, captions, placeholders |
| **Text placeholder** | `text-[#9CA3AF]` | `#9CA3AF` | Input placeholders only |

### Brand & Status Colors

| Role | Token / Class | Hex | When to Use |
|------|---------------|-----|-------------|
| **Accent (primary)** | `bg-[#6C3FF5]` | `#6C3FF5` | Primary buttons, active nav, links, focus rings |
| **Accent dark** | `bg-[#3D2BC7]` | `#3D2BC7` | Button hover state |
| **Accent light** | `bg-[#ECE8FF]` | `#ECE8FF` | Accent badges, soft accent backgrounds |
| **Success** | `text-[#22C55E]` | `#22C55E` | Positive scores (70–100), success states |
| **Success light** | `bg-[#DCFCE7]` | `#DCFCE7` | Success badge backgrounds |
| **Warning** | `text-[#F59E0B]` | `#F59E0B` | Medium scores (40–69), warning states |
| **Warning light** | `bg-[#FEF3C7]` | `#FEF3C7` | Warning badge backgrounds |
| **Error** | `text-[#EF4444]` | `#EF4444` | Low scores (0–39), destructive actions, errors |
| **Error light** | `bg-[#FEE2E2]` | `#FEE2E2` | Error badge backgrounds |

### Score Color Rule

```
0–39  → red    (#EF4444 text, #FEE2E2 bg)
40–69 → amber  (#F59E0B text, #FEF3C7 bg)
70–100 → green (#22C55E text, #DCFCE7 bg)
```

---

## 2. Typography Scale

Fonts: **Geist Sans** (`font-heading`) for headings, **Inter** (`font-body`) for everything else.

### The Scale — 8 Steps, Each Has One Job

Only use sizes from this table. Never use in-between values (no `text-[15px]`, no custom sizes).
Use `rem` or `px` only — never `em` units, which break the scale inside nested elements.

| Step | Tailwind Class | Size | Weight | Line Height | Letter Spacing | Use For |
|------|---------------|------|--------|-------------|----------------|---------|
| **Display** | `text-5xl` or `clamp(1.75rem,5vw,3rem)` | 48px | `font-bold` | `leading-none` (1) | `tracking-tight` (-0.025em) | Landing page hero only |
| **H1** | `text-3xl` | 30px | `font-bold` | `leading-tight` (1.25) | `tracking-tight` (-0.025em) | Page titles |
| **H2** | `text-2xl` | 24px | `font-semibold` | `leading-snug` (1.375) | `tracking-tight` (-0.015em) | Section headings |
| **H3** | `text-lg` | 18px | `font-semibold` | `leading-snug` (1.375) | `tracking-normal` (0) | Card titles, modal titles |
| **Body** | `text-base` | 16px | `font-normal` | `leading-relaxed` (1.625) | `tracking-normal` (0) | Paragraphs, descriptions |
| **Body small** | `text-sm` | 14px | `font-normal` | `leading-relaxed` (1.625) | `tracking-normal` (0) | Form labels, table cells, nav |
| **Caption** | `text-xs` | 12px | `font-normal` | `leading-relaxed` (1.625) | `tracking-normal` (0) | Timestamps, badges, metadata |
| **Overline** | `text-xs uppercase` | 12px | `font-medium` | `leading-none` | `tracking-widest` (0.1em) | Section labels, tag categories |

---

### Letter Spacing Rules (from Refactoring UI)

The default rule: **trust the typeface designer — leave letter-spacing alone.**
Only adjust in these specific situations:

| Situation | Rule | Tailwind | Why |
|-----------|------|----------|-----|
| Headlines (H1, H2, Display) | Tighten | `tracking-tight` | Geist has wide default spacing; tightening mimics a condensed headline feel |
| H3 and below | Leave alone | `tracking-normal` | Default spacing is correct at these sizes |
| ALL CAPS text (overlines, badges) | Loosen | `tracking-widest` | All-caps letters lack visual variety — extra spacing aids readability |
| Body, small, caption | Never change | `tracking-normal` | Adjusting body tracking makes text feel unnatural |

**Never** increase letter-spacing on headlines. **Never** decrease letter-spacing on body text.

---

### Line Height Rules (from Refactoring UI)

Line-height and font size are **inversely proportional** — larger text needs less, smaller text needs more.

| Size | Line Height | Tailwind | Reason |
|------|-------------|----------|--------|
| Display, H1 (≥30px) | 1.0–1.25 | `leading-none` / `leading-tight` | Eyes don't need help finding the next line at large sizes |
| H2, H3 (18–24px) | 1.375 | `leading-snug` | Moderate help navigating lines |
| Body, small (14–16px) | 1.625 | `leading-relaxed` | Eyes need more spacing to track lines reliably |
| Caption (12px) | 1.625 | `leading-relaxed` | Small text needs the most help |
| Wide paragraphs (>65ch) | 1.75–2.0 | `leading-loose` | Longer lines need taller line-height |

**Never** apply a single `leading-normal` (1.5) to every text size — it's too tight for small text and too loose for headlines.

---

### Text Alignment Rules (from Refactoring UI)

- **Default:** Always left-align (`text-left`) — matches how Indonesian/English is read
- **Center-align:** Only for headlines or independent blocks of ≤ 2–3 lines (e.g., feature card titles)
- **Never center-align** paragraphs longer than 2–3 lines — it creates ragged edges that hurt readability
- **Right-align numbers** in tables — keeps decimals aligned for easy scanning (`text-right` on number columns)
- **Never justify** text — creates awkward word gaps on the web

---

### Baseline Alignment Rule (from Refactoring UI)

When mixing font sizes on the same line (e.g., a large title + small action link in a card header):

```tsx
// Wrong — center-aligns baselines, looks awkward
<div className="flex items-center gap-4">
  <h2 className="text-2xl font-semibold">Who to follow</h2>
  <span className="text-sm text-[#6B7280]">See all</span>
</div>

// Correct — baseline alignment feels natural
<div className="flex items-baseline gap-4">
  <h2 className="text-2xl font-semibold">Who to follow</h2>
  <span className="text-sm text-[#6B7280]">See all</span>
</div>
```

Use `items-baseline` whenever mixing font sizes in a flex row.

---

### Line Length Rule (from Refactoring UI)

- **Target:** 45–75 characters per line for body text
- **In Tailwind:** Use `max-w-prose` (65ch) on paragraph containers — never let body text span full column width
- **In wider layouts:** Constrain the paragraph even if surrounding elements are wider

```tsx
// Always constrain paragraph width, even inside wide cards
<p className="max-w-prose text-sm text-[#374151] leading-relaxed">
  Body copy here...
</p>
```

---

### Links in UI (from Refactoring UI)

- **In paragraph text:** Links must be visually distinct — use `text-[#6C3FF5]` with underline
- **In UI where most things are clickable** (nav, tables, card actions): Do NOT use accent color for every link — it becomes overwhelming
- **Preferred emphasis for UI links:** Use `font-medium` + slightly darker color, no underline by default
- **Ancillary links** (footer, breadcrumbs, secondary actions): Show underline or color only on hover

```tsx
// Paragraph link — must stand out
<a className="text-[#6C3FF5] underline hover:text-[#3D2BC7]">Link text</a>

// UI link — subtle, not competing with primary actions
<a className="font-medium text-[#374151] hover:text-[#111827]">Link text</a>

// Ancillary link — invisible until hovered
<a className="text-[#6B7280] hover:underline hover:text-[#374151]">Link text</a>
```

---

### Weight Hierarchy Rules

- **Max 2 weights per component** — pick from: `font-normal` (400) + `font-semibold` (600), or `font-normal` + `font-bold` (700)
- **Never use** `font-medium` (500) as the only emphasis — it's not enough contrast from `font-normal`
- **Never use** `font-bold` (700) for H2 and below in app pages — `font-semibold` is sufficient
- **`font-bold`** is reserved for: H1, Display, and maximum-emphasis data (scores, prices, key metrics)
- **Headings:** Always `font-heading` (Geist Sans), color `#111827`
- **Body:** Always `font-body` (Inter), color `#374151`
- **Muted text:** Color `#6B7280` — never lighter than this
- **Never** use `text-4xl` or larger in app pages — large sizes are landing page only

---

## 3. Spacing Scale

Based on a 4px grid. Every spacing value must be a multiple of 4.

### The Scale — 7 Steps With Context

| Step | Tailwind | Value | When to Use |
|------|----------|-------|-------------|
| **1** | `gap-1`, `p-1` | 4px | Between icon and its label, tight inline groups |
| **2** | `gap-2`, `p-2` | 8px | Between related items: radio options, tag groups, inline badges |
| **3** | `gap-3`, `p-3` | 12px | Compact card padding, mobile card padding, input inner padding |
| **4** | `gap-4`, `p-4` | 16px | Default card padding, between form fields, list item gaps |
| **5** | `gap-6`, `p-6` | 24px | Desktop card padding, between card sections, sidebar section gaps |
| **6** | `gap-8`, `p-8` | 32px | Between major page sections, page horizontal padding |
| **7** | `gap-12`, `p-12` | 48px | Landing page section vertical padding |
| **8** | `gap-16`, `p-16` | 64px | Hero section gaps, major landing page spacing |

### Spacing Rules

- **Card internal padding:** `p-4` mobile, `p-6` desktop
- **Card gap (between cards):** `gap-4` for grids, `gap-3` for stacked lists
- **Form field spacing:** `gap-4` between fields, `gap-1.5` between label and input
- **Page padding:** `px-4` mobile, `px-8` desktop
- **Section spacing:** `py-8` for app sections, `py-12` to `py-20` for landing sections
- **Never** use odd spacing like `gap-5`, `p-7`, `gap-9` — stick to 4px multiples

---

## 4. Component Patterns

Use **shadcn/ui** components for new screens. Existing screens use custom CSS classes.

### Card

```tsx
// Standard card
<div className="rounded-md border border-[#E5E7EB] bg-white p-6 shadow-sm">
  <h3 className="font-heading text-lg font-semibold text-[#111827]">
    Card Title
  </h3>
  <p className="mt-1 text-sm text-[#6B7280]">
    Card description goes here
  </p>
  <div className="mt-4">
    {/* Card content */}
  </div>
</div>

// Interactive card (hoverable)
<div className="card card-hover">
  {/* Uses globals.css .card + .card-hover classes */}
  {/* Hover: purple border + soft purple shadow */}
</div>
```

### Button Hierarchy

```tsx
// Primary — one per visible screen area
<button className="rounded-md bg-[#6C3FF5] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D2BC7] transition-colors">
  Mulai Audit
</button>

// Secondary
<button className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
  Batal
</button>

// Ghost
<button className="rounded-md px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors">
  Kembali
</button>

// Destructive
<button className="rounded-md bg-[#EF4444] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors">
  Hapus
</button>
```

### Badge / Status Pill

```tsx
// Score badge
<span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-medium text-[#22C55E]">
  Score: 85
</span>

// Neutral badge
<span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
  Label
</span>
```

### Form Field

```tsx
<div className="form-field">
  <label className="field-label">Nama Brand</label>
  <input
    type="text"
    placeholder="Contoh: Toko Kopi Nusantara"
    className="form-field-input"
  />
  {/* Uses globals.css .form-field styles */}
  {/* Height: 36px, radius: 6px, focus: 4px black shadow ring */}
</div>
```

### Page Layout

```tsx
// Standard app page
<div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
  <h1 className="font-heading text-3xl font-bold text-[#111827]">
    Page Title
  </h1>
  <p className="mt-2 text-sm text-[#6B7280]">
    Page description
  </p>
  <div className="mt-8">
    {/* Page content */}
  </div>
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#D1D5DB] px-6 py-12 text-center">
  <IconName size={32} stroke={1.5} className="text-[#9CA3AF]" />
  <h3 className="mt-3 font-heading text-lg font-semibold text-[#111827]">
    Belum Ada Data
  </h3>
  <p className="mt-1 text-sm text-[#6B7280]">
    Description of what to do next
  </p>
  <button className="mt-4 rounded-md bg-[#6C3FF5] px-4 py-2 text-sm font-medium text-white">
    Action
  </button>
</div>
```

---

## 5. Layout Rules

### Max Widths

| Context | Max Width | Class |
|---------|-----------|-------|
| Landing page content | 1120px | `max-w-6xl` |
| Landing page sections | 960px | `max-w-5xl` |
| App page content | 896px | `max-w-4xl` |
| Form/dialog content | 512px | `max-w-lg` |
| Narrow content (auth) | 400px | `max-w-sm` |

### Grid Patterns

```
Dashboard stats:     grid-cols-2 sm:grid-cols-4    gap-4
Feature cards:       grid-cols-1 sm:grid-cols-3    gap-6
Pricing cards:       grid-cols-1 sm:grid-cols-3    gap-6
Two-column layout:   grid-cols-1 md:grid-cols-2    gap-8
Settings/form:       single column                 max-w-lg mx-auto
```

### Responsive Breakpoints

| Breakpoint | Width | What Changes |
|------------|-------|--------------|
| Default | < 640px | Single column, compact padding (`p-4`), smaller headings |
| `sm` | 640px | Two-column grids start |
| `md` | 768px | Full grid layouts, standard padding (`p-8`) |
| `lg` | 1024px | Sidebar visible (dashboard), max-width containers |

### Responsive Rules

- **Mobile-first:** Start with single column, add columns at breakpoints
- **Landing page hero:** 2-col on desktop, single-col on mobile (hide mockup image)
- **Cards:** Stack vertically on mobile, grid on desktop
- **Page padding:** `px-4` → `px-8` at `md`
- **Section padding:** `py-10` → `py-20` at `md` (landing page only)
- **Never** hide essential content on mobile — only decorative elements

---

## 6. Constraints (the Don'ts)

### Typography
- Never use more than **2 font weights** in a single component
- Never use `text-4xl` or larger inside the app — large sizes are landing page only
- Never use a font-size between steps (no `text-[15px]` custom sizes)
- Never center-align body text longer than 2 lines
- Never use ALL CAPS for body text — only for overline labels

### Color
- Never use more than **3 colors** in a single component (background + text + one accent)
- Never use raw black (`#000000`) — use `#111827` for darkest text
- Never use accent color (`#6C3FF5`) for body text — only headings, links, and interactive elements
- Never invent new colors — pick from the token list above
- Never use opacity to create gray shades — use the defined grays

### Spacing
- Never use asymmetric padding on cards (e.g., `pt-4 pb-8`) — keep it uniform
- Never use `margin-top` on the first child — use `gap` on the parent instead
- Never mix spacing systems — use only Tailwind spacing utilities

### Layout
- Never nest cards inside cards
- Never exceed **4 columns** in any grid
- Never let content go full-width without a max-width container
- Never use `position: absolute` for layout — use flexbox or grid
- Never hide nav or critical actions behind hover states on mobile

### Components
- Never have more than **1 primary button** visible in the same area
- Never use more than **3 button types** on one screen (primary + secondary + ghost)
- Never use a modal when a page would work — modals are for confirmations and quick edits
- Never put a form inside a table row
- Never auto-close success notifications — let users dismiss them

### Icons
- Always `@tabler/icons-react` with `size={18} stroke={1.5}`
- Never mix icon libraries on the same page
- Never use icons without labels in primary navigation
- Never use icons purely for decoration — every icon must convey meaning

### General
- Never add animations beyond `transition-colors` and `transition-opacity` in app pages
- Never use box shadows heavier than `shadow-sm` on cards — keep the UI flat
- Never use gradients inside the app — only on the landing page hero
- Never use border-radius larger than `rounded-md` (6px) on cards — use `rounded-full` only for badges/avatars
- White space is a feature — when in doubt, add more space, not more content
