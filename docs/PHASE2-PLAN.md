# Phase 2 Strategic Enhancement Plan

**Date:** March 3, 2026
**Current Version:** v1.2.1
**Baseline:** 348 tests, 3 packages (core/fluent/mui), strict TS, i18n, wizard, field arrays, async validation framework

---

## Competitive Gap Analysis (Post-Phase 1)

After completing the initial 6 phases, here's where we stand vs competitors:

| Feature | Us | Formily | SurveyJS | RJSF | TanStack | DDF |
|---------|-----|---------|----------|------|----------|-----|
| Business rules engine | Best | Excellent | Good | Limited | None | Good |
| Component injection | Best | No | No | No | N/A | No |
| Pluggable registries | Best | No | No | No | No | No |
| Auto-save | Yes | No | Yes | No | No | No |
| UI adapters | 2 | 2 | Themes | 8+ | Headless | 3 |
| Async validation | Framework only | Yes | Yes | Yes | Yes | Yes |
| i18n | Yes | Yes | 30+ locales | Limited | No | Limited |
| Wizard | Yes | Yes | Yes | No | No | Yes |
| Field arrays | Yes | Yes | Yes | Yes | Yes | Yes |
| **Accessibility** | **Partial** | Good | **WCAG AA** | **Strong** | N/A | Basic |
| **Error boundary** | **None** | Yes | Yes | Yes | N/A | Yes |
| **Async validation wired** | **No** | Yes | Yes | Yes | Yes | Yes |
| **Form persistence** | **None** | localStorage | **Yes** | No | No | No |
| **Virtualization** | **None** | **Reactive** | Pagination | No | **Signals** | No |
| **DevTools** | **None** | Yes | Creator | **Playground** | Planned | No |
| **Schema import** | **None** | JSON Schema | Proprietary | **100%** | Zod/Yup | No |
| **Visual builder** | **None** | **Designable** | **Creator** | Playground | No | No |
| **Theming/customization** | **CSS only** | Good | Good | Templates | Full | Mappers |

**Key insight:** Our business rules engine, component injection, and pluggable registries remain unmatched. But we have critical gaps in reliability (error boundary, async integration), accessibility, and developer experience (devtools, playground).

---

## Phase 7: Reliability + Async Integration (v1.3.0)

**Why:** The async validation framework exists but isn't wired to HookRenderField — it's dead code. No error boundary means a single field crash takes down the entire form. No save timeout means hung requests freeze the UI. These are production blockers.

### 7A. Wire async validation into HookRenderField

- Compose sync + async in Controller `validate` prop
- Sync validators run first (fast fail), async only if sync passes
- Debounce via `useRef` timer per field using `asyncValidationDebounceMs` from config
- `AbortController` cancels in-flight async validation when field value changes again
- Show "Validating..." indicator while async runs

**Files to modify:**
- `HookRenderField.tsx` — add async validate composition
- `HookFieldWrapper.tsx` — add validating state display

### 7B. Error boundary component

- Create `HookFormErrorBoundary` wrapping the form tree
- `componentDidCatch` calls an `onError` callback prop
- Fallback UI shows error message with "Retry" button
- Wrap `HookRenderField` individually so one field crash doesn't kill the whole form

**Files to create:**
- `components/HookFormErrorBoundary.tsx`

**Files to modify:**
- `components/HookInlineFormFields.tsx` — wrap each field in error boundary

### 7C. Save reliability

- Add `AbortController` to `saveData` calls — cancel previous in-flight save when new save triggers
- Add configurable timeout (default 30s) — reject promise if save takes too long
- Add retry with exponential backoff (1s, 2s, 4s, max 3 attempts)
- Add `onSaveRetry` callback so consumers can show "Retrying..." UI

**Files to modify:**
- `components/HookInlineForm.tsx`

