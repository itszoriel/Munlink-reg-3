# Design system

MunLink should feel trustworthy, locally grounded, and easy to use on low-power mobile devices. Existing application components and CSS are the implementation source of truth; this document records the durable conventions.

## Principles

- Calm civic look: flat white and light-grey surfaces, 1 px slate borders, small radii (6 to 8 px), and one brand colour. No gradients, frosted glass, glow, hover-lift, scroll-triggered reveals, emoji or display serif.
- Design mobile-first and enhance at `md` and larger breakpoints.
- Use plain government-service language ("Log in", "Request a document") and visible status feedback.
- Reuse application or shared UI components before adding another variant.
- Meet WCAG AA contrast and keyboard requirements.
- Respect `prefers-reduced-motion` (both apps disable all animation and transitions under it).
- Never show placeholder or invented data in the interface; show an empty state instead.

## Color roles

| Role | Tokens | Typical use |
| --- | --- | --- |
| Navy (brand) | `navy-*` (`#243d6b` = 700) | Primary actions, links, active navigation, focus ring |
| Provincial green | `zambales-green` | The seal/brand mark only, never for actions |
| Emerald | `emerald-*` | Success, verified, approved |
| Amber | `amber-*` | Warnings and pending states |
| Red | `red-*` | Errors, urgent notices, destructive actions |
| Slate/white | `slate-*`, `#f6f7f9` page background | Text, borders, surfaces |

The legacy names `ocean`, `primary`, `sky`, `blue`, `indigo` and `cyan` all resolve to navy in `packages/ui/tailwind.preset.cjs`, and the old `bg-*-gradient` utilities render as flat colours, so older markup follows the brand. Use `navy-*` in new code. Every admin role and municipality shares the same palette; the role or municipality is named in text, not colour-coded.

Do not use color alone to communicate status. Pair it with a label or icon.

## Typography and spacing

- Inter for everything, headings included; `font-serif` maps to the same face.
- Use semibold headings, medium action labels, and normal-weight body text.
- Use `text-slate-900` for primary text and progressively lighter slate values for supporting text while preserving contrast.
- Follow the existing 4 px spacing scale and shared container utilities.
- Keep forms readable with clear labels, hints, validation, and required indicators.

## Responsive patterns

- Primary mobile/desktop split: `md` (`768px`).
- Stack page headers and filters on mobile.
- Use cards for dense tabular data below `md`; retain semantic tables on larger screens.
- Give touch targets a minimum 44 by 44 px active area.
- Use `min-w-0`, `truncate`, and `break-words` intentionally to prevent overflow.
- Present mobile dialogs as bottom sheets or near-full-screen panels when appropriate.

## Components

- Buttons: `.btn-primary` (solid navy), `.btn-secondary` (white, slate border), `.btn-ghost`, `.btn-danger`. Destructive row actions carry a text label, not just an icon.
- Cards: `rounded-lg`, `border-slate-200`, white, at most `shadow-sm`. Interactive cards change border colour on hover; they never move.
- Page headers: title, one line of context and at most two actions. Dashboards start with stat cards, not a hero banner.
- Photo backgrounds (public hero, sign-in panels) use a dark navy scrim (`bg-navy-950/75` or darker) so white text keeps contrast.
- Status: use the existing pill and badge patterns.
- Loading: prefer skeletons for content and spinners for short actions.
- Empty states: explain what is absent and offer one clear next action when available.
- Modals: trap focus, support Escape, label the dialog, and restore focus on close.

## Motion

- Colour and opacity changes only, about 120 to 150 ms. No parallax, marquees, floating or pulsing elements.
- Dialogs may fade in; content must never wait on an animation to become visible.

## Accessibility checklist

- Logical heading order and semantic landmarks.
- Visible `:focus-visible` state for every control.
- Keyboard access for all actions.
- Associated labels and useful error messages for inputs.
- Alternative text for meaningful images; empty alternative text for decoration.
- Live regions for asynchronous success or error feedback where needed.
- Tested contrast for text, icons, focus rings, and status badges.

## Where to implement

- Shared primitives: `packages/ui/src/`
- Resident-specific components and CSS: `apps/web/src/`
- Admin-specific components and CSS: `apps/admin/src/`
- Shared Tailwind configuration: `packages/ui/tailwind.preset.cjs`

When a user-visible component pattern changes, update this document only if the rule is reusable across multiple screens.
