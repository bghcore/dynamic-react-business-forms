# dynamic-react-business-forms

## Project Overview

A React library for rendering complex, configuration-driven forms with a built-in rules engine. Forms are defined as a single `IFormConfig` JSON object (field definitions, rules with rich conditions, validation, ordering) and the library handles rendering, validation, auto-save, and field interactions automatically.

Published as three npm packages:
- `@bghcore/dynamic-forms-core` -- UI-library agnostic rules engine and form orchestration (React + react-hook-form only)
- `@bghcore/dynamic-forms-fluent` -- Fluent UI v9 field component implementations
- `@bghcore/dynamic-forms-mui` -- Material UI (MUI) field component implementations

## Architecture

### Rendering Pipeline

```
IFormConfig (v2)
  -> DynamicForm (form state via react-hook-form, save with AbortController/retry)
    -> evaluateAllRules() -> IRuntimeFormState
    -> FormFields (ordered field list)
      -> FormErrorBoundary (per-field crash isolation)
        -> RenderField (per field, useMemo for component resolution)
          -> Looks up injectedFields[type] from context
          -> Controller (react-hook-form integration, unified validation)
          -> FieldWrapper (label, error, status chrome, render props for theming)
            -> React.cloneElement(InjectedFieldComponent, IFieldProps)
```

### Provider Hierarchy

Two React context providers must wrap the form tree (both memoized via useMemo):

```
<RulesEngineProvider>          -- Owns rule state via useReducer (memoized context value)
  <InjectedFieldProvider>      -- Component injection registry (memoized context value)
    <DynamicForm>              -- Entry point
```

### Rules Engine (v2)

Rules are **declarative** -- defined as `IRule[]` on each field config with rich conditions and effects.

**Condition operators (15):** equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual, contains, notContains, startsWith, endsWith, in, notIn, isEmpty, isNotEmpty, matches

**Logical operators:** and, or, not (composable condition trees)

**Lifecycle:**
1. **Init**: `IFormConfig` + entity data -> `evaluateAllRules()` -> builds dependency graph via topological sort + evaluates all rules
2. **Validate**: `validateDependencyGraph()` checks for circular/self dependencies via Kahn's algorithm
3. **Trigger**: Field value change -> `processFieldChange()`
4. **Evaluate**: `evaluateAffectedFields()` -- only re-evaluates transitively affected fields (incremental)
5. **Resolve**: Priority-based conflict resolution (higher priority rule wins)
6. **Apply**: Dispatch to reducer -> React re-render -> fields read updated `IRuntimeFieldState`

**Rule effects supported:**
- Required/Hidden/ReadOnly toggle
- Component type swap
- Validation rule replacement
- Computed value expressions ($values.field, $fn.name(), $parent.field)
- Dropdown option filtering/replacement
- Field ordering
- Cross-field effects (one rule can affect multiple fields)
- Conditional validation (validate only when condition met)
- Confirm input modal trigger

### Component Injection System

Fields are registered as a `Record<string, JSX.Element>` via `InjectedFieldProvider`. `RenderField` looks up the component by `type` string key and uses `React.cloneElement()` to pass standardized `IFieldProps`. Consumers can override any built-in field or add custom ones.

### Pluggable Registries

- `ValidationRegistry` -- Unified `ValidatorFn` for sync, async, and cross-field validation. 14 built-in validators + `registerValidators()` for custom. Per-rule `when` condition, `debounceMs`, `async` flag.
- `ValueFunctionRegistry` -- Value functions via `$fn.name()` syntax in computed expressions. `registerValueFunctions()` for custom.
- `LocaleRegistry` -- i18n support via `registerLocale()` with partial overrides and English fallback
- `formStateSerialization` -- Date-safe JSON round-trip for draft persistence
- `jsonSchemaImport` -- Convert JSON Schema to `Record<string, IFieldConfig>`
- `zodSchemaImport` -- Convert Zod schema to `Record<string, IFieldConfig>` (no zod dependency)
- `lazyFieldRegistry` -- Create field registries with React.lazy for on-demand loading

