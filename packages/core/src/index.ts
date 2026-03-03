// Types
export * from "./types";

// Utils
export * from "./utils";

// Constants
export { HookInlineFormConstants, ComponentTypes, FIELD_PARENT_PREFIX } from "./constants";

// Strings
export { HookInlineFormStrings } from "./strings";

// Providers
export { BusinessRulesProvider, UseBusinessRulesContext } from "./providers/BusinessRulesProvider";
export { InjectedHookFieldProvider, UseInjectedHookFieldContext } from "./providers/InjectedHookFieldProvider";
export type { IBusinessRulesProvider } from "./providers/IBusinessRulesProvider";
export type { IInjectedHookFieldProvider } from "./providers/IInjectedHookFieldProvider";

// Helpers
export {
  ProcessAllBusinessRules,
  ProcessFieldBusinessRule,
  ProcessFieldOrderDepencendies,
  ProcessPreviousFieldBusinessRule,
  RevertFieldBusinessRule,
  ProcessComboFieldBusinessRule,
  ProcessDropdownOptions,
  ProcessFieldDropdownValues,
  CombineBusinessRules,
  GetFieldValue,
  SameFieldOrder,
  GetDefaultBusinessRules,
  normalizeFieldConfig,
} from "./helpers/BusinessRulesHelper";

export {
  GetChildEntity,
  IsExpandVisible,
  GetConfirmInputModalProps,
  GetValueFunctionsOnDirtyFields,
  GetValueFunctionsOnCreate,
  ExecuteValueFunction,
  CheckFieldValidationRules,
  CheckAsyncFieldValidationRules,
  CheckValidDropdownOptions,
  CheckDeprecatedDropdownOptions,
  CheckDefaultValues,
  CheckIsDeprecated,
  InitOnCreateBusinessRules,
  InitOnEditBusinessRules,
  ShowField,
  CombineSchemaConfig,
  GetFieldsToRender,
  CheckCrossFieldValidationRules,
} from "./helpers/HookInlineFormHelper";

export { SortDropdownOptions } from "./helpers/FieldHelper";

export {
  detectDependencyCycles,
  detectOrderDependencyCycles,
  validateDependencyGraph,
} from "./helpers/DependencyGraphValidator";
export type { ICycleError } from "./helpers/DependencyGraphValidator";

export {
  registerValidations,
  getValidation,
  getValidationRegistry,
  registerAsyncValidations,
  getAsyncValidation,
  getAsyncValidationRegistry,
  createMinLengthValidation,
  createMaxLengthValidation,
  createNumericRangeValidation,
  createPatternValidation,
  createRequiredIfValidation,
  registerCrossFieldValidations,
  getCrossFieldValidation,
} from "./helpers/ValidationRegistry";
export type { ValidationFunction, AsyncValidationFunction, CrossFieldValidationFunction } from "./helpers/ValidationRegistry";

export { registerValueFunctions, getValueFunction, executeValueFunction } from "./helpers/ValueFunctionRegistry";
export type { ValueFunction } from "./helpers/ValueFunctionRegistry";

export { validateFieldConfigs } from "./helpers/ConfigValidator";
export type { IConfigValidationError } from "./helpers/ConfigValidator";

// Locale
export {
  registerLocale,
  getLocaleString,
  resetLocale,
  getCurrentLocale,
} from "./helpers/LocaleRegistry";

// Wizard
export { HookWizardForm } from "./components/HookWizardForm";
export type { IWizardNavigationProps, IWizardStepHeaderProps, IHookWizardFormProps } from "./components/HookWizardForm";
export { getVisibleSteps, getStepFields, getStepFieldOrder, validateStepFields, isStepValid, getStepIndex } from "./helpers/WizardHelper";

// Field Array
export { HookFieldArray } from "./components/HookFieldArray";
export type { IHookFieldArrayProps } from "./components/HookFieldArray";

// Components
export { HookInlineForm } from "./components/HookInlineForm";
export { HookInlineFormFields } from "./components/HookInlineFormFields";
export { HookFieldWrapper } from "./components/HookFieldWrapper";
export { default as HookRenderField } from "./components/HookRenderField";
export { default as HookConfirmInputsModal } from "./components/HookConfirmInputsModal";
export { HookFormErrorBoundary } from "./components/HookFormErrorBoundary";

// DevTools
export { HookFormDevTools } from "./components/HookFormDevTools";
export type { IHookFormDevToolsProps } from "./components/HookFormDevTools";

// Schema Import
export { jsonSchemaToFieldConfig } from "./utils/jsonSchemaImport";
export type { IJsonSchema, IJsonSchemaProperty } from "./utils/jsonSchemaImport";

// Lazy Field Registry
export { createLazyFieldRegistry } from "./utils/lazyFieldRegistry";

// Hooks
export { useDraftPersistence } from "./hooks/useDraftPersistence";
export type { IDraftPersistenceOptions, IDraftState, IUseDraftPersistenceResult } from "./hooks/useDraftPersistence";
export { useBeforeUnload } from "./hooks/useBeforeUnload";

// Form State Serialization
export { serializeFormState, deserializeFormState } from "./utils/formStateSerialization";

// Expression Engine
export { evaluateExpression, extractExpressionDependencies } from "./helpers/ExpressionEngine";

// Rule Tracing / Debugging
export {
  enableRuleTracing,
  disableRuleTracing,
  traceRuleEvent,
  getRuleTraceLog,
  clearRuleTraceLog,
  isRuleTracingEnabled,
} from "./helpers/RuleTracer";
export type { IRuleTraceEvent } from "./helpers/RuleTracer";
