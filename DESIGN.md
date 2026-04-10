# Design System of Datadog (DRUIDS)

## 1. Visual Theme & Atmosphere

Datadog's website is a dense, information-rich monitoring platform where clarity is survival — operators glance at dashboards at 3 AM during incidents, so every pixel must earn its place. The design system, called **DRUIDS** (Datadog React UI Design System), is built for high-density data display on both light and dark canvases, where the light theme (`#ffffff` background) serves as the default and the dark theme (`#1d1c1f`) provides an equally mature alternative for low-light environments. A high-contrast accessibility mode layers on top of both themes, tightening color distinctions for users who need sharper visual separation.

The typography is grounded in **Noto Sans** — a utilitarian, globally-readable typeface chosen for its massive Unicode coverage (Datadog serves international infrastructure teams) with fallbacks to Lucida Grande and system sans-serif. **Roboto Mono** handles all code, metrics, and technical labels with a slight negative letter-spacing (`-0.01em`) that tightens monospaced content without sacrificing readability. Font sizes are deliberately compact: the default body is just 13px, with a scale that tops out at 23px — this is a tool, not a magazine. Weights run from thin (300) through normal (400) to semibold (600) and bold (700), with 400 doing most of the work.

The color system is methodically organized into **underlying palettes** (blue, red, amber, yellow, green, purple, pink, indigo — each with 7 graduated steps from 100–700) and **semantic tokens** that map these palettes to functional roles. Every semantic color has four variants: light, lightContrast, dark, and darkContrast. The primary interaction color is a confident blue (`#006bc2` light / `#3d8bd0` dark), danger is a clear red (`#eb364b` / `#d33043`), and the Datadog brand is expressed through purple (`#632ca6` / `#561d8c`). Text colors use opacity-based hierarchy rather than distinct hex values — primary text is 98% opacity in light mode, dropping to 76% in dark mode, with secondary and tertiary text at progressively lower opacities.

**Key Characteristics:**
- Light-first with fully mature dark mode: `#ffffff` (light bg) / `#1d1c1f` (dark bg), plus high-contrast variants
- Noto Sans at compact sizes (8px–23px, default 13px) for information density
- Roboto Mono with `-0.01em` letter-spacing for metrics and code
- Opacity-based text hierarchy: 98%/68%/50%/35% (light) and 76%/51%/38%/24% (dark)
- Blue as primary interaction (`#006bc2`), purple as brand (`#632ca6`), pink as callout (`#ff0099`)
- 7-level shadow system with `rgba(36, 41, 49, 0.1)` base tint
- CSS custom properties (`--ui-*`) for all semantic tokens, enabling runtime theming
- 8px base spacing grid: 2px, 4px, 8px, 16px, 24px, 32px, 48px
- BEM-style class naming with `druids_` prefix (e.g., `druids_form_button`)
- Component heights from 16px (xxs) to 52px (xxl) for consistent interactive element sizing

## 2. Color Palette & Roles

### Background Surfaces
- **Primary Background** (`--ui-background`): `#ffffff` (light) / `#1d1c1f` (dark) — the base canvas for all content.
- **Secondary Background** (`--ui-background-secondary`): `#f9fafb` (light) / `#222126` (dark) — sidebars, panels, alternating rows.
- **Tertiary Background** (`--ui-background-tertiary`): `#e2e5ed` (light) / `#3b393d` (dark) — deeper nesting, inset areas.
- **Elevated Background** (`--ui-background-elevated`): equals primary (light) / equals secondary (dark) — floating surfaces like cards and dropdowns.
- **Shade Background** (`--ui-background-shade`): `#464b59` (light) / `#3b393d` (dark) — dark overlays, tooltip backgrounds.
- **Shade Faded** (`--ui-background-shade-faded`): 90% opacity variant of shade — scrim overlays behind modals.

