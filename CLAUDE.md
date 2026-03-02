# dynamic-react-business-forms

## Project Overview

A React library for rendering complex, configuration-driven forms with a built-in business rules engine. Forms are defined as JSON configurations (field definitions, dependency rules, dropdown options, ordering) and the library handles rendering, validation, auto-save, and field interactions automatically.

Originally extracted from two internal Microsoft repos (`@cxpui` ecosystem). The goal is to make this a standalone, publishable npm package (`@brhanso/dynamic-business-forms`).

## Architecture

### Rendering Pipeline

```
Config Name
  -> HookFormBoundary (error boundary)
    -> HookInlineFormWrapper (data loading gate)
      -> Fetches: property configs, entity data, schema configs
      -> CombineSchemaConfig() -> IFieldConfig dictionary
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

Three React context providers must wrap the form tree:

```
<BusinessRulesProvider>          -- Owns rule state via useReducer
  <HookInlineFormPanelProvider>  -- Manages slide-out panel + custom save hooks
    <InjectedHookFieldProvider>  -- Component injection registry
      <HookFormBoundary>         -- Entry point
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

## Key Directories

```
src/
  index.ts                    -- Public API barrel exports
  Constants.ts                -- Form constants (expand cutoff, shimmer config, component type keys)
  Strings.ts                  -- User-facing string literals (English, not i18n)
  Helpers.tsx                 -- Mixed helper functions (people picker, taxonomy, ADO, etc.)
  InjectComponents.tsx        -- Default field registry (hookFields dictionary)
  Components/                 -- Core form components
    HookInlineForm.tsx        -- Main form component (form state, auto-save, business rules orchestration)
    HookInlineFormWrapper.tsx -- Data loading wrapper (configs, entities, schemas)
    HookInlineFormFields.tsx  -- Field list rendering
    HookRenderField.tsx       -- Per-field routing + Controller integration
    HookFieldWrapper.tsx      -- Field chrome (label, error, status)
    HookFormBoundary.tsx      -- Error boundary
    HookFormPanel.tsx         -- Side panel form container
    HookFormLoading.tsx       -- Shimmer loading state
    HookConfirmInputsModal.tsx -- Confirmation dialog
    PeoplePicker.tsx          -- AAD person picker (domain-specific)
    PeoplePickerList.tsx      -- AAD multi-person picker (domain-specific)
    ProductTaxonomy.tsx       -- Azure product hierarchy (domain-specific)
    ADOWorkItem.tsx           -- ADO work item display (domain-specific)
    StatusDropdown/           -- Status dropdown with color indicators
    DocumentLinks/            -- URL link CRUD
    ListTableControl.tsx      -- Key project table (domain-specific)
    ReadOnlyText.tsx          -- Read-only text display
    StatusMessage.tsx         -- Error/warning/saving status
  Fields/                     -- Editable field components (22 types)
    HookTextbox.tsx, HookDropdown.tsx, HookToggle.tsx, HookNumber.tsx,
    HookMultiSelect.tsx, HookDateControl.tsx, HookSlider.tsx, HookFragment.tsx,
    HookSimpleDropdown.tsx, HookMultiSelectSearch.tsx, HookPopOutEditor.tsx,
    HookPeoplePicker.tsx, HookPeoplePickerList.tsx, HookStatusDropdown.tsx,
    HookDocumentLinks.tsx, HookProductTaxonomy.tsx, HookDataCenterRegion.tsx,
    HookChildEntitySearch.tsx, HookADOWorkItem.tsx, HookADOTemplates.tsx,
    HookSubscriptionsTextArea.tsx, HookStatusReasonDescription.tsx
    ReadOnly/                 -- Read-only field variants (12 types)
  Helpers/                    -- Pure helper functions
    BusinessRulesHelper.ts    -- Rule evaluation logic (~760 lines, largest file)
    FieldHelper.ts            -- Dropdown sorting utility
    HookInlineFormHelper.ts   -- Form init, validation, value functions, schema merging
  Interfaces/                 -- TypeScript interfaces
    IBusinessRule.ts          -- Runtime rule state per field
    IFieldConfig.ts           -- Static field configuration (primary consumer input)
    IHookFieldSharedProps.ts  -- Props contract for injected field components
    IHookFormPanelActionProps.ts -- Panel action config
    IHookInlineFormSharedProps.ts -- Shared form props
    IBusinessRulesState.ts    -- Top-level rules state container
    IConfigBusinessRules.ts   -- Rules for a single form config
    IBusinessRuleAction.ts    -- Reducer action types
    IBusinessRuleActionKeys.ts -- Action type enum
    IConfirmInputModalProps.ts -- Confirm modal state
    IExecuteValueFunction.ts  -- Value function execution DTO
    IFieldToRender.ts         -- Field render instruction
    IHookPanelConfig.ts       -- Panel init config
    IHookPerson.ts            -- Person data model
    IOrderDependencies.ts     -- Order dependency type
  Providers/                  -- React context providers
    BusinessRulesProvider.tsx  -- Business rules state + evaluation
    HookInlineFormPanelProvider.tsx -- Panel management
    InjectedHookFieldProvider.tsx -- Component injection
    I*.ts                     -- Provider interfaces
  Reducers/
    BusinessRulesReducer.tsx  -- useReducer reducer for business rules
  Content/
    HookInlineForm.scss       -- Styles (broken: uses undefined SCSS variables)
```

