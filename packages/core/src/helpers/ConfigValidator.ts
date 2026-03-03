import { Dictionary } from "../utils";
import { IFieldConfig } from "../types/IFieldConfig";
import { getValidation, getAsyncValidation } from "./ValidationRegistry";
import { detectDependencyCycles } from "./DependencyGraphValidator";
import { GetDefaultBusinessRules } from "./BusinessRulesHelper";

export interface IConfigValidationError {
  type: "missing_dependency_target" | "unregistered_component" | "unregistered_validation" | "unregistered_async_validation" | "circular_dependency" | "missing_dropdown_options" | "self_dependency";
  fieldName: string;
  message: string;
  details?: string;
}

/**
 * Validates field configs for common issues at dev time.
 *
 * Performs the following checks on every field config:
 * - **missing_dependency_target**: dependency/dropdown dependency/combo rule references a field not in the config.
 * - **self_dependency**: a field's dependency rules target itself, which causes infinite evaluation loops.
 * - **unregistered_component**: the component type is not in the provided registered components set.
 * - **unregistered_validation**: a sync validation name is not in the ValidationRegistry.
 * - **unregistered_async_validation**: an async validation name is not in the async ValidationRegistry.
 * - **missing_dropdown_options**: a Dropdown/StatusDropdown/Multiselect has no options and no dependency providing them.
 * - **circular_dependency**: the dependency graph contains cycles (detected via DependencyGraphValidator).
 *
 * @param fieldConfigs - The field configuration dictionary to validate.
 * @param registeredComponents - Optional set of registered component type names for component type checking.
 * @returns Array of validation errors (empty if config is valid).
 */
export function validateFieldConfigs(
  fieldConfigs: Dictionary<IFieldConfig>,
  registeredComponents?: Set<string>
): IConfigValidationError[] {
  const errors: IConfigValidationError[] = [];
  const fieldNames = new Set(Object.keys(fieldConfigs));

  for (const [fieldName, config] of Object.entries(fieldConfigs)) {
    // Check dependency targets exist and check for self-dependencies
    if (config.dependencies) {
      for (const [value, dependentFields] of Object.entries(config.dependencies)) {
        if (fieldName in dependentFields) {
          errors.push({
            type: "self_dependency",
            fieldName,
            message: `Field "${fieldName}" has a dependency on itself for value "${value}"`,
          });
        }
        for (const targetField of Object.keys(dependentFields)) {
          if (!fieldNames.has(targetField)) {
            errors.push({
              type: "missing_dependency_target",
              fieldName,
              message: `Field "${fieldName}" has dependency for value "${value}" targeting non-existent field "${targetField}"`,
              details: targetField,
            });
          }
        }
      }
    }

    // Check combo dependency rule targets exist
    if (config.dependencyRules?.rules) {
      for (const dependsOnField of Object.keys(config.dependencyRules.rules)) {
        if (!fieldNames.has(dependsOnField)) {
          errors.push({
            type: "missing_dependency_target",
            fieldName,
            message: `Field "${fieldName}" has combo rule depending on non-existent field "${dependsOnField}"`,
            details: dependsOnField,
          });
        }
      }
    }

    // Check dropdown dependency targets exist
    if (config.dropdownDependencies) {
      for (const [value, dependentFields] of Object.entries(config.dropdownDependencies)) {
        for (const targetField of Object.keys(dependentFields)) {
          if (!fieldNames.has(targetField)) {
            errors.push({
              type: "missing_dependency_target",
              fieldName,
              message: `Field "${fieldName}" has dropdown dependency for value "${value}" targeting non-existent field "${targetField}"`,
              details: targetField,
            });
          }
        }
      }
    }

    // Check component types are registered (if registry provided)
    if (registeredComponents && config.component && !registeredComponents.has(config.component)) {
      errors.push({
        type: "unregistered_component",
        fieldName,
        message: `Field "${fieldName}" uses unregistered component type "${config.component}". Available: ${[...registeredComponents].join(", ")}`,
        details: config.component,
      });
    }

    // Check validation names reference registered validators
    if (config.validations) {
      for (const validationName of config.validations) {
        if (!getValidation(validationName)) {
          errors.push({
            type: "unregistered_validation",
            fieldName,
            message: `Field "${fieldName}" references unregistered validation "${validationName}"`,
            details: validationName,
          });
        }
      }
    }

    // Check async validation names reference registered validators
    if (config.asyncValidations) {
      for (const validationName of config.asyncValidations) {
        if (!getAsyncValidation(validationName)) {
          errors.push({
            type: "unregistered_async_validation",
            fieldName,
            message: `Field "${fieldName}" references unregistered async validation "${validationName}"`,
            details: validationName,
          });
        }
      }
    }

    // Check dropdown fields have options configured
    if (
      (config.component === "Dropdown" || config.component === "StatusDropdown" || config.component === "Multiselect") &&
      (!config.dropdownOptions || config.dropdownOptions.length === 0) &&
      !config.dropdownDependencies &&
      !hasDropdownDependencyFrom(fieldName, fieldConfigs)
    ) {
      errors.push({
        type: "missing_dropdown_options",
        fieldName,
        message: `Field "${fieldName}" is a ${config.component} but has no dropdown options configured and no dropdown dependencies providing options`,
      });
    }
  }

  // Check for circular dependencies
  const defaultRules = GetDefaultBusinessRules(fieldConfigs);
  const cycleErrors = detectDependencyCycles(defaultRules);
  for (const cycleError of cycleErrors) {
    errors.push({
      type: "circular_dependency",
      fieldName: cycleError.fields[0] ?? "",
      message: cycleError.message,
    });
  }

  return errors;
}

/** Checks if any other field's dropdownDependencies provides options for this field */
function hasDropdownDependencyFrom(targetFieldName: string, fieldConfigs: Dictionary<IFieldConfig>): boolean {
  for (const config of Object.values(fieldConfigs)) {
    if (config.dropdownDependencies) {
      for (const dependentFields of Object.values(config.dropdownDependencies)) {
        if (targetFieldName in dependentFields) return true;
      }
    }
  }
  return false;
}