### Text & Icons
- **Primary Text** (`--ui-text`): `#1c2b34` at 98% opacity (light) / `#ffffff` at 76% opacity (dark) — headings, body copy, primary labels.
- **Secondary Text** (`--ui-text-secondary`): 68% opacity (light) / 51% opacity (dark) — descriptions, secondary labels, helper text.
- **Tertiary Text** (`--ui-text-tertiary`): 50% opacity (light) / 38% opacity (dark) — placeholders, timestamps, metadata.
- **Disabled Text** (`--ui-text-disabled`): 35% opacity (light) / 24% opacity (dark) — inactive states, disabled controls.
- **Knockout Text** (`--ui-text-knockout`): `#ffffff` in both themes — text on colored backgrounds (buttons, badges).
- **Primary Icon** (`--ui-icon`): 66% opacity (light) / 48% opacity (dark) — standard icons.
- **Secondary Icon** (`--ui-icon-secondary`): 46% opacity (light) / 34% opacity (dark) — de-emphasized icons.

### Interaction Colors
- **Primary Interaction** (`--ui-interaction-primary`): `#006bc2` (light) / `#3d8bd0` (dark) — links, selected states, primary buttons. High-contrast: `#0953bf` / `#2471bf`.
- **Primary Interaction Contrast** (`--ui-interaction-primary-contrast`): `#0953bf` (light) / `#579fdd` (dark) — hover/active on primary interaction.
- **Secondary Interaction** (`--ui-interaction-secondary`): `#eaf6fc` (light) / `#091222` (dark) — selected row backgrounds, soft highlights.
- **Callout** (`--ui-interaction-callout`): `#ff0099` (light) / `#e50089` (dark) — promotional badges, attention-grabbing accents.

### Status Colors
- **Danger** (`--ui-status-danger`): `#eb364b` (light) / `#d33043` (dark) — errors, critical alerts, destructive actions. Soft: `#fdebed` / `#2f0a0f`.
- **Warning** (`--ui-status-warning`): `#f99d02` (light) / `#cc9022` (dark) — warnings, caution states. Soft: `#fff6e3` / `#332408`.
- **Success** (`--ui-status-success`): `#41c464` (light) / `#349c50` (dark) — healthy, passing, completed. Soft: `#ecf9ef` / `#0d2714`.
- **In Progress** (`--ui-status-in-progress`): `#9364cd` (light) / `#67309e` (dark) — running, deploying, active processes. Soft: `#f2ecfc` / `#22053e`.
- **Other/Neutral** (`--ui-status-other`): `#828ba4` (light) / `#65626a` (dark) — unknown, paused, default states. Soft: `#eff1f5` / `#2c2b2b`.
- **Important** (`--ui-important`): `#facc00` (light) / `#ebcf61` (dark) — starred items, pinned content.

### Brand & AI
- **Brand Purple** (`--ui-brand`): `#632ca6` (light) / `#561d8c` (dark) — Datadog brand marks, branded UI elements.
- **AI Primary** (`--ui-ai-primary`): `#5e6dd6` (both themes) — AI/ML feature accents, Bits AI indicators.
- **AI Background** (`--ui-ai-background-primary`): `#f0f2ff` (light) / `#080a1a` (dark) — AI feature surface tinting.

### Border & Dividers
- **Border** (`--ui-border`): `#e2e5ed` (light) / `#3b393d` (dark) — standard borders, dividers, input outlines. High-contrast: `#6a7287` / `#a19fa3`.
- **Elevated Border** (`--ui-border-elevated`): transparent (light) / `#272626` (dark) — borders on elevated surfaces, visible only when needed.
- **Placeholder** (`--ui-placeholder`): 50% of `#e2e5ed` (light) / 75% of `#2c2b2b` (dark) — skeleton loaders, empty states.

### Data Visualization
- **Dataviz Blue** (`--ui-dataviz-blue`): `#3598ec` (light) / `#6b9cc8` (dark) — default graph series color.
- **Graph Axis** (`--ui-dataviz-graph-axis`): inherits `--ui-text` — axis labels and ticks.
- **Disabled Series** (`--ui-dataviz-graph-disabled-series`): `#c2c8dd` (light) / `#2c2b2b` (dark) — muted/hidden graph series.

