# Drawer-Only Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the bottom navigator so Jobs, Communities, and Authors are reachable exclusively through the application hamburger menu.

**Architecture:** Replace the Expo Router `Tabs` navigator with a header-only native `Stack` inside an invisible `(app)` route group. Keep the existing public paths and drawer `replace` actions so switching product areas does not grow a redundant back stack, while detail destinations continue to use the root stack.

**Tech Stack:** Expo Router 57, React Native 0.86, TypeScript, Jest, React Native Testing Library.

---

### Task 1: Specify the header-only navigation shell

**Files:**
- Modify: `tests/app/navigation-shell.test.tsx`

- [x] **Step 1: Write the failing behavior test**

Replace the tab-specific assertions with a shell contract that captures `Stack` and `Tabs` renders, expects `Tabs` never to render, expects a single stack with the three catalog routes, and renders the configured branded header to verify that its menu action remains accessible.

- [x] **Step 2: Run the focused test and verify the red state**

Run: `npm test -- --runInBand tests/app/navigation-shell.test.tsx`

Expected: FAIL because the current layout renders `Tabs` instead of `Stack`.

- [x] **Step 3: Commit the test contract**

Run:

```bash
git add tests/app/navigation-shell.test.tsx docs/superpowers/plans/2026-09-02-drawer-only-navigation.md
git commit -m "test: define drawer-only navigation shell"
```

### Task 2: Replace tabs with the application stack

**Files:**
- Rename: `src/app/routes/(tabs)/` to `src/app/routes/(app)/`
- Modify: `src/app/routes/(app)/_layout.tsx`
- Modify: `tests/app/navigation-shell.test.tsx`

- [x] **Step 1: Rename the invisible route group**

Rename `(tabs)` to `(app)`. Expo Router groups are omitted from public URLs, so `/jobs`, `/communities`, and `/authors` remain stable.

- [x] **Step 2: Implement the minimal stack shell**

Use `Stack` from `expo-router`, keep `AppHeader` as its shared header, use the semantic canvas background from the active theme, and declare only the `jobs`, `communities`, and `authors` screens. Do not configure or render a tab bar.

- [x] **Step 3: Update the test import and run the focused test**

Run: `npm test -- --runInBand tests/app/navigation-shell.test.tsx`

Expected: PASS with zero tab renders, one stack render, all three product routes, and the accessible menu control.

- [x] **Step 4: Commit the behavior**

Run:

```bash
git add src/app/routes tests/app/navigation-shell.test.tsx
git commit -m "feat: navigate catalog from hamburger menu"
```

### Task 3: Align repository knowledge and verify

**Files:**
- Modify: `.knowledge/architecture/overview.md`
- Modify: `.knowledge/patterns/navigation.md`
- Modify: `.knowledge/project_overview.md`

- [x] **Step 1: Document the current navigation contract**

Describe the `(app)` group as a header-only stack, the drawer as the sole top-level catalog navigator, and detail routes as root-stack destinations.

- [x] **Step 2: Run complete verification**

Run: `npm run check`

Expected: lint, strict typecheck, all Jest suites, and Expo Doctor pass.

- [x] **Step 3: Commit and push the verified result**

Run:

```bash
git add .knowledge
git commit -m "docs: describe drawer-only navigation"
git push origin main
```
