# New-job push mobile implementation plan

**Goal:** Require explicit consent for new-job alerts and open only validated job
notification clicks in the existing native job detail route.

**Architecture:** Version 2 of the device-local consent document invalidates the
older editorial-only decision. The OneSignal wrapper owns SDK listeners and
validates a minimal versioned payload; a root-level navigation bridge owns Expo
Router readiness and navigation. A drawer preference provides revocation without
changing browsing state.

## Tasks

- [ ] Write failing consent migration, revocation, payload, listener lifecycle,
  navigation, preference, accessibility, and six-locale tests.
- [ ] Implement the versioned consent copy and revocation path.
- [ ] Implement safe click handling for `{ type: "openings.job", version: 1,
  jobId }` and reject arbitrary URLs/routes or malformed IDs.
- [ ] Integrate the navigation bridge and notification preference into existing
  owners without adding a settings screen or behavioral targeting.
- [ ] Run `npm run check` and the Android debug build; leave production delivery
  and physical-device evidence as explicit external gates.
