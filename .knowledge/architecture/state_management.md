# State Management

> Assign each kind of state to its smallest durable owner.

## Current state

The foundation has no global store or remote-data cache. `LocaleProvider` owns the
resolved device locale and its typed messages. `ThemeProvider` owns the current
system-derived light or dark theme and installs the corresponding NativeWind runtime
variables. Both values are derived from native platform state and are not persisted.

The home screen is presentational. The root error boundary owns only whether its
child tree failed and clears that state when the user selects the localized retry.

## Ownership order

1. Derive values from props, platform state, route parameters, or existing state.
2. Keep ephemeral interaction state in the lowest component or hook that needs it.
3. Lift state only to the nearest shared owner when siblings must coordinate.
4. Use context for stable cross-cutting values consumed by distant descendants.
5. Introduce persisted storage only for an approved durable user need.
6. Keep fetched opportunity state in the feature boundary that requested it.

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

## Future device-local state

The web product currently keeps saved jobs, viewed timestamps, previous-visit state,
and preferences in the browser. Equivalent mobile features should remain local to
the device unless an approved specification introduces accounts and synchronization.
The storage adapter must be versioned, validated at the boundary, and resilient to
malformed or missing values before any UI depends on it.

## Future remote state

Opportunity features must represent initial loading, incremental loading, refresh,
empty, offline, error, and success explicitly. Request owners must cancel obsolete
work and prevent stale responses from overwriting a newer query. Do not fabricate
fallback opportunities when the public data source fails.
