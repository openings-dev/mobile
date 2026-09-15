# Public Repository Audit

Generated: 2026-09-15T14:48:24.607Z

Clearance: **blocked**

## Coverage

- Local heads: 3
- Remote refs: 2
- Tags: 0
- Tracked files: 354
- Scanned historical blobs: 565
- Large blobs skipped for manual review: 0
- Git LFS: inaccessible
- Submodules: 0

Scanned refs:

- `refs/heads/codex/openings-mobile-open-source`
- `refs/heads/feature/integrations`
- `refs/heads/main`
- `refs/remotes/origin/HEAD`
- `refs/remotes/origin/main`

## Remote surfaces

Status: **blocked** — the read-only inventory is recorded in
`docs/security/github_surfaces.json`.

- Repository visibility: private
- Default branch: `main` (reported as unprotected by the branches endpoint)
- Workflows: 2 active privileged Android release workflows
- Releases, tags, artifacts and environments: 0
- Actions policy: enabled; all actions allowed
- Rulesets: inaccessible with the current GitHub authorization

Public clearance remains blocked until every endpoint is accessible and the branch,
workflow and Actions boundaries are reviewed.

## Immutable CI references

Resolved from the official repositories on September 15, 2026:

| Reference | Reviewed commit |
| --- | --- |
| `actions/checkout@v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| `actions/setup-java@v5` | `b6effb05e454b25005698d916606bdc6ffcbf961` |
| `actions/setup-node@v6` | `249970729cb0ef3589644e2896645e5dc5ba9c38` |
| `gradle/actions/setup-gradle@v6` | `9c971963bec38e04b3d30dcc455b5382be2fdbfb` |
| `ruby/setup-ruby@v1` | `bec3f19a76460dbe12f60def7d1a77585f07516c` |
| `actions/upload-artifact@v6` | `b7c566a772e6b6bfb58ed0dc250532a479d7789f` |
| `actions/download-artifact@v6` | `018cc2cf5baa6db3ef3c5f8a56943fffe632ef53` |
| `actions/github-script@v8` | `ed597411d8f924073f98dfc5c65a23a2325f34cd` |

The temporary sibling-package checkouts are also fixed to reviewed public commits:
`openings-dev/core@d141be36675f255caf2783da7cd6d9902224888f` and
`openings-dev/design-tokens@76ac0a1f14b56942fd3a34198b5d89c84319ad84`.

## Redacted findings

Matched values are never written to this report. Fingerprints are one-way SHA-256 identifiers used for remediation tracking.

| Path | Object | Pattern | Disposition | Fingerprint |
| --- | --- | --- | --- | --- |
| tests/scripts/restore-google-play-service-account.test.ts | c9878c18d84e45c3df57b3b34eddb4ede5e66df6 | private-key | false-positive | sha256:5f0a8c7e99e43b146241f97e4b80bce96a0d04bbd119cf959aeddbb06e6969da |
