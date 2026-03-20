# Frontend Unification Plan: shadcn/ui + Tailwind v4

> **Goal:** Migrate from the current mixed styling approach (90% inline styles, 10% Tailwind) to a single, consistent system built on **shadcn/ui primitives + Tailwind v4 utility classes + CSS variable tokens**.

---

## Current State Summary

| Approach | Files | Where |
|----------|-------|-------|
| **Pure Tailwind** (via shadcn) | 7 | `components/ui/*` |
| **Extensive inline `style={{}}`** | 15 | Layout, dashboard, new-project, landing page |
| **Global CSS classes** | ~40 classes | `globals.css` (typography, forms, cards, LP grids, animations) |
| **Hardcoded hex colors** | ~200+ instances | Scattered across all inline-styled components |
| **CSS variables via inline** | ~60+ references | `var(--purple)`, `var(--text-muted)`, etc. |

**Icon libraries:** Tabler (`@tabler/icons-react`) in 13 components, Lucide (`lucide-react`) in 2 shadcn components.

---

## Part A: Token → Tailwind Theme Mapping

### Current tokens.css variables → proposed Tailwind utility names

Tailwind v4 uses `@theme` blocks in CSS (no JS config). Extend the existing `@theme inline` block in `globals.css`.

```css
/* Add to the existing @theme inline block in globals.css */
@theme inline {
  /* ── Existing shadcn color mappings remain unchanged ── */

  /* ── App design tokens (from tokens.css) ── */

  /* Backgrounds */
  --color-page: var(--bg-page);              /* bg-page */
  --color-surface: var(--bg-surface);        /* bg-surface */
  --color-surface-raised: var(--bg-surface-raised); /* bg-surface-raised */

  /* Borders */
  --color-border-default: var(--border-default); /* border-border-default */
  --color-border-light: var(--border-light);     /* border-border-light */
  --color-border-strong: var(--border-strong);   /* border-border-strong */

  /* Text */
  --color-text-heading: var(--text-heading);     /* text-text-heading */
  --color-text-body: var(--text-body);           /* text-text-body */
  --color-text-muted: var(--text-muted);         /* text-text-muted */
  --color-text-placeholder: var(--text-placeholder); /* text-text-placeholder */

  /* Brand */
  --color-brand: var(--purple);              /* bg-brand, text-brand */
  --color-brand-dark: var(--purple-dark);    /* bg-brand-dark */
  --color-brand-light: var(--purple-light);  /* bg-brand-light */

  /* Semantic */
  --color-success: var(--green);             /* text-success, bg-success */
  --color-success-light: var(--green-light);
  --color-error: var(--red);                 /* text-error, bg-error */
  --color-error-light: var(--red-light);
  --color-warning: var(--amber);             /* text-warning, bg-warning */
  --color-warning-light: var(--amber-light);

  /* Shadows */
  --shadow-subtle: var(--shadow-subtle);     /* shadow-subtle */
  --shadow-card: var(--shadow-card);         /* shadow-card */
  --shadow-focus: var(--shadow-focus);       /* shadow-focus */
  --shadow-modal: var(--shadow-modal);       /* shadow-modal */

  /* Spacing (extend Tailwind's spacing scale) */
  --spacing-xs: var(--space-xs);             /* p-xs, gap-xs, m-xs */
  --spacing-sm: var(--space-sm);
  --spacing-md: var(--space-md);
  --spacing-lg: var(--space-lg);
  --spacing-xl: var(--space-xl);
  --spacing-2xl: var(--space-2xl);
  --spacing-3xl: var(--space-3xl);
}
```

### What this enables