### Code Syntax Highlighting
- **Code Background** (`--ui-code-background`): 5% of `#585f70` (light) / 5% of `#ffffff` (dark)
- **Code Text**: `#1c2b34` (light) / `#e6e6e6` (dark)
- **String**: `#038043` (light) / `#43d698` (dark)
- **Keyword**: `#e01b73` (light) / `#ff80b6` (dark)
- **Function**: `#2c63db` (light) / `#5bceff` (dark)
- **Boolean**: `#6b37ab` (light) / `#c48cff` (dark)
- **Comment**: `#6a7287` (light) / `#8f969a` (dark)
- **Operator**: `#008645` (light) / `#41eba4` (dark)
- **Delimiter**: `#d97e00` (light) / `#fec866` (dark)
- **Selection**: `#e2e5ed` (light) / `#3b393d` (dark)

### Underlying Color Palettes (Full Scale)

| Color   | 100 (L/D)        | 200 (L/D)        | 300 (L/D)        | 400 (L/D)        | 500 (L/D)        | 600 (L/D)        | 700 (L/D)        |
|---------|-------------------|-------------------|-------------------|-------------------|-------------------|-------------------|-------------------|
| Blue    | `#f3f9fc`/`#091222` | `#eaf6fc`/`#09245b` | `#71b8e7`/`#2471bf` | `#4e91d1`/`#3d8bd0` | `#006bc2`/`#579fdd` | `#0953bf`/`#7ab5ea` | `#0b0f8b`/`#a4cef7` |
| Red     | `#fdebed`/`#2f0a0f` | `#fbd6db`/`#5e151e` | `#fc9da8`/`#7c1d29` | `#f66f78`/`#a62536` | `#eb364b`/`#d33043` | `#bc2b3c`/`#eb364b` | `#922c35`/`#ed4f61` |
| Amber   | `#fff6e3`/`#332408` | `#ffe6a2`/`#664811` | `#fecf60`/`#8b6217` | `#fcc028`/`#b27e1e` | `#f99d02`/`#cc9022` | `#f27c00`/`#e5a226` | `#de5f0c`/`#fec866` |
| Green   | `#ecf9ef`/`#0d2714` | `#d9f3e0`/`#133a1d` | `#96dda2`/`#1e592c` | `#70d182`/`#297a3e` | `#41c464`/`#349c50` | `#39b15d`/`#40ab5e` | `#2a7e41`/`#52b76d` |
| Purple  | `#f2ecfc`/`#22053e` | `#e6d6f9`/`#320e51` | `#cbb1ed`/`#401a69` | `#b48fe1`/`#561d8c` | `#9364cd`/`#67309e` | `#632ca6`/`#7c3eb9` | `#451481`/`#a26dd8` |
| Pink    | `#fff7fc`/`#240015` | `#fff2fa`/`#33001e` | `#ffe6f5`/`#461230` | `#ffb3e0`/`#66003d` | `#ff0099`/`#e50089` | `#af0069`/`#f572b3` | `#660036`/`#ef94c3` |
| Indigo  | `#f0f2ff`/`#080a1a` | `#d9deff`/`#1d2140` | `#b0b7eb`/`#2e3566` | `#8792e0`/`#3f4ca5` | `#5e6dd6`/`#5e6dd6` | `#3f4ca5`/`#8792e0` | `#2e3566`/`#b0b7eb` |

### Gray Scale

| Step | Light     | Dark      |
|------|-----------|-----------|
| 25   | `#f9fafb` | `#222126` |
| 50   | `#eff1f5` | `#272626` |
| 75   | `#e2e5ed` | `#2c2b2b` |
| 100  | `#d1d6e6` | `#3b393d` |
| 125  | `#c2c8dd` | `#424045` |
| 150  | `#b4bcd4` | `#49474d` |
| 175  | `#a9b1c7` | `#56535a` |
| 200  | `#9da4b9` | `#65626a` |
| 300  | `#828ba4` | `#726e77` |
| 400  | `#6a7287` | `#858387` |
| 500  | `#585f70` | `#a19fa3` |
| 600  | `#464b59` | `#bebbc0` |
| 700  | `#373b46` | `#d4d1d6` |
| 800  | `#242931` | `#e6e4e7` |

