# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.3] - 2026-03-05

### Fixed

- **CI build order** -- Build script now runs core first, then adapters in parallel, then examples last. Fixes workspace build order issue where examples failed because MUI dist/ didn't exist yet.
- **Examples build** -- Removed `tsc` step from examples build script. Vite handles TypeScript via esbuild; `tsc` was failing because MUI types weren't available at build time.
- **CI Node versions** -- Updated matrix from Node 18.x/20.x to 20.x/22.x (18.x is EOL).

## [3.0.1] - 2026-03-05

### Changed

- **Removed `Hook` prefix from all adapter field file names** -- 60 files renamed across fluent, mui, and headless packages (e.g., `HookTextbox.tsx` -> `Textbox.tsx`, `HookReadOnly.tsx` -> `ReadOnly.tsx`, `HookFormLoading.tsx` -> `FormLoading.tsx`). Internal export names preserved for backwards compatibility.

## [3.0.0] - 2026-03-05

Major release: new packages, tooling, and ecosystem expansion.

### Added

- **`@bghcore/dynamic-forms-headless`** -- New unstyled adapter with all 19 field types using semantic HTML only. No UI framework dependency. `data-field-type` and `data-field-state` attributes for CSS targeting. Includes optional CSS custom properties and Tailwind CSS integration guide. (~36KB ESM)
- **`@bghcore/dynamic-forms-designer`** -- Visual drag-and-drop form builder that outputs `IFormConfig` v2 JSON. Components: FieldPalette, FormCanvas, FieldConfigPanel, RuleBuilder (all 15 operators + AND/OR/NOT), WizardConfigurator, ConfigPreview, ImportExport. Undo/redo with 50-snapshot stack. HTML5 native drag-and-drop. (~65KB ESM)
- **`@bghcore/dynamic-forms-examples`** -- Three complete example apps: Login+MFA (conditional visibility, dynamic labels), E-Commerce Checkout (wizard, dropdown dependencies, payment branching), Data Entry (field arrays, computed values, cross-field validation). Vite + React 19 + MUI.
- **Form analytics/telemetry** -- `IAnalyticsCallbacks` interface with 8 optional lifecycle callbacks (onFieldFocus, onFieldBlur, onFieldChange, onValidationError, onFormSubmit, onFormAbandonment, onWizardStepChange, onRuleTriggered). `useFormAnalytics` hook with memoized wrappers, focus time tracking, and form duration calculation. Zero overhead when not configured.
- **FormDevTools: Performance tab** -- Per-field render count tracking via `RenderTracker` helper. Highlights "hot" fields rendering >1.5x average. Reset and refresh controls.
- **FormDevTools: Dependency Graph tab** -- Visual adjacency table showing field dependencies. Color-coded by effect type (hidden/required/readOnly/options). Sortable by name or dependency count. Cycle detection.
- **FormDevTools: Timeline tab** -- Chronological event log via `EventTimeline` helper. Events: field_change, rule_evaluated, validation_run, form_submit. Filterable, clearable, capped at 500 events.
- **`IFieldEffect.label`** -- Rules can now dynamically change field labels via the `label` property in rule effects.
- **`InjectedFieldProvider` `injectedFields` prop** -- Field registry can now be passed directly as a prop instead of requiring `setInjectedFields()` in a child component.
- **Storybook 10** -- 64 stories covering all 19 field types (editable + read-only states), composite components (DynamicForm, WizardForm, FieldArray, FormDevTools), and a Getting Started MDX docs page.
- **Playwright E2E tests** -- 54 tests across 7 spec files: basic form, rules engine, validation, wizard navigation, field arrays, draft recovery, keyboard navigation. Includes Vite test app and page object pattern.
- **Performance benchmarks** -- vitest bench suite with 5 benchmark files: rule engine (10-500 fields), condition evaluator (15 operators, nested trees), validation throughput, expression engine, and bundle size tracking. Config generators for N-field forms.
- **CI/CD pipeline** -- GitHub Actions with matrix CI (Node 18+20), test + coverage artifacts, publish workflow with workflow_dispatch, dry-run mode, OIDC provenance, and GitHub Release creation.
- **WCAG 2.1 AA accessibility audit** -- 8 core component files fixed (label association, ARIA roles, focus management, screen reader text). 15 new accessibility tests. `docs/ACCESSIBILITY.md` compliance document.
- **SSR compatibility** -- 3 core files fixed with typeof window/document guards. `docs/ssr-guide.md` covering Next.js App Router and Pages Router setup.
- 22 new analytics tests (515 total core tests passing)

