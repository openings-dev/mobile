# Compact Job Detail Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-button job-detail footer with a compact primary action and a native secondary-action sheet.

**Architecture:** `JobDetailActions` continues to own dock presentation and height measurement while adding local modal visibility. `JobDetailsScreen` keeps all product callbacks and receives no new behavioral responsibility; typed localization supplies the two new labels across all six catalogs.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript, NativeWind, React Native Testing Library, Jest, Lucide React Native.

---

## File map

- Modify `src/components/job-detail-actions/index.tsx`: render the compact dock and own the secondary-action modal.
- Modify `src/app/jobs/details/index.tsx`: pass the new localized action and close labels.
- Modify `src/i18n/types.ts`: extend the typed jobs message contract.
- Modify `src/i18n/messages.ts`: add translations for `actions` and `closeActions` in all six locale extensions.
- Modify `tests/components/job-detail-actions.test.tsx`: define compact dock, modal, callback, saved-state, dismissal, and measurement behavior.
- Modify `tests/app/job-details.test.tsx`: verify the screen opens the action sheet before sharing.
- Modify `tests/i18n/messages.test.ts`: require both new labels in every locale.
- Modify `.knowledge/design_system/foundations_and_components.md`: replace the obsolete four-independent-buttons contract.
- Modify `.knowledge/patterns/navigation.md`: document the reduced measured action dock.

### Task 1: Lock the localized contract

**Files:**
- Modify: `tests/i18n/messages.test.ts`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/messages.ts`

- [ ] **Step 1: Write the failing locale assertions**

Extend the test-only jobs shape with `actions?: string` and `closeActions?: string`, then assert both values for every supported locale:

```ts
expect(copy?.jobs?.actions).toBeTruthy();
expect(copy?.jobs?.closeActions).toBeTruthy();
```

- [ ] **Step 2: Run the locale test and verify the red state**

Run:

```bash
npx jest tests/i18n/messages.test.ts --runInBand
```

Expected: FAIL because `jobs.actions` and `jobs.closeActions` are absent.

- [ ] **Step 3: Add the typed keys and six translations**

Add these fields beside the other job action labels in `src/i18n/types.ts`:

```ts
actions: string;
closeActions: string;
```

Add locale-specific values to each native jobs extension in `src/i18n/messages.ts`:

```ts
// en
actions: "Actions",
closeActions: "Close job actions",

// pt-BR
actions: "Ações",
closeActions: "Fechar ações da vaga",

// es
actions: "Acciones",
closeActions: "Cerrar acciones del empleo",

// it
actions: "Azioni",
closeActions: "Chiudi azioni del lavoro",

// fr
actions: "Actions",
closeActions: "Fermer les actions du poste",

// de
actions: "Aktionen",
closeActions: "Stellenaktionen schließen",
```

- [ ] **Step 4: Run the locale test and verify green**

Run the same Jest command. Expected: all localization tests PASS.

- [ ] **Step 5: Commit the localization micro-change**

```bash
git add src/i18n/types.ts src/i18n/messages.ts tests/i18n/messages.test.ts
git commit -m "feat(i18n): add compact job action labels"
```

### Task 2: Define the compact action behavior

**Files:**
- Modify: `tests/components/job-detail-actions.test.tsx`
- Modify: `tests/app/job-details.test.tsx`

- [ ] **Step 1: Replace the legacy component expectation with closed-dock behavior**

Render the component with `actions: "Actions"` and `closeActions: "Close job actions"`. Assert that `Open original listing` and `Actions` are visible, while `Share job`, `Save job`, and `Report a problem` are absent before opening the sheet.

Keep the layout event assertion, using a compact sample height:

```ts
await fireEvent(screen.getByTestId("job-detail-actions"), "layout", {
  nativeEvent: { layout: { height: 72, width: 390, x: 0, y: 0 } },
});
expect(onHeightChange).toHaveBeenCalledWith(72);
```

- [ ] **Step 2: Add modal interaction expectations**

Open `Actions`, press each secondary row in a fresh render or reopen cycle, and verify only the corresponding callback fires. Assert the sheet disappears after every selection. Also fire `requestClose` on the modal test ID and press the localized close control.

For saved state, rerender with `isSaved` and `save: "Remove saved job"`, then assert:

```ts
expect(screen.getByLabelText("Remove saved job").props.accessibilityState).toEqual({
  selected: true,
});
```

- [ ] **Step 3: Update the screen test to open the sheet before sharing**

Change the direct share press to:

```ts
await fireEvent.press(screen.getByText("Actions"));
await fireEvent.press(screen.getByText("Share job"));
expect(Share.share).toHaveBeenCalled();
```

- [ ] **Step 4: Run both tests and verify the red state**

```bash
npx jest tests/components/job-detail-actions.test.tsx tests/app/job-details.test.tsx --runInBand
```

Expected: FAIL because the dock still renders four stacked actions and has no action modal.

### Task 3: Implement the compact dock and action sheet

**Files:**
- Modify: `src/components/job-detail-actions/index.tsx`
- Modify: `src/app/jobs/details/index.tsx`

- [ ] **Step 1: Extend the component labels and add local visibility**

Add `actions` and `closeActions` to `JobDetailActionLabels`, import `MoreHorizontal`, `X`, `Modal`, and `useState`, then own the sheet state:

```ts
const [actionsVisible, setActionsVisible] = useState(false);

