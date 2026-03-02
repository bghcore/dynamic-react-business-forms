# Roadmap to 1.0 Release

## Current State Assessment

### What This Library Is

A **configuration-driven React form library** with a built-in business rules engine. You define forms as JSON configs specifying fields, their types, dependencies between fields, dropdown filtering rules, field ordering rules, and combo (AND) conditions. The library handles:

- Rendering the correct component for each field type
- Evaluating business rules when field values change (show/hide, required, readonly, component swap, validation changes, dropdown filtering, field reordering)
- Auto-save with debounce and manual save modes
- Expand/collapse for long forms
- Confirmation modals for sensitive field changes
- A component injection system that lets consumers override any field renderer

### What's Good

1. **Strong architectural foundation**: The config-driven approach with declarative business rules is the right design for complex enterprise forms. Rules-as-data is more maintainable than imperative rule code.

2. **Comprehensive business rules engine**: Supports 10+ rule types including cascading dependencies, combo (AND) rules, dropdown filtering, dynamic field ordering, and computed values. The revert-then-reapply pattern correctly handles value changes.

3. **Component injection system**: `InjectedHookFieldProvider` gives consumers full control over field rendering. Any field type can be overridden or extended without forking the library.

4. **Solid field catalog**: 34 field types covering text, number, toggle, dropdown, multi-select, date, slider, rich text, people picker, status dropdown, document links, and 12 read-only variants.

5. **react-hook-form integration**: Built on a proven form library with proper `Controller` integration, validation, and form state management.

6. **Multi-form support**: The `configName` keying in the business rules state allows multiple independent forms in the same provider tree.

7. **Pure helper functions**: Business rules evaluation logic is in pure functions (`BusinessRulesHelper.ts`), separated from React state, making it testable.

8. **Low `any` usage**: Only 3 instances in the entire codebase. TypeScript strict mode is enabled.

### What's Bad

1. **Cannot build**: ~30+ files import from outside `src/` via `../../` relative paths referencing the original monorepo. The library will not compile as a standalone package.

2. **Undeclared dependencies**: 9+ external packages used in the code are not listed in `package.json` (`@cxpui/common`, `@cxpui/commoncontrols`, `@elixir/components`, etc.).

3. **Domain-specific code baked in**: ~14 of 34 field types are Microsoft/Azure/ADO/CXP-specific. Domain logic (ADO work items, Azure product taxonomies, ICM links, CXP auth) is mixed throughout.

4. **`Helpers.tsx` is a junk drawer**: Mixes API calls, JSX rendering, domain logic, and utility functions in one 300+ line file.

5. **No tests**: Zero test files exist.

6. **No extensibility for validations/value functions**: Both use hardcoded `switch/case` statements. Adding new validations requires modifying library source.

7. **Performance concerns**: `DeepCopy` on every reducer dispatch, no memoization on context values, no `useMemo`/`useCallback` on provider values.

8. **SCSS is broken**: Uses 8 undefined variables and 2 undefined `@extend` mixins from the parent project.

9. **Incomplete rollup config**: Only `react` and `react-dom` externalized. Missing plugins (`node-resolve`, `commonjs`). No sourcemaps. No SCSS handling.

10. **Hardcoded English strings**: No i18n support.

---

## Phase 1: Make It Build (P0 -- Must Fix)

**Goal**: Get `npm run build` to succeed and produce valid output.

### 1.1 Resolve Broken Relative Imports

Every `../../` import must be resolved. Strategy per import category:

