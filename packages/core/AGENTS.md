# AGENTS.md -- @bghcore/dynamic-forms-core

## Package Purpose

Framework-agnostic business rules engine and form orchestration. This package has **zero UI library dependencies** -- only React and react-hook-form.

## Critical Constraints

- **No UI library imports allowed.** No `@fluentui/*`, no Material UI, no CSS-in-JS libraries. Plain HTML only for any visual elements (see `HookFieldWrapper.tsx`).
- **`strictNullChecks: false`** in tsconfig. This is known tech debt. Do not enable it without fixing all violations first.
- **Use `React.JSX.Element`** not bare `JSX.Element` for return types.
- **Use `structuredClone`** for deep copies, not `JSON.parse(JSON.stringify(...))` or lodash.

## Architecture

```
BusinessRulesProvider (useReducer for rule state)
  -> InjectedHookFieldProvider (component registry)
    -> HookInlineForm (react-hook-form, auto-save, business rules init)
      -> HookInlineFormFields (ordered field list)
        -> HookRenderField (Controller + component injection lookup)
          -> HookFieldWrapper (label, error, status chrome -- plain HTML)
            -> React.cloneElement(injectedField, IHookFieldSharedProps)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/helpers/BusinessRulesHelper.ts` | Core rule evaluation (~760 lines, largest file). Processes dependencies, combo rules, dropdown deps, order deps. |
| `src/helpers/HookInlineFormHelper.ts` | Form initialization, validation execution, value functions, schema merging. |
| `src/helpers/ValidationRegistry.ts` | Pluggable validation function registry. Register custom validators via `registerValidations()`. |
| `src/helpers/ValueFunctionRegistry.ts` | Pluggable value function registry. Register custom value functions via `registerValueFunctions()`. |
| `src/components/HookInlineForm.tsx` | Main form component. Orchestrates react-hook-form, auto-save, expand/collapse, confirm modal. |
| `src/components/HookRenderField.tsx` | Per-field rendering. Looks up component by string key from injection context. |
| `src/providers/BusinessRulesProvider.tsx` | React context provider owning business rules state via useReducer. |
| `src/providers/InjectedHookFieldProvider.tsx` | React context provider for component injection registry. |
| `src/reducers/BusinessRulesReducer.ts` | Reducer for business rules state mutations. |
| `src/types/IFieldConfig.ts` | Primary consumer-facing type. Defines field configuration shape. |
| `src/types/IHookFieldSharedProps.ts` | Props contract that all injected field components receive. |
| `src/utils/index.ts` | Local utilities: `isEmpty`, `isNull`, `deepCopy`, `Dictionary<T>`, `IEntityData`. |

## Known Issues

- `isReadonly` vs `readOnly` naming inconsistency in `IFieldConfig` (TODO comment exists)
- `CombineBusinessRules` mutates its first argument in place
- No memoization on provider context values
- Hardcoded English strings in `strings.ts` (no i18n)
