import { IFieldConfig } from "../types/IFieldConfig";
import { getValidator } from "./ValidationRegistry";
import { detectDependencyCycles, detectSelfDependencies } from "./DependencyGraphValidator";
import { extractConditionDependencies } from "./ConditionEvaluator";

export interface IConfigValidationError {
  type:
    | "missing_rule_target"
    | "unregistered_component"
    | "unregistered_validator"
    | "circular_dependency"
    | "self_dependency"
    | "missing_options"
    | "invalid_condition";
  fieldName: string;
  message: string;
  details?: string;
}

/**
 * Validates field configs for common issues at dev time.
 *
 * Checks:
 * - Rule conditions reference existing fields
 * - Cross-field effects target existing fields
 * - Component types are registered (if registry provided)
 * - Validators are registered
 * - Dropdown fields have options or rules providing them
 * - No circular/self dependencies
 */
export function validateFieldConfigs(
  fields: Record<string, IFieldConfig>,
  registeredComponents?: Set<string>
): IConfigValidationError[] {
  const errors: IConfigValidationError[] = [];
  const fieldNames = new Set(Object.keys(fields));

  for (const [fieldName, config] of Object.entries(fields)) {
    // Check rule condition field references
    if (config.rules) {
      for (const rule of config.rules) {
        const condDeps = extractConditionDependencies(rule.when);
        for (const dep of condDeps) {
          if (!fieldNames.has(dep)) {
            errors.push({
              type: "missing_rule_target",
              fieldName,
              message: `Field "${fieldName}" has a rule condition referencing non-existent field "${dep}"`,
              details: dep,
            });
          }
        }

        // Check cross-field effect targets
        if (rule.then.fields) {
          for (const target of Object.keys(rule.then.fields)) {
            if (!fieldNames.has(target)) {
              errors.push({
                type: "missing_rule_target",
                fieldName,
                message: `Field "${fieldName}" has a rule effect targeting non-existent field "${target}"`,
                details: target,
              });
            }
          }
        }
        if (rule.else?.fields) {
          for (const target of Object.keys(rule.else.fields)) {
            if (!fieldNames.has(target)) {
              errors.push({
                type: "missing_rule_target",
                fieldName,
                message: `Field "${fieldName}" has a rule else-effect targeting non-existent field "${target}"`,
                details: target,
              });
            }
          }
        }
      }
    }

    // Check component types are registered
    if (registeredComponents && config.type && !registeredComponents.has(config.type)) {
      errors.push({
        type: "unregistered_component",
        fieldName,
        message: `Field "${fieldName}" uses unregistered component type "${config.type}". Available: ${[...registeredComponents].join(", ")}`,
        details: config.type,
      });
    }

    // Check validator names
    if (config.validate) {
      for (const rule of config.validate) {
        if (!getValidator(rule.name)) {
          errors.push({
            type: "unregistered_validator",
            fieldName,
            message: `Field "${fieldName}" references unregistered validator "${rule.name}"`,
            details: rule.name,
          });
        }
      }
    }

    // Check dropdown fields have options
    if (
      (config.type === "Dropdown" || config.type === "StatusDropdown" || config.type === "Multiselect") &&
      (!config.options || config.options.length === 0) &&
      !hasRuleProvidingOptions(fieldName, fields)
    ) {
      errors.push({
        type: "missing_options",
        fieldName,
        message: `Field "${fieldName}" is a ${config.type} but has no options configured and no rules providing options`,
      });
    }
  }

  // Check for circular/self dependencies
  const cycleErrors = detectDependencyCycles(fields);
  for (const cycleError of cycleErrors) {
    errors.push({
      type: "circular_dependency",
      fieldName: cycleError.fields[0] ?? "",
      message: cycleError.message,
    });
  }

  const selfErrors = detectSelfDependencies(fields);
  for (const selfError of selfErrors) {
    errors.push({
      type: "self_dependency",
      fieldName: selfError.fields[0] ?? "",
      message: selfError.message,
    });
  }

  return errors;
}

/** Checks if any rule provides options for a field */
function hasRuleProvidingOptions(
  targetFieldName: string,
  fields: Record<string, IFieldConfig>
): boolean {
  for (const config of Object.values(fields)) {
    if (config.rules) {
      for (const rule of config.rules) {
        if (rule.then.fields?.[targetFieldName]?.options) return true;
        if (rule.else?.fields?.[targetFieldName]?.options) return true;
      }
    }
  }
  return false;
}
