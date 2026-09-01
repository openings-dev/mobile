# Openings Mobile Knowledge Base

> Index the verified product, architecture, and engineering contracts for Openings Mobile.

This knowledge base documents the current private React Native application and
the durable Openings contracts it must preserve as the product grows. The mobile
repository currently contains the native foundation, not the complete web feature
set. Each document distinguishes implemented behavior from future product scope.

## Documentation map

- [Project overview](project_overview.md) — product purpose, current state, stack, and non-goals
- [Architecture overview](architecture/overview.md) — runtime, source ownership, and dependency direction
- [State management](architecture/state_management.md) — local, cross-cutting, remote, and persisted state boundaries
- [Public data flow](architecture/public_data_flow.md) — generated Openings data and validation rules
- [Components](patterns/components.md) — component placement, contracts, and accessibility
- [Navigation](patterns/navigation.md) — Expo Router ownership and native navigation rules
- [Internationalization](patterns/internationalization.md) — six-locale typed message contract
- [Styling](best_practices/styling.md) — NativeWind and Openings visual-system rules
- [Security](best_practices/security.md) — public-data, secrets, storage, and native safety boundaries
- [Development setup](guides/development_setup.md) — local package, JavaScript, and native workflows
- [Testing](guides/testing.md) — behavioral, package-integration, and native verification
- [Design system](design_system/README.md) — mobile visual authority and documentation index
  - [Foundations and components](design_system/foundations_and_components.md)
- [Shared packages](integrations/shared_packages.md) — ownership and local consumption of public NPM packages

## Authority

[`AGENTS.md`](../AGENTS.md) is the canonical repository instruction file. This
knowledge base expands it with verified project detail. The public packages define
their exported runtime contracts, and current source and tests are the authority
for implemented mobile behavior.

The Openings web repository remains the product reference for established domain,
public-data, localization, and brand contracts. Web implementation details are not
copied blindly: mobile uses native navigation, interaction, layout, and accessibility
patterns.
