# Public Repository Audit

Generated: 2026-09-16T17:21:46.154Z

Clearance: **local-clear**

## Coverage

- Local heads: 3
- Remote refs: 2
- Tags: 0
- Tracked files: 371
- Scanned historical blobs: 615
- Large blobs skipped for manual review: 0
- Git LFS: complete-via-pointer-scan (0 entries)
- Submodules: 0

Scanned refs:

- `refs/heads/codex/openings-mobile-open-source`
- `refs/heads/feature/integrations`
- `refs/heads/main`
- `refs/remotes/origin/HEAD`
- `refs/remotes/origin/main`

## Remote surfaces

Status: **blocked** — see `docs/security/github_surfaces.json`, generated on
September 16, 2026.

- Repository remains `PRIVATE`; default branch is `main`.
- The branches endpoint reports `main` as unprotected.
- Two privileged Android release workflows are active.
- Actions are enabled with `allowedActions: all`.
- Tags, releases, artifacts and environments are empty.
- Rulesets are inaccessible with the current authorization, so remote clearance is
  not granted.

## Redacted findings

Matched values are never written to this report. Fingerprints are one-way SHA-256 identifiers used for remediation tracking.

| Path | Object | Pattern | Disposition | Fingerprint |
| --- | --- | --- | --- | --- |
| tests/scripts/audit-public-readiness.test.ts | 240ffc11b81e59a236add02d0d5b01850bc9d7bb | private-key | false-positive | sha256:5f0a8c7e99e43b146241f97e4b80bce96a0d04bbd119cf959aeddbb06e6969da |
| tests/scripts/audit-public-readiness.test.ts | 240ffc11b81e59a236add02d0d5b01850bc9d7bb | credential-assignment | false-positive | sha256:e7e200fbe4b94df833e4976bcde42a16c4339b1f562ec511f1ad6d69e3cfec9e |
| tests/scripts/restore-google-play-service-account.test.ts | c9878c18d84e45c3df57b3b34eddb4ede5e66df6 | private-key | false-positive | sha256:5f0a8c7e99e43b146241f97e4b80bce96a0d04bbd119cf959aeddbb06e6969da |

## Candidate validation

Validation on September 16, 2026 produced the following evidence:

- Exact public dependency installation with `npm ci`: passed.
- ESLint, strict TypeScript and Jest: passed; the isolated clone ran 65 suites and
  234 tests without sibling repositories or environment files.
- Android debug build from that isolated clone: passed without `google-services.json`
  or a repository-local debug keystore; Firebase build plugins were intentionally
  disabled for the credential-free contributor build.
- Android debug build in the candidate worktree: passed with Expo 57.0.23.
- Fastlane Ruby syntax validation: passed.
- Expo Doctor: 19/20; dependency validation passed, but CocoaPods inspection is
  blocked because the host requires the user to accept the Xcode license.
- Fastlane lane enumeration: blocked because the host system Ruby 2.6 cannot load
  the lockfile's Bundler 2.7.2. No release command or upload was attempted.

Local source/history clearance is granted. Public visibility remains blocked by the
remote ruleset/branch-protection evidence and the two host-tooling checks above.
