# AGENTS.md -- @bghcore/dynamic-forms-fluent

## Package Purpose

Fluent UI v9 field component implementations for `@bghcore/dynamic-forms-core`. Provides 13 editable and 6 read-only field types plus a one-line registry setup.

## Critical Constraints

- **Fluent UI v9 only.** Use `@fluentui/react-components` and `@fluentui/react-icons`. Do not import from `@fluentui/react` (v8).
- **All field components receive `IHookFieldSharedProps<T>`** via `React.cloneElement` -- this is the contract with core's `HookRenderField`.
- **Import core types from `@bghcore/dynamic-forms-core`**, not from relative paths into the core package.
- **Use `React.JSX.Element`** not bare `JSX.Element` for return types.

## Key Files

| File | Purpose |
|------|---------|
| `src/registry.ts` | `createFluentFieldRegistry()` -- maps `ComponentTypes` string keys to Fluent field JSX elements. |
| `src/helpers.ts` | Shared field helpers: `FieldClassName`, `GetFieldDataTestId`, dropdown rendering, `formatDateTime`. |
| `src/fields/` | 13 editable field components (HookTextbox, HookDropdown, HookToggle, etc.) |
| `src/fields/readonly/` | 6 read-only field variants (HookReadOnly, HookReadOnlyArray, etc.) |
| `src/components/ReadOnlyText.tsx` | Shared read-only text display component. |
| `src/components/StatusMessage.tsx` | Error/warning/saving status display. |
| `src/components/HookFormLoading.tsx` | Shimmer loading state. |
| `src/components/StatusDropdown/` | Status dropdown with color indicators. |
| `src/components/DocumentLinks/` | URL link CRUD component. |

## Adding a New Field

1. Create `src/fields/HookMyField.tsx` implementing `IHookFieldSharedProps<T>`
2. Add `export { default as HookMyField } from "./fields/HookMyField"` to `src/index.ts`
3. Add the component key to `ComponentTypes` in core's `constants.ts`
4. Register it in `src/registry.ts` inside `createFluentFieldRegistry()`

## Field Component Pattern

```tsx
import { IHookFieldSharedProps } from "@bghcore/dynamic-forms-core";
import { Input } from "@fluentui/react-components";

const HookMyField = (props: IHookFieldSharedProps<{}>) => {
  const { fieldName, value, readOnly, error, setFieldValue } = props;
  return (
    <Input
      value={(value as string) ?? ""}
      disabled={readOnly}
      onChange={(e, data) => setFieldValue?.(fieldName ?? "", data.value, false, 3000)}
    />
  );
};

export default HookMyField;
```