## Key Types

```typescript
interface IFormConfig {
  version: 2;
  fields: Record<string, IFieldConfig>;
  fieldOrder?: string[];
  wizard?: IWizardConfig;
  settings?: IFormSettings;
}

interface IFieldConfig {
  type: string;            // "Textbox", "Dropdown", "Toggle", etc.
  label: string;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  defaultValue?: unknown;
  computedValue?: string;  // "$values.qty * $values.price" or "$fn.setDate()"
  options?: IOption[];      // { value, label, disabled?, group?, icon?, color? }
  validate?: IValidationRule[];  // { name, params?, message?, async?, debounceMs?, when? }
  rules?: IRule[];          // { when: ICondition, then: IFieldEffect, else?, priority? }
  items?: Record<string, IFieldConfig>;  // field array items (full config)
  config?: Record<string, unknown>;      // arbitrary metadata for field component
}

type ICondition = IFieldCondition | ILogicalCondition;
// IFieldCondition: { field, operator, value? }
// ILogicalCondition: { operator: "and"|"or"|"not", conditions: ICondition[] }
```

## Key Directories

```
packages/
  core/                          -- @bghcore/dynamic-forms-core
    src/
      index.ts                   -- Public API barrel exports
      constants.ts               -- ComponentTypes, FormConstants
      strings.ts                 -- FormStrings (i18n-aware, getters over LocaleRegistry)
      components/
        HookInlineForm.tsx       -- DynamicForm (main form component)
        HookInlineFormFields.tsx -- FormFields (field list rendering)
        HookRenderField.tsx      -- RenderField (per-field routing + Controller)
        HookFieldWrapper.tsx     -- FieldWrapper (label, error, status chrome)
        HookConfirmInputsModal.tsx -- ConfirmInputsModal (native <dialog>, focus trap)
        HookWizardForm.tsx       -- WizardForm (multi-step, render props)
        HookFieldArray.tsx       -- FieldArray (react-hook-form useFieldArray)
        HookFormErrorBoundary.tsx -- FormErrorBoundary (crash isolation)
        HookFormDevTools.tsx     -- FormDevTools (dev panel: rules, values, errors, graph)
      helpers/
        ConditionEvaluator.ts    -- evaluateCondition (15 operators + AND/OR/NOT)
        RuleEngine.ts            -- buildDependencyGraph, evaluateAllRules, evaluateAffectedFields, topologicalSort
        HookInlineFormHelper.ts  -- Form init, validation, computed values, field rendering
        ValidationRegistry.ts    -- Unified ValidatorFn registry (sync+async+cross-field)
        ValueFunctionRegistry.ts -- $fn.name() value function registry
        ExpressionEngine.ts      -- $values, $fn, $parent, $root expression evaluation
        DependencyGraphValidator.ts -- Cycle/self-dependency detection (Kahn's algorithm)
        ConfigValidator.ts       -- Dev-mode config validation
        LocaleRegistry.ts        -- i18n: registerLocale(), getLocaleString(), resetLocale()
        WizardHelper.ts          -- getVisibleSteps, getStepFields, validateStepFields
        FieldHelper.ts           -- SortOptions utility
        RuleTracer.ts            -- Rule evaluation tracing/debugging
      types/
        IFormConfig.ts           -- IFormConfig, IFormSettings
        IFieldConfig.ts          -- IFieldConfig (v2 schema)
        IRule.ts                 -- IRule
        ICondition.ts            -- ICondition, IFieldCondition, ILogicalCondition
        IFieldEffect.ts          -- IFieldEffect
        IOption.ts               -- IOption (value/label)
        IValidationRule.ts       -- IValidationRule (unified)
        IFieldProps.ts           -- IFieldProps<T> (injected field component props)
        IRuntimeFieldState.ts    -- IRuntimeFieldState, IRuntimeFormState, IRulesEngineState
        IRulesEngineAction.ts    -- RulesEngineActionType, action types
        IWizardConfig.ts         -- IWizardStep, IWizardConfig (condition-based visibility)
        ILocaleStrings.ts        -- ICoreLocaleStrings (~50 keys)
        TypedFieldConfig.ts      -- defineFormConfig() type-safe builder
        IConfirmInputModalProps.ts, IFieldToRender.ts, IHookInlineFormSharedProps.ts
      providers/
        BusinessRulesProvider.tsx -- RulesEngineProvider (useReducer + memoized)
        InjectedHookFieldProvider.tsx -- InjectedFieldProvider (useMemo memoized)
      reducers/
        BusinessRulesReducer.ts  -- useReducer reducer for rules engine state
      hooks/
        useDraftPersistence.ts   -- Auto-save form state to localStorage
        useBeforeUnload.ts       -- Browser warning on unsaved changes
      utils/
        index.ts                 -- isEmpty, isNull, deepCopy, Dictionary, etc.
        formStateSerialization.ts -- Date-safe JSON round-trip
        jsonSchemaImport.ts      -- JSON Schema -> IFieldConfig
        zodSchemaImport.ts       -- Zod schema -> IFieldConfig (no zod dep)
        lazyFieldRegistry.ts     -- React.lazy field loading
      styles.css                 -- Optional CSS custom properties for theming
      __tests__/                 -- Vitest tests (478 tests, 24 files)
        __fixtures__/            -- Shared test configs and entity data (v2 format)

  fluent/                        -- @bghcore/dynamic-forms-fluent
    src/
      index.ts, registry.ts, helpers.ts
      components/ (ReadOnlyText, StatusMessage, HookFormLoading, StatusDropdown/, DocumentLinks/)
      fields/ (13 editable + 6 read-only, accept IFieldProps)

  mui/                           -- @bghcore/dynamic-forms-mui
    src/
      index.ts, registry.ts, helpers.ts
      components/ (ReadOnlyText, StatusMessage, HookFormLoading)
      fields/ (13 editable + 6 read-only, accept IFieldProps, using @mui/material)
```

