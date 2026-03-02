# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **`@bghcore/dynamic-forms-core`** -- Framework-agnostic business rules engine
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