### Verification
- Test: async validation runs after sync passes, cancels on re-type
- Test: error boundary catches field render error, shows fallback
- Test: save timeout fires after configured delay
- Test: save retry attempts 3 times with backoff

---

## Phase 8: Accessibility (v1.4.0)

**Why:** RJSF and SurveyJS both target WCAG AA. Healthcare, government, and financial services require it. This is a compliance blocker for enterprise adoption.

### 8A. Keyboard navigation

- Tab through all form fields (already works via native HTML)
- Escape to close `HookConfirmInputsModal`
- Enter to submit from within modal
- Arrow keys in wizard step navigation

### 8B. Focus management

- Focus trap inside `HookConfirmInputsModal` when open
- Restore focus to triggering element when modal closes
- Move focus to first error field on validation failure
- Announce field count/progress to screen readers

### 8C. ARIA live regions

- Add `aria-live="polite"` region for form status changes (saving, saved, error)
- Add `aria-busy="true"` on form during save
- Add `aria-label` to filter input
- Announce wizard step changes to screen readers

### 8D. Color-independent status

- Ensure error/warning/success states have text labels, not just color
- Add `aria-label` to status indicators in StatusDropdown

### Verification
- Manual test with VoiceOver (Mac) and NVDA (Windows)
- All form operations completable via keyboard only
- axe-core automated audit passes with 0 violations

---

## Phase 9: Form State Persistence + Draft Saving (v1.5.0)

**Why:** SurveyJS is the only competitor with this. For long enterprise forms (20+ fields, 10+ minutes), losing work to a browser crash is unacceptable. This is a high-impact differentiator.

### 9A. Draft auto-save hook

- Create `useDraftPersistence(formId, data, options)` hook
- Saves form state to `localStorage` on configurable interval (default 30s)
- Recovers draft on mount if newer than server data
- Shows "Draft recovered" banner with "Discard draft" option
- Clears draft after successful server save

### 9B. beforeunload protection

- Warn user on page navigation when form has unsaved changes
- `useBeforeUnload` hook integrated into `HookInlineForm`
- Configurable via `warnOnUnsavedChanges` prop

### 9C. Form state serialization

- `serializeFormState()` / `deserializeFormState()` utilities
- Handles Date objects, nested entities, field arrays
- Safe for localStorage (no circular refs, no functions)

### Verification
- Test: fill form, close tab, reopen — draft recovered
- Test: fill form, navigate away — browser warns
- Test: save successfully — draft cleared

---

## Phase 10: Theming + Render Props for Field Chrome (v1.6.0)

**Why:** Consumers can't customize labels, error messages, or status indicators without replacing entire components. Fluent and MUI adapters handle field inputs, but the wrapper chrome (labels, errors, icons) is hardcoded HTML in core.

### 10A. Render props for HookFieldWrapper

- `renderLabel?: (props) => ReactNode` — custom label rendering
- `renderError?: (props) => ReactNode` — custom error display
- `renderStatus?: (props) => ReactNode` — custom saving/pending display
- Falls back to current HTML when render props not provided (backwards compat)

### 10B. CSS custom properties

- Define CSS variables for all colors, spacing, fonts
- `--hook-form-error-color`, `--hook-form-label-color`, etc.
- Document all variables in README

### 10C. Form-level error display

- Add `formErrors` prop to `HookInlineForm` for server-side cross-field errors
- Render form-level error banner above fields
- Support both field-level and form-level errors simultaneously

### Verification
- Test: custom label render prop changes label appearance
- Test: CSS variables override default colors
- Test: form-level error displays above fields

---

## Phase 11: Developer Experience (v1.7.0)

**Why:** RJSF has the best playground in the space. Formily has Designable. We have nothing interactive. A playground is the #1 onboarding tool and marketing asset.

### 11A. Interactive playground

- Single-page app: JSON config editor (left) + live form preview (right)
- Bundled as a separate package or hosted on GitHub Pages
- Pre-loaded example configs (simple form, business rules, wizard, field arrays)
- Supports both Fluent and MUI adapters (toggle)
- Shows business rule state in real-time