## [2.0.0] - 2026-03-04

Complete schema redesign with unified rules engine. All v1 names kept as deprecated aliases.

### Added

- **`IFormConfig` v2 schema** -- Versioned wrapper: `{ version: 2, fields, fieldOrder, wizard, settings }`
- **Unified rules engine** -- `IFieldConfig.rules: IRule[]` replaces dependencies, dependencyRules, dropdownDependencies, orderDependencies
- **Rich conditions** -- `ICondition = IFieldCondition | ILogicalCondition` with 15 operators (equals, notEquals, greaterThan, lessThan, contains, notContains, startsWith, endsWith, in, notIn, isEmpty, isNotEmpty, matches, greaterThanOrEqual, lessThanOrEqual) + AND/OR/NOT logical composition
- **Rule effects** -- `IFieldEffect` with required, hidden, readOnly, component, options, validate, computedValue, fieldOrder, fields (cross-field)
- **Priority-based conflict resolution** -- Higher priority rule wins when multiple rules affect the same field
- **Incremental evaluation** -- `evaluateAffectedFields()` only re-evaluates transitively affected fields on change
- **Dependency graph** -- `buildDependencyGraph()` with topological sort for evaluation ordering
- **Computed values** -- `computedValue: "$fn.name()"` or `"$values.qty * $values.price"` replaces `isValueFunction` + `value`
- **Unified validation** -- `validate: IValidationRule[]` with `{ name, params, message, async, debounceMs, when }` replaces separate sync/async systems
- **`ConditionEvaluator`** -- `evaluateCondition()` with all 15 operators + nested AND/OR/NOT

### Changed

- **Component renames** (old names kept as deprecated aliases):
  - `DynamicForm` (was `HookInlineForm`)
  - `FormFields` (was `HookInlineFormFields`)
  - `RenderField` (was `HookRenderField`)
  - `FieldWrapper` (was `HookFieldWrapper`)
  - `WizardForm` (was `HookWizardForm`)
  - `FieldArray` (was `HookFieldArray`)
  - `RulesEngineProvider` (was `BusinessRulesProvider`)
  - `InjectedFieldProvider` (was `InjectedHookFieldProvider`)
- **Field config keys**: `type` (was `component`), `options` (was `dropdownOptions`), `validate` (was `validations`), `config` (was `meta`)
- **Option format**: `{ value, label }` (was `{ key, text }`)
- **Type renames**: `IFieldProps` (was `IHookFieldSharedProps`), `IRuntimeFieldState` (was `IBusinessRule`), `IRulesEngineAction` (was `IBusinessRuleAction`)

### Removed

- `helpers/BusinessRulesHelper.ts` (replaced by RuleEngine + ConditionEvaluator)
- `types/IBusinessRule.ts`, `IBusinessRuleAction.ts`, `IBusinessRuleActionKeys.ts`, `IBusinessRulesState.ts`
- `types/IConfigBusinessRules.ts`, `IDropdownOption.ts`, `IOrderDependencies.ts`, `IFieldArrayConfig.ts`
- `types/IExecuteValueFunction.ts`, `IHookFieldSharedProps.ts`, `IHookPerson.ts`

## [1.5.1] - 2026-03-03

### Fixed

- **Package entry points** — `package.json` referenced `dist/index.cjs` but tsup outputs `dist/index.js`. Fixed `main`, `module`, and `exports` in all 3 packages. Resolves "Module not found" errors in Next.js and other bundlers.

### Added

- **Manual save mode** — `isManualSave={true}` prop on `HookInlineForm` disables auto-save on field change. Shows Save/Cancel buttons by default, or use `renderSaveButton` for custom UI.

## [1.5.0] - 2026-03-03

Discovery and developer experience improvements.

### Added

