# Design system

MunLink should feel trustworthy, locally grounded, and easy to use on low-power mobile devices. Existing application components and CSS are the implementation source of truth; this document records the durable conventions.

## Principles

- Design mobile-first and enhance at `md` and larger breakpoints.
- Use clear government-service language and visible status feedback.
- Reuse application or shared UI components before adding another variant.
- Meet WCAG AA contrast and keyboard requirements.
- Respect `prefers-reduced-motion`.
- Keep decorative motion subtle and avoid blocking content.

## Color roles

| Role | Typical use |
| --- | --- |
| Ocean/sky | Primary navigation, links, document services, main actions |
| Forest/emerald | Success, verified and approved states |
| Sunset/amber | Warnings, marketplace, and program emphasis |
| Rose/red | Errors, urgent notices, destructive actions |
| Purple | Superadmin and exceptional administrative tools |
| Slate/white | Text, borders, page surfaces, and cards |

Do not use color alone to communicate status. Pair it with a label or icon.

## Typography and spacing

- Prefer the existing system font stack.
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

- Buttons: primary, secondary, ghost, success, and danger roles must remain visually distinct.
- Cards: use consistent radius, border, padding, and elevation.
- Status: use the existing pill and badge patterns.
- Loading: prefer skeletons for content and spinners for short actions.
- Empty states: explain what is absent and offer one clear next action when available.
- Modals: trap focus, support Escape, label the dialog, and restore focus on close.

## Motion

- Micro-interactions: about 150 to 200 ms.
- Dialog and page transitions: about 200 to 300 ms.
- Animate opacity and transforms rather than layout properties.
- Disable nonessential animation when reduced motion is requested.
- Avoid parallax and continuous effects on mobile unless performance has been measured.

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
