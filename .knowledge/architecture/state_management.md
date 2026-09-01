# State Management

> Assign each kind of state to its smallest durable owner.

## Current state

`LocaleProvider` owns the
resolved device locale and its typed messages. `ThemeProvider` owns the current
system-derived light or dark theme and installs the corresponding NativeWind runtime
variables. `OpeningsCatalogProvider` exposes a TanStack Query-backed catalog shared
by the three tabs, including progressive batches and refresh state.

`CandidateStateProvider` owns version-2 saved IDs, viewed IDs, and the previous
visit timestamp. It validates AsyncStorage content before hydration and persists
only device-local state. The root error boundary owns only tree recovery.

## Ownership order

1. Derive values from props, platform state, route parameters, or existing state.
2. Keep ephemeral interaction state in the lowest component or hook that needs it.
3. Lift state only to the nearest shared owner when siblings must coordinate.
4. Use context for stable cross-cutting values consumed by distant descendants.
5. Introduce persisted storage only for an approved durable user need.
6. Keep fetched opportunity state in TanStack Query and expose the single catalog
   contract to its three distant consumers.

Context is not a replacement for a query cache or a general global store. Do not
introduce a state library before the product has a concrete state lifecycle that
React state and focused contexts cannot represent clearly.

## Derived state and effects

Calculate inexpensive display values during render. Memoize only for meaningful
computation or a referential contract. Do not mirror props or derived values into
state.

Effects synchronize with external systems such as device appearance, AppState,
storage, native subscriptions, timers, or abortable requests. Include every reactive
dependency and clean up every subscription, timer, or request. Event-driven state
changes belong in event handlers rather than effects.

## Device-local state

Saved jobs, viewed timestamps, and previous-visit state remain local to the device.
Malformed, missing, or unsupported storage versions resolve to the safe empty state.
There is no account or synchronization path.

## Remote state

Opportunity features represent initial loading, incremental loading, refresh,
empty, offline, error, and success explicitly. Request owners must cancel obsolete
work and prevent stale responses from overwriting a newer query. Do not fabricate
fallback opportunities when the public data source fails.
