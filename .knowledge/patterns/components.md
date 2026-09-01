# Components

> Keep native components focused, accessible, and placed at their true ownership boundary.

## Placement

- `src/app/<entity>/` for a screen and its private UI or controller code;
- `src/components/` for application-wide primitives and cross-screen components;
- `src/contexts/` for stable cross-cutting providers;
- a component-owned child folder directly inside its owner when decomposition is
  useful but reuse is not global.

Promote a component only when reuse crosses its current boundary. Do not create
`features`, `screens`, `atoms`, `molecules`, or a generic `ui.tsx` collection.

## Folder contract

Ordinary components use a kebab-case folder with an `index.tsx` implementation.
Add a colocated `types.ts` for component-only props when that improves ownership.
Shared domain types belong at their domain boundary, not in another component's
prop file.

Use named exports for ordinary components and explicit `React.ReactNode` return
types. Expo Router entry files may use the framework-required default export.

## Component contract

- Keep props narrow, typed, and domain meaningful.
- Prefer composition over boolean-heavy configuration.
- Derive display values during render.
- Use `Pressable` for actions and native navigation for destinations.
- Provide `accessibilityRole`, labels, hints, state, and announcements where native
  semantics are not sufficient.
- Keep interactive targets at least 44 by 44 points.
- Avoid nested interactive controls and unpredictable whole-card gestures.
- Extract repeated behavior, centralized accessibility, a stable visual pattern,
  or a clearly independent responsibility, not merely JSX line count.

## Styling

Fixed visual styles stay in NativeWind classes backed by semantic tokens. Inline
styles are only for runtime values that cannot be represented as classes. Reusable
visual variants must form a small typed contract rather than an open collection of
arbitrary class overrides.

See [Styling](../best_practices/styling.md) and
[Foundations and components](../design_system/foundations_and_components.md).
