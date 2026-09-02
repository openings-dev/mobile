# Foundations and Components

> Translate shared Openings design foundations into native component contracts.

## Typography

Figtree owns display, interface, and body roles in the current mobile foundation.
Use the shared display, body, and mono family mappings and prefer regular, medium,
and semibold weights. Build hierarchy with scale, spacing, and tonal contrast rather
than maximum weight.

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

The global tab header uses the canonical monochrome Openings wordmark geometry and
keeps language and appearance controls beside the brand. Wordmark color follows the
semantic foreground role; do not introduce a separate mobile logo treatment.

The Jobs discovery workspace keeps search, country, stack or technology, and the
More action visible. Discovery shortcuts and the complete filter taxonomy live in
the native More sheet, which exposes selected state, a filter count, clear behavior,
and a result-count action. Active filters remain removable from the workspace. This
is the native equivalent of the responsive web contract, not a literal DOM layout.

Opportunity discovery should prioritize scanning: role, organization or community,
location and work model, salary when supplied, technology and seniority, author or
repository context, and posting recency. Missing optional data remains absent; never
invent values to balance a card.

The original listing action must remain clear on a job detail. Community and author
screens are identity-led destinations, not generic search results with a label
changed. Mobile may use lists, sheets, stacks, or tabs differently from the web while
preserving these information priorities.

## Accessibility and motion

Use explicit labels and hints, logical reading order, minimum touch targets, visible
focus where applicable, and announcements for meaningful asynchronous results.
Respect safe areas and keyboard geometry. Restore focus after dismissing a modal or
sheet when the native navigation primitive does not do so automatically.

Motion explains continuity, orientation, or feedback. Prefer short opacity and small
transform transitions. Remove non-essential translation, stagger, parallax, and
loops when reduced motion is enabled.