### 11B. Form DevTools component

- `HookFormDevTools` component — collapsible panel showing:
  - Current business rules state per field
  - Dependency graph (text-based)
  - Form values, dirty fields, errors
  - Rule evaluation log (which rules fired, in what order)
- Only renders when `process.env.NODE_ENV === 'development'`
- Export from core as opt-in component

### 11C. JSON Schema import utility

- `jsonSchemaToFieldConfig(schema)` — converts JSON Schema to `Dictionary<IFieldConfig>`
- Maps `type: "string"` → `Textbox`, `type: "boolean"` → `Toggle`, etc.
- Maps `enum` → `Dropdown` with options
- Maps `format: "email"` → `validations: ["EmailValidation"]`
- Maps `required` array → `required: true` per field

### Verification
- Playground deploys to GitHub Pages
- DevTools shows live state updates as form is edited
- JSON Schema converter generates valid IFieldConfig from standard schemas

---

## Phase 12: Performance + Large Form Support (v1.8.0)

**Why:** Formily handles 500+ fields via reactive architecture. TanStack Form uses signals for granular updates. We degrade on 50+ fields because every field re-renders on every change. For enterprise forms, this is a ceiling.

### 12A. Virtual scrolling for large forms

- Integrate `react-window` (or similar) into `HookInlineFormFields`
- Only render fields in the visible viewport + buffer
- Maintain scroll position during business rule updates
- Opt-in via `virtualizeFields` prop (default false for backwards compat)

### 12B. Optimize HookRenderField re-renders

- Reduce useEffect dependency array from 8 items to critical-only
- Memoize Controller render callback
- Use `useMemo` for the rendered component instead of `useState` + `useEffect`

### 12C. Lazy field registry

- `createLazyFieldRegistry()` that uses `React.lazy()` for each field component
- Fields load on-demand when first rendered
- Reduces initial bundle for large registries

### Verification
- Benchmark: 100-field form renders in <100ms (currently ~300ms)
- Benchmark: field change re-renders only 1-3 fields, not all
- Bundle analysis shows lazy-loaded fields don't increase initial load

---

## Phase Summary

| Phase | Version | Effort | Impact | Priority |
|-------|---------|--------|--------|----------|
| 7: Reliability + Async | v1.3.0 | ~1.5 weeks | Critical — production blockers | **P0** |
| 8: Accessibility | v1.4.0 | ~2 weeks | High — enterprise compliance | **P0** |
| 9: Persistence + Drafts | v1.5.0 | ~1 week | High — differentiator | **P1** |
| 10: Theming + Customization | v1.6.0 | ~1 week | Medium — DX improvement | **P1** |
| 11: Developer Experience | v1.7.0 | ~3 weeks | High — adoption + marketing | **P1** |
| 12: Performance | v1.8.0 | ~2 weeks | Medium — large form support | **P2** |

**Parallelizable:** Phases 7+8 can run in parallel. Phases 9+10 can run in parallel. Phase 11 depends on 7-10 being stable. Phase 12 is independent.

**Total:** ~10.5 weeks solo, ~6 weeks with 2 developers.

---

## What We're NOT Doing (and Why)

| Feature | Why Not |
|---------|---------|
| Visual form builder | Too much effort (8+ weeks), SurveyJS/Formily own this space |
| Multi-framework support | React is our market, cross-framework is Formily/TanStack's game |
| JSON Schema compliance | RJSF owns this; we offer a JSON Schema *import* utility instead |
| Offline queue/sync | SurveyJS owns this; draft persistence covers 90% of the use case |
| Form analytics dashboard | Better done as a separate product/service, not a library feature |
| PDF/CSV export | Orthogonal concern — consumers use their own export tools |
| Undo/redo | Nice-to-have but low ROI; react-hook-form doesn't support it natively |