- **Zod schema adapter** — `zodSchemaToFieldConfig()` converts Zod object schemas to `Dictionary<IFieldConfig>` without adding zod as a dependency. Maps ZodString→Textbox, ZodNumber→Number, ZodBoolean→Toggle, ZodEnum→Dropdown, ZodDate→DateControl, ZodArray→Multiselect. Detects `.email()` and `.url()` checks for automatic validation.
- **Type-safe field configs** — `defineFieldConfigs()` is a zero-cost TypeScript utility that verifies dependency field name references at compile time, catching typos in `dependencies` and `dropdownDependencies` targets.
- **JSON Schema files** — `schemas/field-config.schema.json` and `schemas/wizard-config.schema.json` published in the npm package for IDE autocompletion when writing form configs in JSON.
- "When to Use This Library" section in README with clear positioning vs competitors.
- 24 new tests (Zod adapter, TypedFieldConfig).

### Changed

- npm keywords expanded for all 3 packages to improve discoverability (added `json-forms`, `schema-forms`, `wizard-form`, `zod`, `conditional-logic`, `field-dependencies`, etc.).

## [1.4.0] - 2026-03-03

Business rules engine audit — critical bug fixes, new features, and comprehensive documentation.

### Fixed

- **String coercion in dependency matching** — `null` no longer matches `"null"`, `true` no longer matches `"true"`. New `dependencyValueMatches()` helper prevents phantom rule matches.
- **CombineBusinessRules now immutable** — returns new object instead of mutating first argument. All 9 call sites updated. Eliminates class of mutation-related bugs.
- **Reducer uses shallow copy** — `structuredClone(state)` replaced with spread operator. Only the affected config is copied, reducing GC pressure on every keystroke.
- **Hidden fields skip validation** — `clearErrors()` called on hidden fields before `trigger()`, preventing ghost error messages.
- **Self-dependency detection** — `ConfigValidator` now catches fields that have dependencies on themselves.

### Added

- **Expression engine** — `evaluateExpression("$values.qty * $values.price", formValues)` with safe evaluation (Function constructor with restricted Math-only scope, no eval)
- **Cross-field validation** — `registerCrossFieldValidations()` + `CheckCrossFieldValidationRules()` for rules like "password must match confirmPassword"
- **Rule tracing** — `enableRuleTracing()` / `getRuleTraceLog()` / `clearRuleTraceLog()` for debugging which rules fired, when, and what they changed
- **BUSINESSRULES_CLEAR action** — reset business rules for a specific config or all configs via `clearBusinessRules()`
- **`computedValue`** property on `IFieldConfig` — declare reactive computed expressions
- **`crossFieldValidations`** property on `IFieldConfig` — declare cross-field validation rules
- **Comprehensive JSDoc** on all 13 engine functions documenting lifecycle, params, returns, side effects
- 62 new tests (expression engine, cross-field validation, rule tracing, updated CombineBusinessRules immutability tests)

## [1.3.0] - 2026-03-03

Enterprise features: reliability, accessibility, persistence, theming, developer tools, and performance.

### Added

- **Async validation wired into rendering** — `HookRenderField` now runs async validators after sync pass. `AbortController` cancels in-flight checks on re-type.
- **`HookFormErrorBoundary`** — per-field error boundary wrapping each `HookRenderField`. One crashing field no longer kills the entire form. Props: `fallback`, `onError`.
- **Save reliability** — `AbortController` cancels previous in-flight saves, configurable timeout via `saveTimeoutMs` (default 30s), retry with exponential backoff via `maxSaveRetries` (default 3).
- **Accessibility (WCAG AA)** — focus trap in `HookConfirmInputsModal`, focus-to-first-error on validation failure, ARIA live regions for form status, `aria-label` on filter input, `aria-busy` during save, wizard step announcements for screen readers.
- **`useDraftPersistence`** hook — auto-save form state to localStorage on configurable interval, recover draft on mount, clear after server save.
- **`useBeforeUnload`** hook — browser warning on page leave with unsaved changes.
- **`serializeFormState` / `deserializeFormState`** — Date-safe JSON round-trip utilities.
- **Theming render props** — `renderLabel`, `renderError`, `renderStatus` on `HookFieldWrapper` for custom field chrome without replacing components.
- **CSS custom properties** — `--hook-form-error-color`, `--hook-form-warning-color`, `--hook-form-saving-color`, etc. in optional `styles.css`.
- **`formErrors`** prop on `HookInlineForm` — form-level error banner for cross-field validation.
- **`HookFormDevTools`** — collapsible dev-only panel showing business rules state, form values, errors, and dependency graph.
- **`jsonSchemaToFieldConfig()`** — convert JSON Schema to `Dictionary<IFieldConfig>`. Maps types, enums, formats, required.
- **`createLazyFieldRegistry()`** — React.lazy field registry for on-demand component loading.
- 79 new tests across 8 new test files.

