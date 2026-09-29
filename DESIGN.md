# DESIGN.md — AgriSaarthi

Brand contract. All UI work builds against this. One-line change here beats regenerating screens.

## Palette
- Primary deep agricultural green: #1B4332 (actions, headers, trust)
- Secondary olive / muted green: #6B7F59 (secondary elements, charts)
- Accent warm gold: #D4A017 (highlights, CTAs, premium touch)
- Neutrals: warm off-white #FAF7F0 (bg), soft beige #F0EAD6 (cards), charcoal #1A1A1A (text)
- Risk: orange #E76F51 / red #C1121F — only for actual warnings
- Success: natural green #2D6A4F
- Dark theme: bg #12140F, surface #1E241B, text #F2EFE6, gold stays #D4A017

## Typography
- Body: Inter (Latin) + Noto Sans Devanagari (Hindi/Marathi) — one stack, no font swapping per language
- Display: Fraunces or Cormorant for hero numbers only (price, risk score)
- Scale: 12 caption / 14 body / 16 title / 20 headline / 28 hero. Numbers use tabular-nums.
- Min body 14sp on mobile. Buttons 16sp semibold. Never rely on color alone — risk always icon + text label.

## Layout
- Mobile-first, single column, max width 480dp content. Bottom tab bar: HOME / MY FARM / SCAN / AI / MORE.
- Home rhythm: greeting → farm chips → "What should I do today?" (3–5 cards) → Ask AgriSaarthi bar (sticky bottom).
- Cards: 16dp radius, 1dp warm border, soft shadow. Section gap 24dp. Touch targets min 48dp.
- One-handed: primary actions in bottom third. No top-only controls.

## Mood
Calm, intelligent, premium. Premium fintech + health-tech + Indian agricultural context. Human, not corporate. No government-portal energy.

## Density
Balanced. Spacious on Home (one idea per card), compact in lists (market rows, alerts).

## Components
- Buttons: 14dp radius, solid deep green primary / outline secondary. Full-width on forms.
- Cards: beige surface, charcoal text, gold accent only for priority 1.
- Badges/Chips: icon + text (e.g. "▲ HIGH RISK"), never color-only.
- Bottom sheets for filters and confirmations. Skeletons for loading. Empty/error states tell the user what to do next.
- Charts: minimal, olive line, gold marker. Predictions labeled "ESTIMATED TREND".

## Motion
- Subtle spring on card entrance, bottom-sheet slide, scan-line animation on camera. 200–300ms. Respect prefers-reduced-motion.
- Never animate for decoration. Loading → skeleton, not spinner walls.

## Exclusions
- No leaf-green gradients, no cartoon farmers, no stock farm illustrations, no generic plant icons everywhere.
- No desktop-like tables on mobile. No 10-tab navigation. No hardcoded English strings.
- No AI output presented as guaranteed truth ("Probable", "Estimated", "Potentially relevant").

## Responsive
- Small Android (360dp) → large Android / iPhone (430dp): single column holds, type scales up one step at 400dp+.
- Web admin is separate and responsive; farmer UI never becomes a dashboard.
- Dark mode: full token swap, contrast ≥ 4.5:1 for body text.
