# Roadmap to 1.0 Release

## Current State

### What This Library Is

A **configuration-driven React form library** with a built-in business rules engine. You define forms as JSON configs specifying fields, their types, dependencies between fields, dropdown filtering rules, field ordering rules, and combo (AND) conditions. The library handles:

- Rendering the correct component for each field type
- Evaluating business rules when field values change (show/hide, required, readonly, component swap, validation changes, dropdown filtering, field reordering)
- Auto-save with debounce and manual save modes
- Expand/collapse for long forms
- Confirmation modals for sensitive field changes
- A component injection system that lets consumers override any field renderer
- Pluggable validation and value function registries

### Architecture

The library is split into two packages:

- **`@bghcore/dynamic-forms-core`** -- Framework-agnostic business rules engine, form orchestration, providers, and TypeScript interfaces. No UI library dependency.
- **`@bghcore/dynamic-forms-fluent`** -- Fluent UI v9 field component implementations. Depends on core.

---

## Phase 1: Make It Build -- COMPLETE

**Status:** Done (v0.1.0)

- Restructured from a single broken package into a monorepo with two publishable packages
- Resolved all broken relative imports to an internal monorepo
- Replaced all legacy internal dependencies with local implementations or injectable props
- Removed 14 domain-specific field components coupled to the original host application
- Removed host-app coupled components (data fetching wrapper, slide-out panel, error boundary)
- Made validation and value functions pluggable via registries
- Switched from Rollup to tsup for bundling
- Both packages build and produce CJS, ESM, and `.d.ts` output

---

## Phase 2: Quality & Developer Experience (Current Focus)

**Goal**: Make the library trustworthy, well-documented, and easy to adopt.

### 2.1 Testing

- Unit tests for `BusinessRulesHelper.ts` (pure functions, highest value target)
- Unit tests for `HookInlineFormHelper.ts` (validation, value functions, schema merging)
- Unit tests for `ValidationRegistry` and `ValueFunctionRegistry`
- Component tests for `HookInlineForm` with `@testing-library/react`
- Component tests for individual field types in the fluent package
- Integration tests for business rules cascading (combo rules, circular dependencies, revert-then-reapply)

### 2.2 Type Safety Improvements

- Enable `strictNullChecks` and fix resulting type errors
- Consolidate `isReadonly` -> `readOnly` in IFieldConfig
- Tighten `meta` typing (remove `object`)
- Audit remaining `any` usage and replace with proper types

### 2.3 Documentation

- README.md with quick start, API reference, and examples
- Field type catalog with descriptions of each field component
- Business rules configuration guide with examples for each rule type
- Migration guide for consumers moving from a monolithic form setup

### 2.4 Error Handling

- Add validation that configs passed to `initBusinessRules` are well-formed
- Add clear error messages when a `configName` doesn't exist in business rules state
- Add development-mode console warnings for missing injected field components
- Review auto-save promise chain ordering (`.finally()` vs `.catch()`)

---

## Phase 3: Performance & Ecosystem (Next)

**Goal**: Optimize for large forms and expand UI framework support.

### 3.1 Performance Optimizations

- Memoize provider context values with `useMemo`
- Add `useCallback` for `initBusinessRules` and `processBusinessRule`
- Fix `CombineBusinessRules` to avoid mutating its first argument
- Consider splitting business rules context (state vs. dispatch) to reduce re-renders
- Benchmark with 50+ field forms and optimize hot paths

### 3.2 Internationalization (i18n)

- Externalize all user-facing strings from `strings.ts`
- Create a string provider interface for consumers to supply translations
- Support RTL layouts

### 3.3 Additional UI Adapters

- Create a `@bghcore/dynamic-forms-mui` package for Material UI field components
- Create a `@bghcore/dynamic-forms-headless` package for unstyled/headless field components
- Document how to create a custom UI adapter package

### 3.4 Tooling & CI

- Storybook for field component development and visual documentation
- CI/CD pipeline (build, lint, test, publish)
- `prepublishOnly` script: `npm run lint && npm run test && npm run build`
- Automated npm publishing for tagged releases

---

## Phase 4: Polish & 1.0

**Goal**: Production-ready release.

### 4.1 API Stabilization

- Review all public APIs for naming consistency and ergonomics
- Create a unified `<DynamicFormsProvider>` that wraps both context providers
- Finalize the field registration API
- Mark stable APIs and document any planned breaking changes

### 4.2 Advanced Features

- Visual business rules editor (optional companion tool)
- Form config validation utility (lint configs before runtime)
- Server-side rendering support
- Async validation support

### 4.3 Release

- LICENSE file
- Contributing guide
- Final documentation review
- Publish 1.0.0 to npm

---

## Milestone Plan

| Milestone | Scope | Deliverable |
|---|---|---|
| **0.1.0** | Phase 1 complete | Library builds. Two-package monorepo. All legacy dependencies removed. |
| **0.2.0** | Phase 2 complete | Tests for core logic. strictNullChecks enabled. README and docs. Error handling improvements. |
| **0.3.0** | Phase 3 complete | Performance optimizations. i18n support. At least one additional UI adapter. CI/CD. |
| **1.0.0** | Phase 4 complete | Stable API. Full documentation. Storybook. Published to npm. |