## 3. Typography Rules

### Font Family
- **Primary**: `'NotoSans', 'Lucida Grande', 'Lucida Sans Unicode', sans-serif`
- **Monospace**: `'Roboto Mono', Menlo, 'Liberation Mono', Courier, monospace`
- **Monospace Letter Spacing**: `-0.01em` (applied globally to all monospace text)

### Hierarchy

| Role | Font | Size | Weight | Notes |
|------|------|------|--------|-------|
| Display | Noto Sans | 23px (xxl) | 700 (bold) | Page titles, hero headlines |
| Heading 1 | Noto Sans | 18px (xl) | 700 (bold) | Major section headings |
| Heading 2 | Noto Sans | 15px (lg) | 600 (semibold) | Sub-section headings |
| Body Default | Noto Sans | 13px (md) | 400 (normal) | Standard body text, labels, descriptions |
| Body Small | Noto Sans | 12px (sm) | 400 (normal) | Secondary text, metadata, table cells |
| Body XS | Noto Sans | 11px (xs) | 400 (normal) | Fine print, badges, compact labels |
| Micro | Noto Sans | 8px (xxs) | 400 (normal) | Sparkline labels, minimal annotations |
| Body Semibold | Noto Sans | 13px (md) | 600 (semibold) | Emphasized labels, navigation items |
| Body Thin | Noto Sans | 13px (md) | 300 (thin) | De-emphasized content, subtle labels |
| Code Default | Roboto Mono | 13px (md) | 400 (normal) | Inline code, log lines, metric names |
| Code Small | Roboto Mono | 12px (sm) | 400 (normal) | Code blocks, terminal output |

### Principles
- **Density is the default**: 13px body text is compact by design — Datadog users scan dashboards, logs, and traces where information density matters more than reading comfort.
- **Four-weight system**: 300 (de-emphasize), 400 (read), 600 (emphasize), 700 (announce). Weight 400 handles the vast majority of text.
- **Noto Sans for internationalization**: Chosen for its extensive Unicode coverage across CJK, Arabic, Devanagari, and other scripts — infrastructure teams are global.
- **Monospace tightening**: `-0.01em` on Roboto Mono subtly compresses metric names and code without hurting legibility, allowing more data per screen.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `var(--ui-interaction-primary)` → `#006bc2` (light) / `#3d8bd0` (dark)
- Text: `var(--ui-text-knockout)` → `#ffffff`
- Height: `md` (28px) default, scales from `xs` (20px) to `xxl` (52px)
- Padding: horizontal, scales with size
- Radius: `4px` (`border-radius-md`)
- Border: `1px solid` transparent
- Hover: `var(--ui-interaction-primary-contrast)` → `#0953bf` (light) / `#579fdd` (dark)
- Use: Primary CTAs, form submission, critical actions

**Success Button**
- Background: `var(--ui-status-success)` → `#41c464` (light) / `#349c50` (dark)
- Text: `#ffffff`
- Use: Confirm, save, complete actions

**Warning Button**
- Background: `var(--ui-status-warning)` → `#f99d02` (light) / `#cc9022` (dark)
- Text: `#ffffff`
- Use: Cautionary actions, proceed-with-care

**Danger Button**
- Background: `var(--ui-status-danger)` → `#eb364b` (light) / `#d33043` (dark)
- Text: `#ffffff`
- Use: Delete, remove, destructive actions

**Default Button**
- Background: `var(--ui-background)` with border
- Text: `var(--ui-text)`
- Border: `1px solid var(--ui-border)`
- Use: Secondary actions, cancel, back

**Soft Button**
- Background: subtle tinted background
- Text: inherits from variant color
- Border: none
- Use: Tertiary actions, inline controls

**Borderless Button**
- Background: transparent
- Text: `var(--ui-interaction-primary)`
- Border: none
- Use: Inline links disguised as buttons, compact toolbars

**Hidden Button**
- Background: transparent
- Text: `var(--ui-text-secondary)`
- Border: none, appears on hover
- Use: Contextual actions that appear on hover