## Build & Dev

```bash
npm run build          # Rollup build -> dist/ (CJS + ESM + .d.ts)
npm run lint           # ESLint
npm test               # Jest (no tests exist yet)
```

**Build output:** `dist/index.cjs.js` (CJS), `dist/index.esm.js` (ESM), `dist/index.d.ts` (types)

**Current build status:** WILL NOT BUILD. ~30+ files import from outside src/ via `../../` relative paths referencing the original monorepo. See docs/ROADMAP.md for the full list.

## Tech Stack

- **React 18/19** with hooks
- **react-hook-form v7** for form state management
- **Fluent UI v8** (`@fluentui/react`) for UI components
- **TypeScript** with strict mode
- **Rollup** for bundling

## External Dependencies NOT in package.json (build blockers)

- `@cxpui/common` -- Dictionary type, utility functions (isEmpty, isNull, DeepCopy, etc.) -- used in 28+ files
- `@cxpui/commoncontrols` -- Person component, auth context, entity state -- 15+ files
- `@cxpui/service` -- ADO work item APIs -- 4 files
- `@cxpui/generalapi` -- Product taxonomy, regions, people search APIs -- 2 files
- `@cxpui/dux` -- Column rendering utilities -- 2 files
- `@elixir/components` -- ElxDialog, ElxPanel, ElxDropdown, ElxTable -- 8 files
- `@elixir/fx` -- ElxRichTextEditor, ElxHtml -- 2 files
- `react-error-boundary` -- Error boundary -- 1 file
- `lodash` -- Dictionary type -- 2 files

## Known Issues

- `isReadonly` vs `readOnly` naming inconsistency in IFieldConfig (TODO comment exists)
- `Helpers.tsx` is a "junk drawer" mixing API calls, JSX rendering, and domain logic
- Validation and value functions are hardcoded switch/case, not pluggable
- `CombineBusinessRules` mutates its first argument in place
- `DeepCopy` on every reducer dispatch (performance concern for large forms)
- No memoization on provider context values
- SCSS file uses 8 undefined variables and 2 undefined @extend mixins
- Hardcoded ICM link in error boundary
- Hardcoded English strings (no i18n)
- No tests exist

## Coding Conventions

- Components use `Hook` prefix (e.g., `HookTextbox`, `HookDropdown`)
- Read-only variants in `Fields/ReadOnly/` with `HookReadOnly` prefix
- Interfaces use `I` prefix (e.g., `IFieldConfig`, `IBusinessRule`)
- Providers export both the provider component and a `Use*Context` hook
- Field components receive `IHookFieldSharedProps<T>` via `React.cloneElement`
- Business rule actions follow Redux action pattern (type enum + payload)