| Before (inline) | After (Tailwind) |
|---|---|
| `style={{ color: "var(--text-muted)" }}` | `className="text-text-muted"` |
| `style={{ backgroundColor: "var(--purple)" }}` | `className="bg-brand"` |
| `style={{ border: "1px solid var(--border-default)" }}` | `className="border border-border-default"` |
| `style={{ boxShadow: "var(--shadow-subtle)" }}` | `className="shadow-subtle"` |
| `style={{ color: "#111827" }}` | `className="text-text-heading"` |
| `style={{ color: "#6B7280" }}` | `className="text-text-muted"` |
| `style={{ padding: "20px" }}` | `className="p-5"` (standard Tailwind) |
| `style={{ gap: 8 }}` | `className="gap-2"` |
| `style={{ borderRadius: "var(--radius-sm)" }}` | `className="rounded-sm"` |

### Hardcoded hex → token mapping reference

For migration, replace these hardcoded values everywhere:

| Hex | Token | Tailwind class |
|-----|-------|---------------|
| `#ffffff` | `--bg-page` | `bg-white` or `bg-page` |
| `#111827` | `--text-heading` | `text-text-heading` |
| `#374151` | `--text-body` | `text-text-body` |
| `#6B7280` | `--text-muted` | `text-text-muted` |
| `#9CA3AF` | `--text-placeholder` | `text-text-placeholder` |
| `#E5E7EB` | `--border-default` | `border-border-default` |
| `#D1D5DB` | `--border-strong` | `border-border-strong` |
| `#F9FAFB` | `--bg-surface` | `bg-surface` |
| `#F3F4F6` | `--bg-surface-raised` | `bg-surface-raised` |
| `#533AFD` / `#6C3FF5` | `--purple` | `bg-brand` / `text-brand` |
| `#3d2bc7` | `--purple-dark` | `bg-brand-dark` |
| `#22C55E` | `--green` | `text-success` |
| `#EF4444` | `--red` | `text-error` |
| `#D97706` / `#F59E0B` | `--amber` | `text-warning` |

---

## Part B: shadcn Component Expansion

### Components to add

| shadcn Component | Replaces | Used in |
|---|---|---|
| **Button** | Inline-styled `<button>` elements everywhere | All pages, Topbar, Sidebar, modals, wizard |
| **Input** | `.form-field input` + inline-styled inputs | new-project forms, SearchableSelect |
| **Textarea** | `.form-field textarea` | new-project forms |
| **Label** | `.form-field label` / `.field-label` | All forms |
| **Select** | Custom `SearchableSelect.tsx` | new-project/page.tsx (country, language pickers) |
| **Popover** | Custom dropdown in Topbar (workspace selector, brand selector) | Topbar.tsx |
| **DropdownMenu** | Custom dropdown in VisibilityChart (period selector) | VisibilityChart.tsx |
| **Accordion** | Custom FAQ expand/collapse | Landing page FAQ section |
| **ScrollArea** | `.scroll-subtle` CSS class | Sidebar, Topbar dropdowns |
| **Tooltip** | _(none currently, but useful)_ | Future use |

### Component-by-component migration notes

#### Button
The most impactful addition. Currently every `<button>` in the app has 10-15 lines of inline styles including hover handlers via `onMouseEnter`/`onMouseLeave`. The shadcn Button with variants covers all cases:

- **Primary (brand):** `<Button>` — map to `bg-brand` instead of default `bg-primary`
- **Secondary/outline:** `<Button variant="outline">`
- **Ghost:** `<Button variant="ghost">` (sidebar nav items)
- **Destructive:** `<Button variant="destructive">`
- **Link:** `<Button variant="link">` (text-only buttons)

Create a custom variant in the Button component for the brand purple:
```tsx
// In button.tsx variants
brand: "bg-brand text-white hover:bg-brand-dark",
```

#### Select (replaces SearchableSelect)
The current `SearchableSelect.tsx` (200+ lines of inline styles) duplicates what shadcn's `Select` or `Combobox` provides. Two options:

1. **If search/filter is needed:** Install shadcn `Command` + `Popover` to build a Combobox pattern
2. **If simple select is enough:** Install shadcn `Select`

Recommendation: The current SearchableSelect supports filtering, so use the **Combobox** pattern (Command + Popover). The shadcn docs have a ready-made example.