**Button Sizes**

| Size | Height | Use |
|------|--------|-----|
| xs   | 20px   | Inline badges, compact toolbars |
| sm   | 24px   | Table actions, small forms |
| md   | 28px   | Default — most buttons |
| lg   | 36px   | Prominent actions, hero CTAs |
| xl   | 44px   | Touch-friendly, large forms |
| xxl  | 52px   | Landing page CTAs |

### Cards & Containers
- Background: `var(--ui-background)` or `var(--ui-background-elevated)`
- Border: `1px solid var(--ui-border)` → `#e2e5ed` (light) / `#3b393d` (dark)
- Radius: `4px` (default), `8px` (featured), `16px` (large panels)
- Shadow: level 1–3 depending on elevation (see Section 6)
- Padding: `16px` (md) default content padding

### Inputs & Forms

**Text Input**
- Background: `var(--ui-background)`
- Text: `var(--ui-text)` at 13px normal
- Border: `1px solid var(--ui-border)`
- Placeholder: `var(--ui-text-tertiary)`
- Height: matches button sizes (default md: 28px)
- Radius: `4px`
- Focus: `0 0 3px var(--ui-interaction-primary)` shadow ring

**Validation States**
- Danger: red border + icon (inline: icon with hover tooltip; block: icon + message below)
- Warning: amber border + icon
- Success: green border + icon

**Checkbox / Switch / Radio**
- Checked: `var(--ui-interaction-primary)` background
- Unchecked: `var(--ui-border)` border
- Radius: `4px` (checkbox), `50%` (radio), pill (switch)

### Navigation
- **Product Header**: sticky top bar, `var(--ui-background)` with bottom `var(--ui-border)` border
- **Vertical Nav**: left sidebar, `var(--ui-background-secondary)` background
- **TabList**: horizontal tabs with underline active indicator in `var(--ui-interaction-primary)`
- **BreadcrumbsElement**: slash-separated with `var(--ui-text-secondary)` inactive items
- **Link**: `var(--ui-interaction-primary)` text, underline on hover

### Badges & Pills

**Status Pill**
- Background: soft variant of status color (e.g., `var(--ui-status-danger-soft)`)
- Text: contrast variant of status color (e.g., `var(--ui-status-danger-contrast)`)
- Radius: `4px`
- Font: 12px (sm) semibold
- Use: Status indicators in tables, lists

**Feature Status Label**
- Variants: beta, preview, new, deprecated
- Compact inline badge with appropriate status coloring

### Tables
- Header: `var(--ui-background-secondary)` background, semibold text
- Row: `var(--ui-background)`, alternating optional
- Selected row: `var(--ui-interaction-secondary)` background
- Hover: subtle `var(--ui-background-secondary)` tint
- Border: `1px solid var(--ui-border)` between rows
- Cell padding: `8px` (sm) vertical, `16px` (md) horizontal

### Modals & Dialogs
- Background: `var(--ui-background-elevated)`
- Overlay/scrim: `var(--ui-background-shade-faded)` (90% opacity dark overlay)
- Radius: `8px` (lg)
- Shadow: level 5–6 (heavy elevation)
- Padding: `24px` (lg) content area

### Tooltip & Popover
- Tooltip: `var(--ui-background-shade)` background, `var(--ui-text-knockout)` text, `4px` radius
- Popover: `var(--ui-background-elevated)` background, `var(--ui-border)` border, `8px` radius, shadow level 3+
- Delay: none (0ms), minimal (100ms), short (300ms), long (500ms)

### Icons
- 439 SVG icons available via `@druids/ui/icons/`
- Sizes: xs, sm, md, lg, xl, xxl (matching typography scale)
- Color: `var(--ui-icon)` default, `var(--ui-icon-secondary)` for de-emphasis
- Import: `import { CheckIcon } from '@druids/ui/icons/Check'`

### Loading States
- `LoadingIndicator`: spinner component for async content
- Skeleton patterns using `var(--ui-placeholder)` backgrounds
- Disabled patterns using `var(--ui-pattern-disabled)` gradient overlay

