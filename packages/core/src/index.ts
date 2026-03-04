// Types
export * from "./types";

// Utils
export * from "./utils";

// Constants
export { ComponentTypes, FormConstants, FIELD_PARENT_PREFIX } from "./constants";

// Strings
export { FormStrings } from "./strings";

// Providers
export {
  RulesEngineProvider,
  UseRulesEngineContext,
} from "./providers/BusinessRulesProvider";
export {
  InjectedFieldProvider,
  UseInjectedFieldContext,
} from "./providers/InjectedHookFieldProvider";
export type { IRulesEngineProvider } from "./providers/IBusinessRulesProvider";
export type { IInjectedFieldProvider } from "./providers/IInjectedHookFieldProvider";

// Rule Engine
export {
  evaluateAllRules,
  evaluateAffectedFields,
  buildDependencyGraph,
  buildDefaultFieldStates,
  topologicalSort,
} from "./helpers/RuleEngine";

// Condition Evaluator
export {
  evaluateCondition,
  extractConditionDependencies,
} from "./helpers/ConditionEvaluator";

// Helpers
export {
  GetChildEntity,
  IsExpandVisible,
  GetConfirmInputModalProps,
  GetComputedValuesOnDirtyFields,
  GetComputedValuesOnCreate,
  ExecuteComputedValue,
  CheckFieldValidationRules,
  CheckAsyncFieldValidationRules,
  CheckValidDropdownOptions,
  CheckDefaultValues,
  InitOnCreateFormState,
  InitOnEditFormState,
  ShowField,
  GetFieldsToRender,
  SortOptions,
} from "./helpers/HookInlineFormHelper";

export { SortOptions as SortDropdownOptions } from "./helpers/FieldHelper";

export {
  detectDependencyCycles,
  detectSelfDependencies,
  validateDependencyGraph,
} from "./helpers/DependencyGraphValidator";
export type { ICycleError } from "./helpers/DependencyGraphValidator";

export {
  registerValidators,
  getValidator,
  getValidatorRegistry,
  resetValidatorRegistry,
  runValidations,
  runSyncValidations,
  createMinLengthRule,
  createMaxLengthRule,
  createNumericRangeRule,
  createPatternRule,
  createRequiredIfRule,
} from "./helpers/ValidationRegistry";
export type { ValidatorFn, IValidationContext } from "./helpers/ValidationRegistry";

export {
  registerValueFunctions,
  getValueFunction,
  executeValueFunction,
  resetValueFunctionRegistry,
} from "./helpers/ValueFunctionRegistry";
export type { ValueFunction, IValueFunctionContext } from "./helpers/ValueFunctionRegistry";

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
export { WizardForm } from "./components/HookWizardForm";
export type { IWizardNavigationProps, IWizardStepHeaderProps, IWizardFormProps } from "./components/HookWizardForm";
export { getVisibleSteps, getStepFields, getStepFieldOrder, validateStepFields, isStepValid, getStepIndex } from "./helpers/WizardHelper";

// Field Array
export { FieldArray } from "./components/HookFieldArray";
export type { IFieldArrayProps } from "./components/HookFieldArray";

// Components
export { DynamicForm } from "./components/HookInlineForm";
export { FormFields } from "./components/HookInlineFormFields";
export { FieldWrapper } from "./components/HookFieldWrapper";
export { default as RenderField } from "./components/HookRenderField";
export { default as ConfirmInputsModal } from "./components/HookConfirmInputsModal";
export { FormErrorBoundary } from "./components/HookFormErrorBoundary";

// DevTools
export { FormDevTools } from "./components/HookFormDevTools";
export type { IFormDevToolsProps } from "./components/HookFormDevTools";

// Schema Import
export { jsonSchemaToFieldConfig } from "./utils/jsonSchemaImport";
export type { IJsonSchema, IJsonSchemaProperty } from "./utils/jsonSchemaImport";

// Zod Schema Import
export { zodSchemaToFieldConfig } from "./utils/zodSchemaImport";

// Lazy Field Registry
export { createLazyFieldRegistry } from "./utils/lazyFieldRegistry";

// Hooks
export { useDraftPersistence } from "./hooks/useDraftPersistence";
export type { IDraftPersistenceOptions, IDraftState, IUseDraftPersistenceResult } from "./hooks/useDraftPersistence";
export { useBeforeUnload } from "./hooks/useBeforeUnload";

// Form State Serialization
export { serializeFormState, deserializeFormState } from "./utils/formStateSerialization";

// Expression Engine
export { evaluateExpression, extractExpressionDependencies, extractFunctionDependencies } from "./helpers/ExpressionEngine";

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