| Import Category | Files Affected | Resolution Strategy |
|---|---|---|
| `@cxpui/common` utilities (Dictionary, isEmpty, isNull, DeepCopy, etc.) | 28+ files | Replace with local implementations or standard TS equivalents. `Dictionary<T>` -> `Record<string, T>`. `isEmpty`/`isNull` -> simple inline checks. `DeepCopy` -> `structuredClone()` or a small utility. |
| `@cxpui/commoncontrols` (Person, CxpAuthContext, ComponentTypes, UseEntitiesState) | 15+ files | Abstract behind interfaces. Create `IAuthProvider`, `IPersonResolver`, `IEntityStore` interfaces. Consumers provide implementations. |
| `@cxpui/service` / `@cxpui/generalapi` (ADO APIs, taxonomy, regions, people search) | 6 files | Move these field components to an extensions package or make the API calls injectable via props/context. |
| `@elixir/components` (ElxDialog, ElxPanel, ElxDropdown, ElxTable) | 8 files | Replace with Fluent UI equivalents (`Dialog`, `Panel`, `Dropdown`, `DetailsList`) or make the wrapper components pluggable. |
| `@elixir/fx` (ElxRichTextEditor, ElxHtml) | 2 files | Abstract behind an `IRichTextEditor` interface prop. |
| `../../DynamicLayout/*` | 6 files | Extract the needed types/enums locally. Entity CRUD and config loading should become injectable via props. |
| `../../Models/*` | 6 files | Copy or redefine the needed interfaces locally (IAzureService, IHookPerson, IBlockStatusChange, Phase, DocumentLink, etc.). |
| `../../DataModelsSchema/*` | 3 files | Copy `IPropertySchema`, `SingleTypes`, `Types` locally. |
| `../../Auth/AuthProvider` | 1 file | Abstract behind `IAuthProvider` interface. |
| `../../Strings/*`, `../../Constants/*` | 3 files | Move needed strings/constants into local `Strings.ts`/`Constants.ts`. |
| `../../Hooks/*` | 2 files | Copy `UseEntityDisabled` locally or make it injectable. |
| `../../DropdownPanel/*` | 2 files | Copy `IDropdownItem`, `IHierarchicalOption` interfaces locally. |
| `../../ElxToastNotification/*` | 1 file | Abstract behind `INotificationProvider` interface. |
| `../../Components/Readonly/Label` | 1 file | Create a simple local `Label` component. |
| Other one-off imports | 4 files | Copy types locally or abstract behind interfaces. |

### 1.2 Fix package.json Dependencies

```jsonc
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@fluentui/react": "^8.0.0",
    "react-hook-form": "^7.0.0",        // move from dependencies
    "react-error-boundary": "^4.0.0"     // add
  },
  "devDependencies": {
    // add:
    "@rollup/plugin-node-resolve": "...",
    "@rollup/plugin-commonjs": "...",
    "rollup-plugin-postcss": "...",       // if keeping SCSS
    "jest-environment-jsdom": "..."
  }
}
```

### 1.3 Fix Rollup Config

```javascript
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.cjs.js", format: "cjs", sourcemap: true },
      { file: "dist/index.esm.js", format: "esm", sourcemap: true },
    ],
    plugins: [resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" })],
    external: (id) =>
      /^(react|react-dom|@fluentui|react-hook-form|react-error-boundary)/.test(id),
  },
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
  },
];
```

### 1.4 Add Missing package.json Fields

```jsonc
{
  "version": "0.1.0",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### 1.5 Handle SCSS

**Recommended approach**: Remove the SCSS file for now. The styles reference 8 undefined variables and 2 undefined mixins from the parent project. Options:
- (a) Delete `src/Content/HookInlineForm.scss` entirely -- consumers provide their own styles
- (b) Convert to CSS-in-JS or inline styles
- (c) Fix the SCSS with local variable definitions and add `rollup-plugin-postcss`

---

## Phase 2: Decouple Domain Logic (P0-P1)

**Goal**: Separate generic form library from Microsoft/Azure/CXP-specific code.

### 2.1 Split Field Components

**Core fields** (keep in main package -- depend only on React + Fluent UI + react-hook-form):
- HookTextbox, HookNumber, HookToggle, HookDropdown, HookMultiSelect, HookDateControl, HookSlider, HookSimpleDropdown, HookFragment, HookMultiSelectSearch, HookPopOutEditor (needs @elixir/fx decoupled), HookDocumentLinks, HookStatusDropdown
- HookReadOnly, HookReadOnlyArray, HookReadOnlyDateTime, HookReadOnlyCumulativeNumber, HookReadOnlyWithButton, HookReadOnlyRichText, HookReadOnlyArrayFieldAsTable

**Extension fields** (move to separate package or make fully injectable):
- HookPeoplePicker, HookPeoplePickerList (AAD-specific)
- HookADOWorkItem, HookADOTemplates (Azure DevOps-specific)
- HookChildEntitySearch, HookSubscriptionsTextArea (CPJ entity model-specific)
- HookDataCenterRegion, HookProductTaxonomy (Azure-specific)
- HookStatusReasonDescription (CXP auth-specific)
- HookReadOnlyACRImpactFields, HookCustomerNameField, HookMSXViewLink, HookReadOnlyListTable (domain model-specific)
- HookReadOnlyPerson (Microsoft persona-specific)

### 2.2 Abstract External Dependencies Behind Interfaces

Create injectable interfaces for:

```typescript
// Auth
interface IAuthProvider {
  getCurrentUserUpn(): string;
}

