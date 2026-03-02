# dynamic-react-business-forms

## Project Overview

A React library for rendering complex, configuration-driven forms with a built-in business rules engine. Forms are defined as JSON configurations (field definitions, dependency rules, dropdown options, ordering) and the library handles rendering, validation, auto-save, and field interactions automatically.

Published as two npm packages:
- `@bghcore/dynamic-forms-core` -- Framework-agnostic business rules engine and form orchestration
- `@bghcore/dynamic-forms-fluent` -- Fluent UI v9 field component implementations

## Architecture

### Rendering Pipeline

```
Config Name
  -> HookInlineForm (form state via react-hook-form)
    -> initBusinessRules() -> business rules state
    -> HookInlineFormFields (ordered field list)
      -> HookRenderField (per field)
        -> Looks up injectedFields[component] from context
        -> Controller (react-hook-form integration)
        -> HookFieldWrapper (label, error, status chrome)
          -> React.cloneElement(InjectedFieldComponent, fieldProps)
```

### Provider Hierarchy

Two React context providers must wrap the form tree:

```
<BusinessRulesProvider>          -- Owns rule state via useReducer
  <InjectedHookFieldProvider>    -- Component injection registry
    <HookInlineForm>             -- Entry point
```

### Business Rules Engine

Rules are **declarative** -- defined as data in `IFieldConfig.dependencies`, not imperative code.

**Lifecycle:**
1. **Init**: `IFieldConfig[]` + entity data -> `ProcessAllBusinessRules()` -> builds dependency graph + initial rule state
2. **Trigger**: Field value change -> `processBusinessRule()`
3. **Evaluate**: Revert previous rules -> re-evaluate dependents -> apply new rules -> combo (AND) rules -> dropdown deps -> order deps
4. **Apply**: Dispatch to reducer -> React re-render -> fields read updated state

**Rule types supported:**
- Required/Hidden/ReadOnly toggle
- Component type swap
- Validation rule changes
- Computed value functions
- Dropdown option filtering
- Field ordering
- Combo (AND) multi-field conditions
- Confirm input modal trigger

### Component Injection System

Fields are registered as a `Dictionary<JSX.Element>` via `InjectedHookFieldProvider`. `HookRenderField` looks up the component by string key and uses `React.cloneElement()` to pass standardized `IHookFieldSharedProps`. Consumers can override any built-in field or add custom ones.

### Pluggable Registries

Validation and value functions use pluggable registries instead of hardcoded switch/case:
- `ValidationRegistry` -- register custom validation functions via `registerValidations()`
- `ValueFunctionRegistry` -- register custom value functions via `registerValueFunctions()`

## Key Directories