#### Popover (replaces Topbar dropdowns)
The Topbar has two custom dropdown menus (workspace selector, brand selector) with:
- Manual open/close state
- `position: absolute` positioning
- Custom popover animations (CSS `popover-up`/`popover-down` classes)
- Click-outside detection

shadcn Popover handles all of this out of the box with Radix.

#### Accordion (replaces FAQ)
The landing page FAQ section uses a custom grid-rows animation for expand/collapse. shadcn Accordion provides the same pattern with proper ARIA attributes.

#### ScrollArea (replaces `.scroll-subtle`)
The custom scrollbar CSS class can be replaced with shadcn ScrollArea for consistent cross-browser scrollbar styling.

---

## Part C: Inline Styles → Tailwind Migration Patterns

### Layout patterns

| Inline style | Tailwind equivalent |
|---|---|
| `display: "flex", flexDirection: "column"` | `flex flex-col` |
| `display: "flex", alignItems: "center", gap: 8` | `flex items-center gap-2` |
| `display: "grid", gridTemplateColumns: "1fr 1fr"` | `grid grid-cols-2` |
| `width: "100%"` | `w-full` |
| `maxWidth: 520` | `max-w-[520px]` |
| `minHeight: "100vh"` | `min-h-screen` |
| `position: "relative"` | `relative` |
| `position: "fixed", top: 0, left: 0` | `fixed top-0 left-0` |
| `overflow: "hidden"` | `overflow-hidden` |
| `zIndex: 50` | `z-50` |

### Spacing patterns

| Inline style | Tailwind equivalent |
|---|---|
| `padding: "20px 32px"` | `px-8 py-5` |
| `padding: "14px 16px"` | `px-4 py-3.5` |
| `marginBottom: 8` | `mb-2` |
| `marginBottom: 36` | `mb-9` |
| `gap: 12` | `gap-3` |
| `gap: 16` | `gap-4` |

### Typography patterns