const runAction = (action: () => void) => {
  setActionsVisible(false);
  action();
};
```

- [ ] **Step 2: Replace the stacked buttons with one horizontal row**

Inside the safe-area dock, render a compact row with the existing mint original-listing button using `flex-1`, plus a bordered `Actions` trigger using `MoreHorizontal`. Preserve 44-point minimum height and the existing measured `SafeAreaView`.

- [ ] **Step 3: Render the native modal sheet**

Render a `Modal` with `animationType="slide"`, `presentationStyle="pageSheet"`, `visible={actionsVisible}`, `onRequestClose={() => setActionsVisible(false)}`, and `testID="job-detail-action-sheet"`. Its safe-area content contains:

```tsx
<Pressable onPress={() => runAction(onShare)}>{/* Share2 + labels.share */}</Pressable>
<Pressable
  accessibilityState={{ selected: isSaved }}
  onPress={() => runAction(onToggleSaved)}
>{/* Bookmark + labels.save */}</Pressable>
<Pressable onPress={() => runAction(onReport)}>{/* CircleAlert + labels.report */}</Pressable>
```

Each row uses a minimum 52-point height. Add a header titled with `labels.actions` and an icon-only close control labelled with `labels.closeActions`.

- [ ] **Step 4: Pass localized labels from the screen**

Add these properties to the existing labels object in `src/app/jobs/details/index.tsx`:

```ts
actions: messages.jobs.actions,
closeActions: messages.jobs.closeActions,
```

- [ ] **Step 5: Run the focused tests and verify green**

Run the two-test Jest command from Task 2. Expected: both suites PASS.

- [ ] **Step 6: Commit the behavior micro-change**

```bash
git add src/components/job-detail-actions/index.tsx src/app/jobs/details/index.tsx tests/components/job-detail-actions.test.tsx tests/app/job-details.test.tsx
git commit -m "feat(ui): compact job detail actions"
```

### Task 4: Align project knowledge and verify the application

**Files:**
- Modify: `.knowledge/design_system/foundations_and_components.md`
- Modify: `.knowledge/patterns/navigation.md`

- [ ] **Step 1: Update the design-system contract**

Replace the statement that the dock exposes four independent actions with a factual description of the primary original-listing button and the secondary native action sheet.

- [ ] **Step 2: Update the navigation contract**

Clarify that the measured dock is a compact single row and that its native sheet owns the secondary actions without changing scroll-inset behavior.

- [ ] **Step 3: Run the complete repository check**

```bash
npm run check
```

Expected: lint, typecheck, all Jest suites, and Expo Doctor PASS. If Expo Doctor alone fails because of local network or unavailable CocoaPods, rerun it with network access and report the native-tooling limitation separately; do not mask application failures.

- [ ] **Step 4: Inspect the final diff and working tree**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only the planned knowledge files remain uncommitted.

- [ ] **Step 5: Commit the knowledge micro-change**

```bash
git add .knowledge/design_system/foundations_and_components.md .knowledge/patterns/navigation.md
git commit -m "docs: document compact job action dock"
```