```
packages/
  core/                          -- @bghcore/dynamic-forms-core
    src/
      index.ts                   -- Public API barrel exports
      constants.ts               -- Form constants (expand cutoff, shimmer config, component type keys)
      strings.ts                 -- User-facing string literals (English, not i18n)
      components/                -- Core form components
        HookInlineForm.tsx       -- Main form component (form state, auto-save, business rules orchestration)
        HookInlineFormFields.tsx -- Field list rendering
        HookRenderField.tsx      -- Per-field routing + Controller integration
        HookFieldWrapper.tsx     -- Field chrome (label, error, status) using plain HTML
        HookConfirmInputsModal.tsx -- Confirmation dialog using native <dialog>
      helpers/                   -- Pure helper functions
        BusinessRulesHelper.ts   -- Rule evaluation logic (~760 lines, largest file)
        FieldHelper.ts           -- Dropdown sorting utility
        HookInlineFormHelper.ts  -- Form init, validation, value functions, schema merging
        ValidationRegistry.ts    -- Pluggable validation function registry
        ValueFunctionRegistry.ts -- Pluggable value function registry
      types/                     -- TypeScript interfaces
        IBusinessRule.ts         -- Runtime rule state per field
        IFieldConfig.ts          -- Static field configuration (primary consumer input)
        IHookFieldSharedProps.ts -- Props contract for injected field components
        IHookInlineFormSharedProps.ts -- Shared form props
        IBusinessRulesState.ts   -- Top-level rules state container
        IConfigBusinessRules.ts  -- Rules for a single form config
        IBusinessRuleAction.ts   -- Reducer action types
        IBusinessRuleActionKeys.ts -- Action type enum
        IConfirmInputModalProps.ts -- Confirm modal state
        IExecuteValueFunction.ts -- Value function execution DTO
        IFieldToRender.ts        -- Field render instruction
        IHookPerson.ts           -- Person data model
        IOrderDependencies.ts    -- Order dependency type
        IDropdownOption.ts       -- Dropdown option type
      providers/                 -- React context providers
        BusinessRulesProvider.tsx -- Business rules state + evaluation
        InjectedHookFieldProvider.tsx -- Component injection
        I*.ts                    -- Provider interfaces
      reducers/
        BusinessRulesReducer.ts  -- useReducer reducer for business rules
      utils/
        index.ts                 -- Local utility functions (isEmpty, isNull, deepCopy, Dictionary, etc.)

  fluent/                        -- @bghcore/dynamic-forms-fluent
    src/
      index.ts                   -- Public API barrel exports
      registry.ts                -- createFluentFieldRegistry() for one-line setup
      helpers.ts                 -- Shared field helpers (className, testId, dropdown rendering, date formatting)
      components/                -- Supporting UI components
        ReadOnlyText.tsx         -- Read-only text display
        StatusMessage.tsx        -- Error/warning/saving status
        HookFormLoading.tsx      -- Shimmer loading state
        StatusDropdown/          -- Status dropdown with color indicators
        DocumentLinks/           -- URL link CRUD
      fields/                    -- Editable field components (13 types)
        HookTextbox.tsx, HookDropdown.tsx, HookToggle.tsx, HookNumber.tsx,
        HookMultiSelect.tsx, HookDateControl.tsx, HookSlider.tsx, HookFragment.tsx,
        HookSimpleDropdown.tsx, HookMultiSelectSearch.tsx, HookPopOutEditor.tsx,
        HookDocumentLinks.tsx, HookStatusDropdown.tsx
        readonly/                -- Read-only field variants (6 types)
          HookReadOnly.tsx, HookReadOnlyArray.tsx, HookReadOnlyDateTime.tsx,
          HookReadOnlyCumulativeNumber.tsx, HookReadOnlyRichText.tsx,
          HookReadOnlyWithButton.tsx
```

## Build & Dev

```bash
npm run build            # Build all packages (core then fluent)
npm run build:core       # Build core package only
npm run build:fluent     # Build fluent package only
npm run clean            # Remove all dist/ directories
```

**Build output per package:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)

**Monorepo:** npm workspaces with `packages/core` and `packages/fluent`

## Tech Stack

- **React 18/19** with hooks
- **react-hook-form v7** for form state management
- **Fluent UI v9** (`@fluentui/react-components`) for UI components (fluent package only)
- **TypeScript** with strict mode
- **tsup** for bundling (CJS + ESM + .d.ts)
- **npm workspaces** for monorepo management

## Known Issues

- `isReadonly` vs `readOnly` naming inconsistency in IFieldConfig (TODO comment exists)
- `CombineBusinessRules` mutates its first argument in place
- No memoization on provider context values
- Hardcoded English strings (no i18n)
- No tests exist

## Coding Conventions

- Components use `Hook` prefix (e.g., `HookTextbox`, `HookDropdown`)
- Read-only variants in `fields/readonly/` with `HookReadOnly` prefix
- Interfaces use `I` prefix (e.g., `IFieldConfig`, `IBusinessRule`)
- Providers export both the provider component and a `Use*Context` hook
- Field components receive `IHookFieldSharedProps<T>` via `React.cloneElement`
- Business rule actions follow Redux action pattern (type enum + payload)
