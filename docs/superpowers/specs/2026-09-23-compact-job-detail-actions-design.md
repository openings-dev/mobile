# Compact Job Detail Actions

## Context

The job-detail screen currently presents opening the original listing, sharing,
saving, and reporting as four full-width buttons stacked inside its fixed action
dock. The layout makes every action appear equally important and consumes a large
part of short mobile viewports. The action dock must remain safe-area aware and
keep the final scroll content reachable, but it should no longer obscure so much
of the listing.

## Product decision

Keep opening the original listing as the only persistent primary action. Replace
the three stacked secondary buttons with one compact `Actions` trigger. The
trigger opens a native bottom sheet containing sharing, saving, and reporting as
separate rows.

This preserves immediate access to the authoritative source while letting the
user deliberately choose a secondary action without presenting four nested or
stacked buttons. Opening the original listing remains one tap; secondary actions
require two taps.

## Dock layout

The fixed dock contains one horizontal row above the bottom safe area:

- a flexible mint primary button for opening the original listing;
- a bounded secondary `Actions` button with an ellipsis icon;
- 44-point minimum interactive height for both controls;
- the existing paper surface and top hairline boundary;
- compact horizontal and vertical spacing from the shared NativeWind scale.

The dock continues to report its measured total height, including safe-area
padding. The job-detail `ScrollView` continues to use that measurement for its
bottom content inset, so the final source, tag, or similar listing remains
reachable above the dock.

## Secondary action sheet

The `Actions` trigger opens a React Native modal presented as a native page sheet.
The sheet owns a safe-area-aware paper surface, a title, an explicit close control,
and three independent rows:

1. share the job;
2. save the job, or remove it from saved jobs when already selected;
3. report a problem.

Each row combines the existing Lucide icon, localized label, and a minimum
52-point row height. The saved row exposes its selected state to assistive
technology and uses both text and filled icon state, rather than color alone.
Reporting keeps muted visual emphasis but remains a normal accessible action, not
a destructive confirmation.

Selecting an action closes the sheet before invoking its existing callback. The
sheet also closes through its close control, Android back behavior, and the native
modal dismissal path. Reopening it reflects the current saved state and label.

## Component boundaries

`JobDetailActions` remains the reusable owner of the dock, sheet visibility, and
presentation. Its callbacks remain narrow and unchanged: the job-details screen
continues to own external URL validation, native sharing, device-local saved
state, and analytics.

The component receives one additional localized `actions` label and one localized
sheet-close label. No service, context, navigation, or persistence boundary
changes. No new dependency is required.

## Localization and accessibility

Add the new visible labels to the typed job message contract and all six supported
catalogs. Existing share, save/unsave, and report strings are reused. The action
sheet title and close control receive explicit localized accessibility labels.

The implementation preserves Dynamic Type, light and dark themes, logical reading
order, 44-point targets, semantic button roles, selected state, bottom safe area,
and Android hardware-back dismissal. Long translations may wrap inside sheet rows
without reducing the touch target.

## Testing

Behavioral component tests will first describe the new contract:

- only the primary action and `Actions` trigger are visible in the closed dock;
- secondary actions are absent until the sheet opens;
- opening and closing the sheet works through visible controls and request-close;
- each secondary row closes the sheet and calls only its matching callback;
- saved and unsaved states expose the correct label and accessibility state;
- dock layout measurement continues to report the compact measured height.

The job-detail screen test will verify that the new localized trigger opens the
sheet and that the existing source and sharing behaviors remain connected. The
complete repository check must pass after the implementation. This is a
JavaScript presentation change and does not require regenerating native projects.

## Out of scope

- changing analytics event contracts;
- changing external URL, sharing, saving, or reporting behavior;
- adding swipe gestures or custom animation systems;
- redesigning the job-detail content or header;
- promoting the compact action pattern to unrelated screens.