## 5. Layout Principles

### Spacing System
- **Base unit**: 8px
- **Scale**: `none` (0), `xxs` (2px), `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `xxl` (48px)
- Spacing tokens are used as props on `<Flex>`, `<Grid>`, and `<Spacing>` components: `gap="md"`, `padding="lg"`

### Grid & Layout Components
- **Flex** (`<Flex>`): Primary layout primitive — flexbox with semantic gap, direction, alignment, justification props
- **Grid** (`<Grid>`): CSS Grid with configurable template columns/rows, auto-fit/auto-fill
- **FlexItem / GridItem**: Child wrappers for explicit sizing and ordering
- **Spacing** (`<Spacing>`): Explicit padding/margin utility component
- **SidePanel**: Slide-out panels from right edge
- **Panel**: Fixed side-by-side layout panels

### Whitespace Philosophy
- **Functional density**: Datadog is a monitoring tool — users need to see as much data as possible without scrolling. Spacing is tight but consistent.
- **8px rhythm**: All spacing follows the 8px grid. The 2px and 4px values exist for micro-adjustments (badge padding, icon gaps) but the primary rhythm is 8-16-24-32-48.
- **Component padding matches height**: Form elements and buttons share a height scale (16–52px), ensuring vertical rhythm when components sit side by side.

### Border Radius Scale
- **Standard** (4px / `md`): Buttons, inputs, badges, cards — the default for nearly everything
- **Comfortable** (8px / `lg`): Featured cards, modals, popovers, panels
- **Large** (16px / `xl`): Landing page elements, large promotional cards
- **Circle** (50%): Avatars, status dots, radio buttons

## 6. Depth & Elevation

### Shadow Levels

| Level | Treatment | Use |
|-------|-----------|-----|
| Base | `0 0 1px rgba(36, 41, 49, 0.1)` | Subtle edge definition, always present as foundation |
| 1 | Base + `0 1px 2px var(--ui-shadow-strength)` | Slight lift — cards at rest, input fields |
| 2 | Base + `0 1px 5px var(--ui-shadow-strength)` | Moderate lift — hovered cards, dropdown triggers |
| 3 | Base + `0 2px 8px var(--ui-shadow-strength)` | Clear elevation — popovers, tooltips, context menus |
| 4 | Base + `0 3px 11px var(--ui-shadow-strength)` | Strong elevation — side panels, drawers |
| 5 | Base + `0 5px 20px var(--ui-shadow-strength)` | High elevation — modals, command palettes |
| 6 | Base + `0 8px 36px var(--ui-shadow-strength)` | Maximum elevation — critical overlays |
| Focus | `0 0 3px [interaction-color]` | Keyboard focus ring on interactive elements |

**Shadow Strength Variable** (`--ui-shadow-strength`):
- Light: `rgba(36, 41, 49, 0.25)` — subtle, cool-gray shadows
- Light Contrast: `rgba(36, 41, 49, 0.5)` — doubled intensity for accessibility
- Dark: `rgba(9, 9, 11, 0.88)` — near-opaque, very dark shadows on dark surfaces
- Dark Contrast: `rgba(9, 9, 11, 1)` — fully opaque for maximum visibility

### Z-Index Elevation Scale

| Level | Z-Index | Use |
|-------|---------|-----|
| Behind | -1 | Background decorations, hidden layers |
| Base | 0 | Standard content flow |
| Content Header | 90 | Sticky section headers within content |
| Nav Background | 100 | Navigation background layer |
| Side Panel | 210 | Slide-out side panels |
| Nav Active | 300 | Active navigation overlay |
| Nav Submenu | 310 | Dropdown submenus in navigation |
| Top | 9999 | Toasts, critical system overlays |

### Shadow Philosophy
Datadog uses a **dual-layer shadow system**: every shadow starts with a `0 0 1px rgba(36, 41, 49, 0.1)` base layer that provides a crisp edge definition, then adds a softer, larger spread shadow for the actual elevation effect. The `--ui-shadow-strength` variable allows the same shadow definitions to work across light and dark themes — dark mode shadows are dramatically stronger (`0.88` vs `0.25` opacity) because dark-on-dark requires more contrast to be perceptible.

## 7. Do's and Don'ts

### Do
- Use semantic CSS variables (`--ui-text`, `--ui-background`, `--ui-interaction-primary`) — never hardcode hex values, as themes and contrast modes swap these at runtime
- Use the spacing scale tokens (`xxs` through `xxl`) for all padding, margin, and gap values — maintain the 8px rhythm
- Use opacity-based text hierarchy (`--ui-text`, `--ui-text-secondary`, `--ui-text-tertiary`) to create visual hierarchy without introducing new colors
- Set component heights using the size scale (`xs` through `xxl`) so buttons, inputs, and badges align on the same baseline grid
- Use `--ui-status-*` colors for semantic meaning: danger for errors, warning for caution, success for healthy, in-progress for active processes
- Provide both light and dark variants when creating custom themed elements — both themes are equally important
- Use `var(--ui-border)` for all structural borders — it adapts across themes and contrast modes
- Use `var(--ui-text-knockout)` for text on colored backgrounds (buttons, badges) — it's always white
- Apply shadow levels incrementally: resting cards at level 1, hover at level 2, floating overlays at level 3+

### Don't
- Don't use colors from the underlying palette (e.g., `blue.500`) directly — always go through semantic tokens (`--ui-interaction-primary`)
- Don't set font sizes outside the scale (8, 11, 12, 13, 15, 18, 23px) — the compact scale is deliberate for data density
- Don't use `border-radius` values outside the scale (4px, 8px, 16px) — consistency is critical across hundreds of components
- Don't add custom font weights — the system uses exactly 300, 400, 600, 700
- Don't use `z-index` values outside the elevation scale — ad-hoc z-indices cause stacking bugs in a complex app
- Don't use solid black (`#000000`) or pure white (`#ffffff`) for text — the opacity-based system ensures proper contrast in all themes
- Don't create shadows from scratch — use the 6-level shadow system with `--ui-shadow-strength`
- Don't use Tailwind classes, styled-components, or CSS-in-JS — DRUIDS uses LESS + CSS Modules
- Don't skip the `--ui-*` prefix system — components must work in light, dark, and high-contrast modes simultaneously