| Inline style | Tailwind equivalent |
|---|---|
| `fontFamily: "var(--font-heading)"` | `font-heading` (add to @theme) |
| `fontFamily: "var(--font-body)"` | `font-body` (add to @theme) |
| `fontSize: 24, fontWeight: 600` | `text-2xl font-semibold` |
| `fontSize: 15` | `text-[15px]` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 13` | `text-[13px]` |
| `fontSize: 12` | `text-xs` |
| `lineHeight: 1.6` | `leading-relaxed` |
| `letterSpacing: "-0.02em"` | `tracking-tight` |

Add font families to `@theme`:
```css
@theme inline {
  --font-heading: var(--font-geist-sans), sans-serif;
  --font-body: var(--font-inter), sans-serif;
}
```

### Color patterns

| Inline style | Tailwind equivalent |
|---|---|
| `color: "#111827"` | `text-text-heading` |
| `color: "var(--text-muted)"` | `text-text-muted` |
| `backgroundColor: "var(--purple)"` | `bg-brand` |
| `backgroundColor: "#ffffff"` | `bg-white` |
| `border: "1px solid var(--border-default)"` | `border border-border-default` |
| `borderRadius: 8` | `rounded-md` (maps to `--radius-md: 8px`) |
| `boxShadow: "var(--shadow-subtle)"` | `shadow-subtle` |

### Transition patterns

| Inline style | Tailwind equivalent |
|---|---|
| `transition: "border-color 0.15s ease"` | `transition-colors duration-150` |
| `transition: "background-color 0.15s ease"` | `transition-colors duration-150` |
| `transition: "all 0.15s ease"` | `transition-all duration-150` |
| `transition: "opacity 0.2s ease"` | `transition-opacity duration-200` |

### Hover/interactive states

**Before** (JS event handlers):
```tsx
onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--purple)"; }}
onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
```

**After** (Tailwind):
```tsx
className="border border-border-default hover:border-brand transition-colors"
```

This eliminates hundreds of lines of `onMouseEnter`/`onMouseLeave` handlers across the codebase.

---

## Part D: Icon Standardization

### Recommendation: Migrate to Lucide

**Rationale:**
1. shadcn/ui already uses Lucide — mixing two icon libraries increases bundle size
2. Lucide is a fork of Feather with broader coverage (1400+ icons vs Tabler's 5000+, but Lucide covers all icons currently used in this project)
3. Tree-shakeable — only imported icons are bundled
4. Consistent stroke width and sizing with shadcn defaults

### Migration map

| Current (Tabler) | Replacement (Lucide) | Used in |
|---|---|---|
| `IconSmartHome` | `Home` | Sidebar |
| `IconMessageDots` | `MessageSquare` | Sidebar |
| `IconArticle` | `FileText` | Sidebar, ActionItemPanel |
| `IconRosetteAsterisk` | `Sparkles` | Sidebar |
| `IconSelector` | `ChevronsUpDown` | Sidebar |
| `IconLogout` | `LogOut` | Sidebar |
| `IconCoins` | `Coins` | Topbar, LowCreditsBanner, Pricing |
| `IconArrowUpRight` | `ArrowUpRight` | Topbar, MentionPanel, ActionItemPanel |
| `IconChevronDown` | `ChevronDown` | Topbar, VisibilityChart, FAQ |
| `IconChevronUp` | `ChevronUp` | Topbar |
| `IconCheck` | `Check` | Topbar, HowItWorks |
| `IconPlus` | `Plus` | Topbar, CompetitorPanel, Topics page |
| `IconCircleCheckFilled` | `CheckCircle2` | MentionPanel, PromptDetailModal |
| `IconCircleXFilled` | `XCircle` | MentionPanel, PromptDetailModal |
| `IconX` | `X` | PromptDetailModal, WizardLayout |
| `IconSitemap` | `Network` | ActionItemPanel |
| `IconPencilCode` | `PenLine` | ActionItemPanel |
| `IconBrandX` | `Twitter` (or keep Tabler) | Footer |
| `IconBrandInstagram` | `Instagram` | Footer |
| `IconBrandLinkedin` | `Linkedin` | Footer |
| `IconTarget` | `Target` | Landing page |
| `IconMessageChatbot` | `BotMessageSquare` | Landing page |
| `IconFileText` | `FileText` | Landing page |
| `IconCpu` | `Cpu` | Landing page |
| `IconCreditCard` | `CreditCard` | Landing page |
| `IconArrowRight` | `ArrowRight` | Landing page CTAs |

**Note:** Tabler brand icons (`IconBrandX`, `IconBrandInstagram`, `IconBrandLinkedin`) have no Lucide equivalent. Keep `@tabler/icons-react` installed **only** for these 3 branded social icons in `Footer.tsx`, or replace with inline SVGs.

### After migration

```json
// package.json — Tabler can be removed if brand icons are inlined as SVGs
// Otherwise keep it but only import branded icons from it
```

---

## Part E: Global CSS Cleanup

### Classes to KEEP (no Tailwind equivalent or legitimately reusable)

| Class | Reason |
|---|---|
| `.popover-up`, `.popover-down`, `.popover-up-out`, `.popover-down-out` | Complex keyframe animations — keep until Radix Popover replaces custom popover logic |
| `.lp-*` (all landing page classes) | Responsive grid/typography system for LP — migrate later in a dedicated LP pass |
| `.btn-lp-purple`, `.btn-lp-black` | LP button variants — keep until LP migration |
| `body:has(.lp-root)` scope | LP background override — keep |

### Classes to REMOVE (replaced by Tailwind utilities or shadcn)

| Class | Replaced by |
|---|---|
| `.text-label-16`, `.text-label-14`, `.text-label-13`, `.text-label-12` | `text-base`, `text-sm`, `text-[13px]`, `text-xs` + `leading-*` + `font-normal` |
| `.text-copy-16`, `.text-copy-14`, `.text-copy-13` | Same as above with different `leading-*` |
| `.text-button-14`, `.text-button-12` | `text-sm font-medium`, `text-xs font-medium` |
| `.display-heading` | One-off usage → inline Tailwind classes |
| `.form-field`, `.form-field label`, `.form-field input`, etc. | shadcn `Input` + `Label` + `Textarea` components |
| `.field-label` | shadcn `Label` |
| `.input-large` | shadcn `Input` with `className="h-11 text-base"` |
| `.card`, `.card-hover`, `.card-row` | shadcn `Card` with variants |
| `.hero-section` | Inline Tailwind on the specific page |
| `.scroll-subtle` | shadcn `ScrollArea` |
| `.caption` / `small` | `text-xs text-text-muted` |

### Classes to REVISIT after LP migration

All `.lp-*` classes (~50 classes) and their responsive overrides can be cleaned up when the landing page is migrated to Tailwind. This is out of scope for the main app migration.

---

## Phased Migration Plan

### Phase 1: Foundation (tokens + shadcn components)

**Goal:** Set up the Tailwind theme so all tokens are available as utilities, and install all needed shadcn primitives. No visual changes yet.

**Files to modify:**
| File | Change |
|---|---|
| `src/app/globals.css` | Extend `@theme inline` block with app tokens (colors, shadows, fonts, spacing) |
| `src/styles/tokens.css` | No change (keep as source of truth) |
| `src/lib/utils.ts` | No change |

**shadcn components to install** (run `npx shadcn@latest add <name>`):
- `button`
- `input`
- `textarea`
- `label`
- `select`
- `popover`
- `command` (for combobox pattern)
- `dropdown-menu`
- `accordion`
- `scroll-area`
- `tooltip`

**Post-install customization:**
- Add `brand` variant to `Button` component
- Verify all components render correctly with existing theme

**Estimated scope:** 2 files modified, ~12 new files in `components/ui/`

---

### Phase 2: Shared Components

**Goal:** Migrate reusable components from inline styles to Tailwind + shadcn. These are used across multiple pages, so fixing them has the highest leverage.

**Order by impact:**

#### 2a. Layout components
| File | Key changes |
|---|---|
| `src/components/layout/Sidebar.tsx` | Replace inline styles with Tailwind utilities. Use shadcn `Button variant="ghost"` for nav items. Use shadcn `ScrollArea` for overflow. Replace Tabler icons with Lucide. |
| `src/components/layout/Topbar.tsx` | Replace inline styles. Use shadcn `Popover` for workspace/brand dropdowns. Use shadcn `Button` for actions. Replace Tabler icons. |

#### 2b. New-project components
| File | Key changes |
|---|---|
| `src/components/new-project/WizardLayout.tsx` | Replace inline styles. Use shadcn `Button` for close/back actions. Progress bar stays custom (no shadcn equivalent). |
| `src/components/new-project/SearchableSelect.tsx` | **Replace entirely** with shadcn Combobox pattern (`Popover` + `Command`). Delete this file. |

#### 2c. Shared UI components
| File | Key changes |
|---|---|
| `src/components/ButtonSpinner.tsx` | Replace inline styles with Tailwind. Keep as a utility component. |
| `src/components/LowCreditsBanner.tsx` | Replace inline styles. Use semantic color utilities (`bg-error-light`, `text-error`). |
| `src/components/PromptDetailModal.tsx` | Replace inline styles. Use shadcn `Dialog` as base. Move keyframe animations to globals.css or use Tailwind `animate-*`. |

**Estimated scope:** 7 files migrated, 1 file deleted (SearchableSelect)

---

### Phase 3: Pages

**Goal:** Migrate page-level components and one-off inline styles.

#### 3a. Dashboard components
| File | Key changes |
|---|---|
| `src/components/dashboard/VisibilityChart.tsx` | Replace inline styles. Use shadcn `DropdownMenu` for period selector. Keep Recharts as-is. |
| `src/components/dashboard/MentionPanel.tsx` | Replace inline styles. Use shadcn `Card` for container. Use shadcn `ScrollArea` for list. |
| `src/components/dashboard/ActionItemPanel.tsx` | Replace inline styles. Use shadcn `Card`. |
| `src/components/dashboard/CompetitorPanel.tsx` | Replace inline styles. Use shadcn `Card`. |

#### 3b. App pages
| File | Key changes |
|---|---|
| `src/app/new-project/page.tsx` | Replace inline styles in form. Use shadcn `Input`, `Label`, `Button`. Use the new Combobox for country/language selectors. |
| `src/app/new-project/topics/page.tsx` | Replace remaining inline styles. Already uses shadcn `Checkbox`. Use shadcn `Button` for actions. |
| `src/app/new-project/prompts/page.tsx` | Replace inline styles. Use shadcn `Input`, `Button`. |
| `src/app/dashboard/page.tsx` | Replace inline styles in page layout. |
| `src/app/report/[id]/page.tsx` | Replace inline styles. |
| `src/app/auth/page.tsx` | Replace inline styles in auth form. Use shadcn `Input`, `Button`, `Label`. |
| `src/app/support/page.tsx` | Replace inline styles. |

#### 3c. Standalone components
| File | Key changes |
|---|---|
| `src/components/AuditRunningLoader.tsx` | Replace inline styles. Move embedded `<style>` keyframes to globals.css. Keep Lottie as-is. |

**Estimated scope:** 11+ files migrated

---

### Phase 4: Cleanup

**Goal:** Remove dead code, unused dependencies, and legacy patterns.

| Task | Details |
|---|---|
| Remove unused global CSS classes | Delete `.form-field`, `.card`, `.card-hover`, `.card-row`, `.hero-section`, `.scroll-subtle`, `.text-label-*`, `.text-copy-*`, `.text-button-*`, `.display-heading`, `.caption`/`small`, `.input-large` from `globals.css` |
| Remove `@tabler/icons-react` | After all Tabler icons are replaced with Lucide (except brand icons in Footer — inline those as SVG or keep Tabler as optional peer dep) |
| Audit `tokens.css` | Remove any variables that are no longer referenced (check with grep). Keep as source of truth for values even if they're now mapped through `@theme`. |
| Remove popover animation classes | After Topbar/SearchableSelect use shadcn Popover (Radix handles its own animations) |
| Remove embedded `<style>` tags | After moving all keyframe animations to `globals.css` |
| Verify dark mode | Ensure all new Tailwind classes respect the `.dark` variant (existing oklch mappings should handle this) |

**Estimated scope:** `globals.css` shrinks by ~150 lines, 1 npm dependency removed

---

## Landing Page: Out of Main Scope

The landing page (`src/app/page.tsx`, `HowItWorks.tsx`, `Footer.tsx`) has its own design system with `--lp-*` tokens and `.lp-*` CSS classes. It uses a fundamentally different visual language (beige background, different typography scale, glassmorphism effects).

**Recommendation:** Migrate the landing page in a **separate effort** after the main app is unified. The LP classes in `globals.css` are already scoped via `.lp-root` / `.lp-page` and don't interfere with the app. Tackling it now would double the scope without benefiting the main product UI.

When the LP migration happens, the same approach applies: replace inline styles with Tailwind, use shadcn `Accordion` for FAQ, and clean up the `.lp-*` classes.

---

## Migration Checklist Per Component

Use this checklist when migrating any component:

- [ ] Replace all `style={{}}` objects with Tailwind utility classes
- [ ] Replace hardcoded hex colors with token-mapped Tailwind classes (see Part A table)
- [ ] Replace `var(--token)` references with Tailwind classes where mapped
- [ ] Replace `onMouseEnter`/`onMouseLeave` hover handlers with Tailwind `hover:` variants
- [ ] Replace custom `<button>` elements with shadcn `<Button>` where applicable
- [ ] Replace custom form inputs with shadcn `<Input>`, `<Label>`, `<Textarea>`
- [ ] Replace Tabler icon imports with Lucide equivalents (see Part D table)
- [ ] Use `cn()` utility for conditional class merging (not ternary string concatenation)
- [ ] Remove any embedded `<style>` tags — move animations to `globals.css`
- [ ] Test hover states, focus rings, disabled states, and transitions
- [ ] Verify responsive behavior matches the original