// People resolution
interface IPeopleResolver {
  searchPeople(query: string): Promise<IPerson[]>;
  getUserDetails(upn: string): Promise<IPerson>;
}

// Notifications
interface INotificationProvider {
  showNotification(message: string, type: 'success' | 'error' | 'warning'): void;
}

// Entity data access (replaces DynamicLayout coupling)
interface IEntityDataProvider {
  getEntity(entityType: string, entityId: string): Promise<Record<string, unknown>>;
  saveEntity(entityType: string, entityId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  createEntity(entityType: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// Config loading (replaces DynamicLayout config dispatch)
interface IFormConfigProvider {
  getFieldConfigs(configName: string): Promise<Record<string, IFieldConfig>>;
}
```

### 2.3 Clean Up Helpers.tsx

Split into focused modules:
- `src/Helpers/PeoplePickerHelper.ts` -- people resolution functions (move to extensions)
- `src/Helpers/DropdownHelper.ts` -- dropdown rendering utilities
- `src/Helpers/SaveHelper.ts` -- custom save functions (make injectable)
- Remove domain-specific functions (ADO, product taxonomy) to extensions

---

## Phase 3: Improve Developer Experience (P1)

### 3.1 Unified Provider

Create a single `<DynamicFormsProvider>` that wraps all three context providers:

```tsx
<DynamicFormsProvider
  fields={fieldRegistry}
  auth={authProvider}           // optional
  notifications={notifier}      // optional
>
  <HookFormBoundary ... />
</DynamicFormsProvider>
```

### 3.2 Field Registration API

Replace pre-instantiated JSX dictionary with component references:

```typescript
// Before (current)
const hookFields = { "Textbox": <HookTextbox /> };

// After
import { createFieldRegistry, coreFields } from "@brhanso/dynamic-business-forms";

const registry = createFieldRegistry({
  ...coreFields,
  "CustomField": MyCustomField,
});
```

### 3.3 Pluggable Validation & Value Functions

Replace hardcoded switch/case with a registry:

```typescript
const validationRegistry = {
  isValidUrl: (value: string) => /^https?:\/\//.test(value),
  isRequired: (value: unknown) => value != null && value !== "",
  // consumers add their own...
};

const valueFunctionRegistry = {
  setDate: () => new Date().toISOString(),
  setLoggedInUser: (ctx) => ctx.auth.getCurrentUserUpn(),
  // consumers add their own...
};
```

### 3.4 Fix Type Issues

- Consolidate `isReadonly` -> `readOnly` in IFieldConfig
- Replace `Dictionary` imports with `Record<string, T>`
- Fix shadowed generic `T` in `IHookFieldSharedProps.setFieldValue`
- Tighten `meta` typing (remove `object`)
- Convert `initPanel()` 9 positional params to options object

### 3.5 Performance Improvements

- Replace `DeepCopy` in reducer with `structuredClone()` or Immer
- Memoize provider context values with `useMemo`
- Add `useCallback` for `initBusinessRules` and `processBusinessRule`
- Consider splitting business rules context (state vs. dispatch) to reduce re-renders

---

## Phase 4: Quality & Polish (P2)

### 4.1 Testing

- Unit tests for `BusinessRulesHelper.ts` (pure functions, high value)
- Unit tests for `HookInlineFormHelper.ts` (validation, value functions, schema merging)
- Component tests for `HookInlineForm` with `@testing-library/react`
- Component tests for individual field types
- Integration tests for business rules cascading

### 4.2 Documentation

- README.md with quick start, API reference, and examples
- Field type catalog with screenshots/descriptions
- Business rules configuration guide with examples
- Migration guide for consumers of the original monorepo code

### 4.3 Tooling

- Storybook for field component development and documentation
- CI/CD pipeline (build, lint, test, publish)
- `prepublishOnly` script: `npm run lint && npm run test && npm run build`
- CHANGELOG.md
- LICENSE file

### 4.4 Remaining Cleanup

- Remove hardcoded ICM link from error boundary
- Localization support (string externalization)
- Fix `HookRenderField` storing JSX in state (compute inline instead)
- Add proper error messages for missing configs/fields
- Add `forceConsistentCasingInFileNames: true` to tsconfig.json

---

## Suggested Milestone Plan

| Milestone | Scope | Deliverable |
|---|---|---|
| **0.1.0** | Phase 1 complete | Library builds. All `../../` imports resolved. Rollup config fixed. Dependencies declared. |
| **0.2.0** | Phase 2 complete | Domain-specific code separated. Core fields work with only React + Fluent UI + react-hook-form. Injectable interfaces for auth, entities, notifications. |
| **0.3.0** | Phase 3 complete | Unified provider. Field registration API. Pluggable validations/value functions. Type fixes. Performance improvements. |
| **0.4.0** | Phase 4 testing | Unit tests for helpers. Component tests for core fields. Integration tests for business rules. |
| **1.0.0** | Phase 4 complete | Full documentation. Storybook. CI/CD. README. Migration guide. |

---

## Full List of Broken Imports (Phase 1 Reference)

| File | Broken Import | What It Needs |
|---|---|---|
| `Helpers.tsx` | `../../Models/IAzureService` | Interface definition |
| `Helpers.tsx` | `../../Models/IHookPerson` | Interface definition |
| `Helpers.tsx` | `../../Models/IBlockStatusChange` | Interface definition |
| `Helpers.tsx` | `../../Models/Phase` | Enum definition |
| `Helpers.tsx` | `../../Strings/CPJStrings` | String constants |
| `Components/HookFieldWrapper.tsx` | `../../Components/Readonly/Label` | Label component |
| `Components/HookFieldWrapper.tsx` | `../../DynamicLayout/Models/Enums` | ComponentTypes enum |
| `Components/DocumentLinks/DocumentLink.tsx` | `../../../../Models/DocumentLink` | Interface definition |
| `Components/DocumentLinks/DocumentLink.tsx` | `../../../../Models/IHookDocumentLink` | Interface definition |
| `Components/DocumentLinks/DocumentLink.tsx` | `../../../../Strings/CPJStrings` | String constants |
| `Components/DocumentLinks/DocumentLinks.tsx` | `../../../../Models/DocumentLink` | Interface/class definition |
| `Components/DocumentLinks/DocumentLinks.tsx` | `../../../../Strings/CPJStrings` | String constants |
| `Components/HookFormPanel.tsx` | `../../DynamicLayout` | Config dispatch, entity state |
| `Components/HookFormPanel.tsx` | `../../DynamicLayout/Models/Enums` | ApiActions enum |
| `Components/HookFormPanel.tsx` | `../../DynamicLayout/Models/IDynamicModals` | Panel props interface |
| `Components/HookInlineForm.tsx` | `../../Auth/AuthProvider` | CxpAuthContext |
| `Components/HookInlineForm.tsx` | `../../DynamicLayout/Models/Enums` | ApiActions enum |
| `Components/HookInlineForm.tsx` | `../../ElxToastNotification/ElxToastNotificationProvider` | Notification dispatch |
| `Components/HookInlineFormWrapper.tsx` | `../../DataModelsSchema/Models/DataModelsSchema` | IPropertySchema |
| `Components/HookInlineFormWrapper.tsx` | `../../DynamicLayout` | Entity/config dispatches |
| `Components/HookInlineFormWrapper.tsx` | `../../DynamicLayout/Providers/DynamicLayoutProvider` | Layout state |
| `Components/HookInlineFormWrapper.tsx` | `../../Hooks/ShalowEqualSelector` | Redux selector |
| `Components/HookInlineFormWrapper.tsx` | `../../Shared/Store/IStateStore` | Redux store type |
| `Components/HookRenderField.tsx` | `../../DynamicLayout` | ChangedEntityType, entity state |
| `Components/HookRenderField.tsx` | `../../DynamicLayout/Models/Enums` | ComponentTypes enum |
| `Components/HookRenderField.tsx` | `../../Hooks/UseEntityDisabled` | Entity disabled hook |
| `Components/PeoplePicker.tsx` | `../../../Models/IHookPerson` | Interface definition |
| `Components/PeoplePickerList.tsx` | `../../../Models/IHookPerson` | Interface definition |
| `Components/ProductTaxonomy.tsx` | `../../../Models/IAzureService` | Interface definition |
| `Components/StatusDropdown/StatusDropdown.tsx` | `../../../../Models/IBlockStatusChange` | Interface definition |
| `Fields/HookChildEntitySearch.tsx` | `../../../Constants/CPJConstants` | Constants |
| `Fields/HookChildEntitySearch.tsx` | `../../../Models/CPJSchemaEntity` | Schema entity enum |
| `Fields/HookDocumentLinks.tsx` | `../../../Models/DocumentLink` | Interface definition |
| `Fields/HookPeoplePicker.tsx` | `../../../Models/IHookPerson` | Interface definition |
| `Fields/HookPeoplePickerList.tsx` | `../../../Models/IHookPerson` | Interface definition |
| `Fields/HookPopOutEditor.tsx` | `../../../Helpers/RichTextEditorPuginFocus` | Rich text plugin helper |
| `Fields/HookPopOutEditor.tsx` | `../../../Strings/CPJStrings` | String constants |
| `Fields/HookStatusDropdown.tsx` | `../../../Models/IBlockStatusChange` | Interface definition |
| `Fields/HookSubscriptionsTextArea.tsx` | `../../../Helpers/SharedHelper` | Utility functions |
| `Fields/HookSubscriptionsTextArea.tsx` | `../../../Models/CPJSchemaEntity` | Schema entity enum |
| `Fields/HookSubscriptionsTextArea.tsx` | `../../../Models/ISubscriptionInfo` | Interface definition |
| `Fields/HookSubscriptionsTextArea.tsx` | `../../Subscriptions/AddSubscriptions` | Component |
| `Fields/ReadOnly/HookReadOnlyACRImpactFields.tsx` | `../../../../Strings/ACXNominationStrings` | String constants |
| `Fields/ReadOnly/HookCustomerNameField.tsx` | `../../../VerifyCustomer/VerifyCustomerIcon` | Component |
| `Helpers/BusinessRulesHelper.ts` | `../../DynamicLayout` | GetFieldDataType |
| `Helpers/BusinessRulesHelper.ts` | `../../Constants` | Constants |
| `Helpers/FieldHelper.ts` | `../../DropdownPanel/Components/OptionListWithSearch` | IHierarchicalOption |
| `Helpers/FieldHelper.ts` | `../../DropdownPanel/Interfaces/IDropdownItem` | IDropdownItem |
| `Helpers/HookInlineFormHelper.ts` | `../../DataModelsSchema/Models/DataModelsSchema` | Types, IPropertySchema |
| `Helpers/HookInlineFormHelper.ts` | `../../DropdownPanel/Interfaces/IDropdownItem` | IDropdownItem |
| `Helpers/HookInlineFormHelper.ts` | `../../DynamicLayout/Helpers/DynamicValidationHelper` | Validation functions |
| `Interfaces/IBusinessRule.ts` | `../../DataModelsSchema/Models/DataModelsSchema` | SingleTypes |
| `Interfaces/IHookFormPanelActionProps.ts` | `../../DynamicLayout/Models/IDynamicModals` | IApiActionProps |