## 8. Responsive Behavior

### Breakpoints

| Name | Range | Key Changes |
|------|-------|-------------|
| Mobile (sm) | 0–749px | Single column, collapsible nav, stacked components |
| Tablet (md) | 750–1029px | Side nav may collapse, two-column layouts begin |
| Laptop (lg) | 1030–1199px | Full side nav, standard layout, full component rendering |
| Desktop (xl) | 1200–1999px | Full layout with generous spacing, dashboard grids expand |
| Ultra-wide (xxl) | 2000px+ | Maximum content width, extra columns in grids |

### Media Query Definitions
```css
@media screen and (max-width: 750px)     /* sm-only: mobile */
@media screen and (min-width: 750px)     /* md+: tablet and up */
@media screen and (min-width: 1030px)    /* lg+: laptop and up */
@media screen and (min-width: 1200px)    /* xl+: desktop and up */
@media screen and (min-width: 2000px)    /* xxl: ultra-wide */
```

### Touch Targets
- Minimum interactive element height: `xl` (44px) for touch interfaces
- Default button height: `md` (28px) for desktop, scale to `lg` (36px) or `xl` (44px) for touch
- Icon buttons maintain minimum 28px hit area even when visually smaller

### Collapsing Strategy
- **Navigation**: full vertical sidebar → hamburger menu at `sm`
- **Dashboards**: grid columns reduce proportionally, widgets stack below `md`
- **Tables**: horizontal scroll with sticky first column below `lg`
- **Side panels**: overlay full-screen on `sm`, push content on `lg+`
- **Forms**: multi-column → single column at `sm`
- **Modals**: full-width at `sm`, centered with max-width at `md+`

### Animation Behavior
- **Short duration**: `0.15s` (150ms) — micro-interactions: checkbox toggles, button state changes, tooltip show/hide
- **Standard duration**: `0.25s` (250ms) — panel slides, accordion expansion, modal entrance/exit
- Reduce motion: respect `prefers-reduced-motion` media query by disabling animations