### Changed

- **`HookRenderField`** refactored from `useState` + `useEffect` to `useMemo` — eliminates one render cycle per field update.

## [1.2.0] - 2026-03-02

TypeScript strict mode and MUI adapter.

### Added

- **`@bghcore/dynamic-forms-mui`** — new package with 19 MUI field components (13 editable + 6 read-only), `createMuiFieldRegistry()`, supporting components, shared helpers.
- **`normalizeFieldConfig()`** — maps deprecated `isReadonly` to `readOnly` with dev-mode console warning.
- **`docs/creating-an-adapter.md`** — complete guide for building custom UI library adapters.
- Better error messages: missing component lists available types, missing provider shows required hierarchy.

### Changed

- **`strict: true`** enabled in core tsconfig (was `strict: false, strictNullChecks: false`). ~30 null-safety fixes applied.
- Per-package publish workflow: `core-v*`, `fluent-v*`, `mui-v*` tags trigger independent deployments.

## [1.1.0] - 2026-03-02

Test infrastructure, async validation, i18n, wizard forms, and field arrays.

### Added

- **Vitest** test framework with 348 tests across 11 test files. 80%+ coverage on all core helpers.
- **Circular dependency detection** — `DependencyGraphValidator` using Kahn's algorithm, runs in `GetDefaultBusinessRules()`.
- **`ConfigValidator`** — dev-mode config validation checking dependency targets, registered components/validators, circular deps.
- **Async validation framework** — `AsyncValidationFunction` type, `registerAsyncValidations()`, `getAsyncValidation()`, `CheckAsyncFieldValidationRules()`.
- **9 new validators** (15 total): `NoSpecialCharactersValidation`, `CurrencyValidation`, `UniqueInArrayValidation` + factories: `createMinLengthValidation`, `createMaxLengthValidation`, `createNumericRangeValidation`, `createPatternValidation`, `createRequiredIfValidation`.
- **i18n** — `LocaleRegistry` with `registerLocale()`, `getLocaleString()`, `resetLocale()`. `ICoreLocaleStrings` interface. `strings.ts` rewritten with ES getters for backwards compatibility.
- **`HookWizardForm`** — multi-step wizard composing around existing form. Steps partition field order, not business rules. Render props for navigation/headers. Conditional step visibility.
- **`HookFieldArray`** — repeating sections via react-hook-form `useFieldArray`. Min/max items, defaultItem, reorderable, qualified names (`addresses.0.city`).
- **`IWizardConfig`**, **`IFieldArrayConfig`**, **`ICoreLocaleStrings`** types.
- **`ComponentTypes.FieldArray`** constant.
- `docs/FINDINGS.md` — codebase analysis and strategic expansion plan.

### Changed

- **Provider memoization** — `useCallback`/`useMemo` on `BusinessRulesProvider` and `InjectedHookFieldProvider`.
- **`React.memo`** on `HookRenderField` and `HookFieldWrapper`.

## [1.0.0] - 2026-03-02

First stable release. Both packages published to npm.

### Added

- `llms.txt` for AI/LLM discoverability (Answer.AI spec)
- `AGENTS.md` files (root, core, fluent) for agentic AI guidance
- npm metadata: `repository`, `homepage`, `bugs`, `keywords` in both package.json files

### Changed

- Version bump from 0.1.0 to 1.0.0
- Fixed README reference from "Fluent UI v8" to "Fluent UI v9"
- Updated fluent package peer dependency on core from `^0.1.0` to `^1.0.0`

## [0.1.0] - 2026-03-02

First buildable release. Restructured from a single broken package (extracted from
an internal monorepo) into two independent, publishable packages.

### Added

