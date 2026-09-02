# Styling

> Implement the Openings visual system through NativeWind and shared semantic tokens.

## Current system

NativeWind 4 is configured through Babel and Metro. Tailwind CSS 3 scans `src` and
combines the NativeWind preset with `@openingshq/design-tokens/nativewind`. The theme
provider applies light or dark runtime variables exported by the shared token
package. The user may choose system, light, or dark appearance from the global
header; the device-local preference must resolve to the same semantic role set.

Figtree Regular, Medium, and SemiBold are linked through the Expo font plugin. The
current app uses Figtree for display, interface, and body roles.

The mobile header renders the canonical Openings wordmark with the same vector path
and transform as the web brand source. Keep the artwork monochrome through semantic
foreground color and preserve its intrinsic proportions.

## Rules

- Write fixed NativeWind utilities directly in the owning JSX.
- Consume semantic roles such as canvas, paper, foreground, line, primary, and
  muted foreground instead of raw color values.
- Keep shared palette primitives, semantic themes, typography, spacing, radii, and
  NativeWind mappings in `@openingshq/design-tokens`.
- Do not create component stylesheets, CSS Modules, styled-components, another
  token layer, or application-owned copies of public package values.
- Do not use `StyleSheet` for fixed application styling.
- Reserve inline style objects for runtime variables, safe-area or keyboard
  measurements, animated values, and third-party native surfaces that cannot
  consume `className`.
- Use one visual hierarchy in light and dark modes; do not treat dark mode as a
  literal inversion.

## Openings visual contract

Warm Paper and Community Ink form the dominant light foundation. The dark theme
uses separate canvas, paper, and elevated tonal roles. Brand Mint marks one priority
action or selected state; Primary Deep supplies accessible light-theme accent text.
Lavender, Fresh Mint, and Peach remain supporting editorial roles.

Use 1-point low-contrast hairlines as default boundaries. Controls use compact
radii, cards use medium radii, and large editorial panels use the largest shared
radius. Pills belong to compact selections and deliberately rounded priority actions,
not every component. Elevation is diffuse and reserved for actual floating layers.

Avoid hard offset shadows, heavy default outlines, universal hover-like translation,
font-black treatment, tiny uppercase labels, decorative gradients, generic blobs,
and nested cards as the default composition.

## Responsive and native review

Review compact and large phones, tablets where supported, portrait orientation,
long translated labels, large text, screen readers, reduced motion, keyboard overlap,
safe areas, and both themes. Mobile hierarchy follows content priority rather than
shrinking a desktop composition.