## 9. Agent Prompt Guide

### Quick Color Reference
- Page Background: `#ffffff` (light) / `#1d1c1f` (dark)
- Secondary Background: `#f9fafb` (light) / `#222126` (dark)
- Primary Text: `rgba(28, 43, 52, 0.98)` (light) / `rgba(255, 255, 255, 0.76)` (dark)
- Secondary Text: `rgba(28, 43, 52, 0.68)` (light) / `rgba(255, 255, 255, 0.51)` (dark)
- Primary CTA: `#006bc2` (light) / `#3d8bd0` (dark)
- Danger: `#eb364b` (light) / `#d33043` (dark)
- Warning: `#f99d02` (light) / `#cc9022` (dark)
- Success: `#41c464` (light) / `#349c50` (dark)
- Border: `#e2e5ed` (light) / `#3b393d` (dark)
- Brand: `#632ca6` (light) / `#561d8c` (dark)
- AI Accent: `#5e6dd6` (both)

### Example Component Prompts
- "Create a Datadog-style dashboard card on `#ffffff` background. `1px solid #e2e5ed` border, `4px` radius, `16px` padding. Title at 15px Noto Sans weight 600, color `rgba(28,43,52,0.98)`. Subtitle at 13px weight 400, color `rgba(28,43,52,0.68)`. Primary action button: `#006bc2` background, `#ffffff` text, 28px height, `4px` radius."
- "Build a status table row: `#ffffff` background with `1px solid #e2e5ed` bottom border. Left cell: 13px Noto Sans weight 400. Status badge: `#ecf9ef` background, `#2a7e41` text, `4px` radius, 12px weight 600. Hover state: `#f9fafb` background."
- "Design a form input group: label at 12px Noto Sans weight 600, color `rgba(28,43,52,0.98)`. Input: 28px height, `#ffffff` background, `1px solid #e2e5ed` border, `4px` radius, 13px normal text. Focus: `0 0 3px #006bc2` ring. Error state: `1px solid #eb364b` border with `#eb364b` icon."
- "Create a navigation sidebar: `#f9fafb` background, `1px solid #e2e5ed` right border. Menu items: 13px Noto Sans weight 400, color `rgba(28,43,52,0.68)`. Active item: `#eaf6fc` background, `#006bc2` text, weight 600. Icons at 16px, `rgba(28,43,52,0.66)` fill."
- "Build a dark-mode alert banner: `#2f0a0f` background, `1px solid #5e151e` border, `4px` radius, `16px` padding. Icon: `#d33043` fill. Text: 13px Noto Sans weight 400, `rgba(255,255,255,0.76)`. Dismiss button: borderless, `rgba(255,255,255,0.51)` text."

### Iteration Guide
1. Always use CSS custom properties (`--ui-*`) — never hardcode colors. If building for a single theme context, reference the resolved values from this document but keep the variable names in comments.
2. Stick to the 7-step font size scale: 8, 11, 12, 13, 15, 18, 23px. If 13px feels too small and 15px too large, use 13px with weight 600 for emphasis — don't invent a 14px.
3. Spacing is an 8px grid: 2, 4, 8, 16, 24, 32, 48px. If a gap feels too tight at 8px and too loose at 16px, use 8px — density wins in a monitoring tool.
4. Button and input heights share a scale (16, 20, 24, 28, 36, 44, 52px). Place them side-by-side at the same size for alignment.
5. Status colors are semantic and non-negotiable: red = danger, amber = warning, green = success, purple = in progress, gray = neutral. Don't repurpose status colors for decoration.
6. Every visible border should use `var(--ui-border)` — never `#ccc`, `#ddd`, or other approximations.
7. Shadows always start with the `0 0 1px rgba(36, 41, 49, 0.1)` base layer. Add the appropriate level shadow on top.
8. Test in both light and dark themes. If a color looks wrong in dark mode, you likely hardcoded a light-theme value instead of using a semantic token.