- **Monorepo structure** with npm workspaces (`packages/core`, `packages/fluent`)
- **`@bghcore/dynamic-forms-core`** -- UI-library agnostic business rules engine (React only, no UI library deps)
  - `BusinessRulesProvider` and `InjectedHookFieldProvider` React context providers
  - `ProcessAllBusinessRules`, `ProcessFieldBusinessRule`, and full rule evaluation pipeline
  - `HookInlineForm` component with auto-save, expand/collapse, and confirm-input modal
  - `HookRenderField` with component injection via `React.cloneElement`
  - `HookFieldWrapper` with plain HTML status indicators (no UI library dependency)
  - `HookConfirmInputsModal` using native `<dialog>` with optional `renderDialog` prop
  - Pluggable `ValidationRegistry` with built-in validators (email, phone, year, URL, max KB)
  - Pluggable `ValueFunctionRegistry` with built-in functions (setDate, setDateIfNull, setLoggedInUser, inheritFromParent)
  - `CombineSchemaConfig` for merging field configs with schema definitions
  - All TypeScript interfaces exported (`IFieldConfig`, `IBusinessRule`, `IHookFieldSharedProps`, etc.)
  - Local utility types replacing external dependencies (`Dictionary<T>`, `IEntityData`, `SubEntityType`)
  - Local utility functions (`isEmpty`, `isNull`, `deepCopy`, `sortDropdownOptions`, etc.)
- **`@bghcore/dynamic-forms-fluent`** -- Fluent UI v8 field components
  - 13 editable field components: Textbox, Number, Toggle, Dropdown, MultiSelect, DateControl, Slider, Fragment, SimpleDropdown, MultiSelectSearch, PopOutEditor, DocumentLinks, StatusDropdown
  - 6 read-only field components: ReadOnly, ReadOnlyArray, ReadOnlyDateTime, ReadOnlyCumulativeNumber, ReadOnlyRichText, ReadOnlyWithButton
  - Supporting components: ReadOnlyText, StatusMessage, HookFormLoading (Shimmer), StatusColor, StatusDropdown, DocumentLink, DocumentLinks
  - `createFluentFieldRegistry()` for one-line setup with `InjectedHookFieldProvider`
  - Shared helpers: `FieldClassName`, `GetFieldDataTestId`, `onRenderDropdownItemWithIcon`, `formatDateTime`
- **tsup build system** producing CJS, ESM, and `.d.ts` for both packages
- `tsconfig.base.json` shared TypeScript configuration

### Changed

- **`HookInlineForm`** now accepts `currentUserUpn` prop instead of reading from a legacy auth context
- **`HookInlineForm`** now accepts `onSaveError` callback instead of using a legacy notification system
- **`HookInlineForm`** now accepts `renderExpandButton`, `renderFilterInput`, and `renderDialog` render props instead of depending on Fluent UI `DefaultButton` and legacy UI components
- **`HookRenderField`** no longer uses external entity state hooks -- external entity sync is now the consumer's responsibility
- **`HookFieldWrapper`** uses plain HTML elements for error/warning/saving icons instead of Fluent UI `Icon` and `Spinner`
- **`HookConfirmInputsModal`** uses native `<dialog>` instead of legacy UI components
- **`HookPopOutEditor`** simplified to Textarea-only mode (removed rich text editor dependency)
- **`HookMultiSelectSearch`** uses Fluent UI `ComboBox` instead of legacy UI components
- **`DocumentLinks`** uses Fluent UI `Dialog` instead of legacy UI components
- **`DocumentLink`** uses `<a>` tag instead of a legacy anchor component
- **`BusinessRulesReducer`** uses `structuredClone` instead of a legacy `DeepCopy` utility
- **`OrderDependencies`** recursive type uses `interface OrderDependencyMap` to avoid circular reference
- Validation functions are now pluggable via `registerValidations()` instead of hardcoded switch/case
- Value functions are now pluggable via `registerValueFunctions()` instead of hardcoded switch/case
- `IHookFieldSharedProps.setFieldValue` generic parameter simplified to `unknown`

### Removed

- All legacy internal monorepo dependencies (replaced with local implementations or props)
- All legacy UI component library imports
- All `lodash` imports
- `react-error-boundary` dependency
- **14 domain-specific field components**: removed components tightly coupled to the original host application's data models and APIs
- **Host-app coupled components**: HookInlineFormWrapper (data fetching), HookFormPanel (slide-out panel), HookFormBoundary (error boundary with hardcoded internal link)
- **Panel system**: HookInlineFormPanelProvider, IHookFormPanelActionProps, IHookPanelConfig
- **Domain-specific helpers**: People picker rendering, product taxonomy API, work item creation, block status change processing, customer resolution
- `InjectComponents.tsx` (replaced by `@bghcore/dynamic-forms-fluent` `createFluentFieldRegistry()`)
- `HookInlineForm.scss` (broken -- used undefined SCSS variables)
- `rollup.config.js` (replaced by tsup)
- Domain-specific strings and constants