## Build & Dev

```bash
npm run build            # Build all packages (core, fluent, mui)
npm run build:core       # Build core package only
npm run build:fluent     # Build fluent package only
npm run build:mui        # Build MUI package only
npm run clean            # Remove all dist/ directories
npm run test             # Run all tests (vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

**Build output per package:** `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types)

**Monorepo:** npm workspaces with `packages/core`, `packages/fluent`, `packages/mui`

## Tech Stack

- **React 18/19** with hooks
- **react-hook-form v7** for form state management
- **Fluent UI v9** (`@fluentui/react-components`) for UI components (fluent package)
- **MUI v5/v6** (`@mui/material`) for UI components (mui package)
- **TypeScript** with `strict: true`
- **Vitest** for testing (478 tests across 24 files)
- **tsup** for bundling (CJS + ESM + .d.ts)
- **npm workspaces** for monorepo management

## Coding Conventions

- Core components: `DynamicForm`, `FormFields`, `RenderField`, `FieldWrapper`, `WizardForm`, `FieldArray`
- Adapter field components use `Hook` prefix (e.g., `HookTextbox`, `HookDropdown`) -- kept for file naming
- Read-only variants in `fields/readonly/` with `HookReadOnly` prefix
- Interfaces use `I` prefix (e.g., `IFieldConfig`, `IRuntimeFieldState`)
- Providers export both the provider component and a `Use*Context` hook
- Field components receive `IFieldProps<T>` via `React.cloneElement`
- Rules engine actions follow Redux pattern (type enum + payload)
- All user-facing strings resolve through `LocaleRegistry` for i18n support
- Options use `{ value, label }` (not `{ key, text }`)
- Field config uses `type` (not `component`), `options` (not `dropdownOptions`), `config` (not `meta`), `validate` (not `validations`)
