# Dynamic React Business Forms

A React library for rendering complex, configuration-driven forms with a built-in business rules engine. Define your forms as JSON configurations -- field definitions, dependency rules, dropdown options, ordering -- and the library handles rendering, validation, auto-save, and field interactions automatically.

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@bghcore/dynamic-forms-core`](./packages/core) | Business rules engine, form orchestration, providers, types. Framework-agnostic (React + react-hook-form only). | ~67 KB ESM |
| [`@bghcore/dynamic-forms-fluent`](./packages/fluent) | Fluent UI v9 field components. One of potentially many UI adapter packages. | ~40 KB ESM |

## Quick Start

```bash
npm install @bghcore/dynamic-forms-core @bghcore/dynamic-forms-fluent
```

```tsx
import {
  BusinessRulesProvider,
  InjectedHookFieldProvider,
  UseInjectedHookFieldContext,
  HookInlineForm,
} from "@bghcore/dynamic-forms-core";
import { createFluentFieldRegistry } from "@bghcore/dynamic-forms-fluent";
import { useEffect } from "react";

// Register Fluent UI fields
function FieldRegistrar({ children }: { children: React.ReactNode }) {
  const { setInjectedFields } = UseInjectedHookFieldContext();
  useEffect(() => {
    setInjectedFields(createFluentFieldRegistry());
  }, []);
  return <>{children}</>;
}

function App() {
  const fieldConfigs = {
    name: { component: "Textbox", label: "Name", required: true },
    status: {
      component: "Dropdown",
      label: "Status",
      dropdownOptions: [
        { key: "Active", text: "Active" },
        { key: "Inactive", text: "Inactive" },
      ],
    },
    notes: { component: "Textarea", label: "Notes" },
  };

  const defaultValues = { name: "", status: "Active", notes: "" };

  return (
    <BusinessRulesProvider>
      <InjectedHookFieldProvider>
        <FieldRegistrar>
          <HookInlineForm
            configName="myForm"
            programName="myApp"
            fieldConfigs={fieldConfigs}
            defaultValues={defaultValues}
            saveData={async (data) => {
              console.log("Saving:", data);
              return data;
            }}
          />
        </FieldRegistrar>
      </InjectedHookFieldProvider>
    </BusinessRulesProvider>
  );
}
```

## How It Works

### Configuration-Driven Forms

Every form is defined by a dictionary of `IFieldConfig` objects. Each config specifies:

- **`component`** -- Which field type to render (`"Textbox"`, `"Dropdown"`, `"Toggle"`, etc.)
- **`label`** -- Display label
- **`required`** / **`hidden`** / **`readOnly`** -- Default field states
- **`dependencies`** -- Business rules that change other fields based on this field's value
- **`dependencyRules`** -- AND-condition rules across multiple fields
- **`dropdownDependencies`** -- Dropdown options that change based on other fields
- **`orderDependencies`** -- Dynamic field ordering rules
- **`validations`** -- Validation function names from the registry
- **`value`** + **`isValueFunction`** -- Computed values on create/change

### Business Rules Engine

Rules are **declarative** -- defined as data, not imperative code. When a field value changes, the engine:

1. Reverts previously applied rules on dependent fields
2. Re-evaluates which rules match the new value
3. Applies new rules (required, hidden, readOnly, component swap, validations, etc.)
4. Processes combo (AND) rules across multiple fields
5. Updates dropdown options based on dependency rules
6. Reorders fields if order dependencies are defined

```tsx
const fieldConfigs = {
  type: {
    component: "Dropdown",
    label: "Type",
    dropdownOptions: [
      { key: "bug", text: "Bug" },
      { key: "feature", text: "Feature" },
    ],
    // When type="bug", make severity required and visible
    dependencies: {
      bug: {
        severity: { required: true, hidden: false },
      },
      feature: {
        severity: { hidden: true },
      },
    },
  },
  severity: {
    component: "Dropdown",
    label: "Severity",
    hidden: true, // hidden by default, shown by business rule
    dropdownOptions: [
      { key: "low", text: "Low" },
      { key: "high", text: "High" },
    ],
  },
};
```

### Component Injection

The library uses a component injection system for field rendering. Core provides the orchestration, and UI packages provide the field implementations:

```tsx
// Use built-in Fluent UI fields
import { createFluentFieldRegistry } from "@bghcore/dynamic-forms-fluent";
setInjectedFields(createFluentFieldRegistry());

// Or mix in custom fields
setInjectedFields({
  ...createFluentFieldRegistry(),
  MyCustomField: <MyCustomField />,
});
```

Custom fields receive `IHookFieldSharedProps<T>` via `React.cloneElement`:

```tsx
interface IHookFieldSharedProps<T> {
  fieldName?: string;
  value?: unknown;
  readOnly?: boolean;
  required?: boolean;
  error?: FieldError;
  dropdownOptions?: IDropdownOption[];
  setFieldValue?: (fieldName: string, value: unknown, skipSave?: boolean, timeout?: number) => void;
  meta?: T; // custom metadata from IFieldConfig.meta
  // ... and more
}
```

### Pluggable Validation & Value Functions

Register custom validators and value functions:

```tsx
import { registerValidations, registerValueFunctions } from "@bghcore/dynamic-forms-core";

