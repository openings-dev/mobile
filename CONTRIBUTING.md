# Contributing to Openings Mobile

Thank you for improving Openings Mobile. The repository is designed so an ordinary
fork can install, test and build the contributor-facing code without privileged
configuration.

## Development workflow

1. Use Node.js 24.
2. Run `npm ci` from the repository root.
3. Make one focused change with tests.
4. Run `npm run check` before opening a pull request.

Keep shared contracts behind the published `@openingshq/core` and
`@openingshq/design-tokens` package exports. Do not introduce sibling-repository
imports or private registry dependencies.

## Security and privacy

Never include secret values in issues, pull requests, commits, test fixtures,
screenshots, audit reports or command output. Use clearly synthetic placeholders in
tests. Report suspected vulnerabilities through the private route in `SECURITY.md`.

Public client identifiers (`EXPO_PUBLIC_*`) are extractable from applications, but
that does not make administrative API keys, signing files or service accounts safe
to commit. Contributors cannot access or exercise official publishing credentials.

## Scope

Changes should preserve the app's focused Jobs, Communities and Authors experience,
accessibility, localization and privacy-first telemetry behavior. Explain user-facing
behavior changes and add regression coverage for fixes.
