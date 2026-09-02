# Foundations and Components

> Translate shared Openings design foundations into native component contracts.

## Typography

Figtree owns display, interface, and body roles. Geist Mono owns tabular result
counts, repository identifiers, and other technical metadata. Both families are
bundled through the Expo font plugin in regular, medium, and semibold weights.
Build hierarchy with scale, spacing, and tonal contrast rather than maximum weight.

Text must respect system font scaling and remain usable with long translations.
Technical identifiers and compact version or source metadata may use the shared mono
role.

## Color

Components consume semantic theme roles from `@openingshq/design-tokens`:

- canvas and paper establish surface hierarchy;
- foreground, muted foreground, and subtle foreground establish text hierarchy;
- line provides low-contrast structural boundaries;
- primary and primary foreground define the prioritized action;
- primary deep supports accessible accent text in the light theme;
- supporting editorial and semantic roles remain distinct.

Do not repeat primitive hex values in application components. Light and dark themes
use the same role names with purpose-built values.

## Spacing, shape, and elevation

Use the shared 4-point rhythm and semantic spacing values. Maintain at least a
44-point touch target even when the visible control is smaller. Compact controls,
cards, large panels, and pills use their shared radius roles rather than arbitrary
per-screen values.

NativeWind resolves `rem` with a 16-point baseline so conventional Tailwind spacing
matches the responsive web surface (`px-4` is 16 points and `h-11` is 44 points).
Raw spacing primitives from the public token package are namespaced as `space-*`
utilities and must not replace Tailwind's numeric scale.

Default boundaries are 1-point low-contrast hairlines. Diffuse elevation belongs to
dialogs, sheets, menus, and other truly floating native surfaces. Content hierarchy
should not depend on a stack of nested cards.

## Component states

Every reusable interactive component must account for its applicable states:

- default and pressed;
- focused or screen-reader selected;
- disabled;
- loading;
- validation error or destructive intent;
- light and dark themes;
- reduced motion;
- large text and translated labels.

State cannot rely on color alone. Pair color with text, iconography, structure, or
native accessibility state.

## Content patterns

The global application header uses the canonical monochrome Openings wordmark geometry and
a 44-point menu trigger. The right-side drawer contains only Jobs, Communities,
Authors, the public GitHub support card, and compact appearance and language
controls. Preferences open as bounded popovers above the drawer footer. Wordmark
color follows the semantic foreground role; do not introduce a separate mobile
logo treatment.

The Jobs discovery workspace keeps search, country, stack or technology, and the
More action visible. Discovery shortcuts and the complete filter taxonomy live in
the native More sheet, which exposes selected state, a filter count, clear behavior,
and a result-count action. Active filters remain removable from the workspace. This
is the native equivalent of the responsive web contract, not a literal DOM layout.

Opportunity discovery should prioritize scanning: role, organization or community,
location and work model, salary when supplied, technology and seniority, author or
repository context, and posting recency. Missing optional data remains absent; never
invent values to balance a card.

When device-local history contains relevant listings from after the previous visit,
Jobs shows the mint `New matches for you` callout between discovery controls and the
result toolbar. Dismissal persists locally and the action applies the existing
`newOnly` filter contract.

Job details use a wordmark/X header, identity-first hierarchy, 32-point title,
`Data confidence` card, and a fixed safe-area action dock. The dock exposes opening
the original listing, sharing, saving, and reporting as four independent 44-point
actions. `Data confidence` shows verification availability, publication time,
source count, ordered provenance fields, and source links without inventing missing
facts. Community and author screens are identity-led destinations, not generic
search results with a label changed.

Lucide React Native is the application icon language. Use the icon that matches the
responsive web surface, an explicit semantic color, and a consistent 1.8 stroke.
Do not introduce Feather or platform-specific substitute glyphs in product UI.

## Accessibility and motion

Use explicit labels and hints, logical reading order, minimum touch targets, visible
focus where applicable, and announcements for meaningful asynchronous results.
Respect safe areas and keyboard geometry. Restore focus after dismissing a modal or
sheet when the native navigation primitive does not do so automatically.

Motion explains continuity, orientation, or feedback. Prefer short opacity and small
transform transitions. Remove non-essential translation, stagger, parallax, and
loops when reduced motion is enabled.