registerValidations({
  myCustomValidation: (value) => {
    if (typeof value === "string" && value.length > 100) {
      return "Must be 100 characters or less";
    }
    return undefined; // valid
  },
});

registerValueFunctions({
  setCurrentTimestamp: () => new Date().toISOString(),
  computeTotal: ({ fieldName, parentEntity }) => {
    return (parentEntity?.subtotal ?? 0) + (parentEntity?.tax ?? 0);
  },
});
```

Then reference them by name in field configs:

```tsx
const fieldConfigs = {
  description: {
    component: "Textarea",
    label: "Description",
    validations: ["myCustomValidation"],
  },
  createdAt: {
    component: "ReadOnly",
    label: "Created",
    value: "setCurrentTimestamp",
    isValueFunction: true,
    onlyOnCreate: true,
  },
};
```

## Available Field Types

### Editable Fields (from `@bghcore/dynamic-forms-fluent`)

| Component Key | Component | Description |
|---------------|-----------|-------------|
| `Textbox` | `HookTextbox` | Single-line text input |
| `Number` | `HookNumber` | Numeric input with validation |
| `Toggle` | `HookToggle` | Boolean toggle switch |
| `Dropdown` | `HookDropdown` | Single-select dropdown |
| `Multiselect` | `HookMultiSelect` | Multi-select dropdown |
| `DateControl` | `HookDateControl` | Date picker with clear button |
| `Slider` | `HookSlider` | Numeric slider |
| `SimpleDropdown` | `HookSimpleDropdown` | Dropdown from string array in meta |
| `MultiSelectSearch` | `HookMultiSelectSearch` | Searchable multi-select (ComboBox) |
| `Textarea` | `HookPopOutEditor` | Multiline text with expand-to-modal |
| `DocumentLinks` | `HookDocumentLinks` | URL link CRUD |
| `StatusDropdown` | `HookStatusDropdown` | Dropdown with color status indicator |
| `DynamicFragment` | `HookFragment` | Hidden field (form state only) |

### Read-Only Fields

| Component Key | Component | Description |
|---------------|-----------|-------------|
| `ReadOnly` | `HookReadOnly` | Plain text display |
| `ReadOnlyArray` | `HookReadOnlyArray` | Array of strings |
| `ReadOnlyDateTime` | `HookReadOnlyDateTime` | Formatted date/time |
| `ReadOnlyCumulativeNumber` | `HookReadOnlyCumulativeNumber` | Computed sum of other fields |
| `ReadOnlyRichText` | `HookReadOnlyRichText` | Rendered HTML |
| `ReadOnlyWithButton` | `HookReadOnlyWithButton` | Text with action button |

## Architecture

```
<BusinessRulesProvider>          -- Owns rule state via useReducer
  <InjectedHookFieldProvider>    -- Component injection registry
    <HookInlineForm>             -- Form state (react-hook-form), auto-save, business rules
      <HookInlineFormFields>     -- Renders ordered field list
        <HookRenderField>        -- Per-field: Controller + component lookup
          <HookFieldWrapper>     -- Label, error, saving status
            <InjectedField />    -- Your UI component via cloneElement
```

## Render Props for Customization

`HookInlineForm` accepts render props to customize UI elements without depending on any specific component library:

```tsx
<HookInlineForm
  // ... required props
  renderExpandButton={({ isExpanded, onToggle }) => (
    <button onClick={onToggle}>{isExpanded ? "Show Less" : "Show More"}</button>
  )}
  renderFilterInput={({ onChange }) => (
    <input placeholder="Search..." onChange={(e) => onChange(e.target.value)} />
  )}
  renderDialog={({ isOpen, onSave, onCancel, children }) => (
    <MyDialog open={isOpen} onConfirm={onSave} onDismiss={onCancel}>
      {children}
    </MyDialog>
  )}
  onSaveError={(error) => toast.error(error)}
/>
```

## Building a Custom UI Adapter

To create fields for a different UI library (e.g., Material UI, Ant Design):

1. Create field components that accept `IHookFieldSharedProps<T>`
2. Build a registry mapping component keys to your field elements
3. Pass the registry to `InjectedHookFieldProvider` via `setInjectedFields()`

```tsx
import { IHookFieldSharedProps, ComponentTypes } from "@bghcore/dynamic-forms-core";

const MaterialTextbox = (props: IHookFieldSharedProps<{}>) => {
  const { fieldName, value, readOnly, error, setFieldValue } = props;
  return (
    <TextField
      value={value as string}
      disabled={readOnly}
      error={!!error}
      helperText={error?.message}
      onChange={(e) => setFieldValue(fieldName, e.target.value, false, 3000)}
    />
  );
};

const materialFields = {
  [ComponentTypes.Textbox]: <MaterialTextbox />,
  // ... other fields
};

setInjectedFields(materialFields);
```

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:fluent

# Clean build output
npm run clean
```

## Project Structure

```
packages/
  core/     -- @bghcore/dynamic-forms-core (React + react-hook-form only)
  fluent/   -- @bghcore/dynamic-forms-fluent (Fluent UI v9 adapter)
```

## License

MIT
