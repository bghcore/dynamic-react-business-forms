import { IFieldConfig } from "../types/IFieldConfig";
import { IOption } from "../types/IOption";

/**
 * Converts a Zod object schema to Record<string, IFieldConfig>.
 * Does NOT require zod as a dependency — inspects the schema shape at runtime.
 */
export function zodSchemaToFieldConfig(zodSchema: unknown): Record<string, IFieldConfig> {
  const configs: Record<string, IFieldConfig> = {};
  const shape = getZodShape(zodSchema);
  if (!shape) return configs;

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    configs[fieldName] = zodFieldToConfig(fieldName, fieldSchema as ZodDef);
  }

  return configs;
}

interface ZodDef {
  _def?: {
    typeName?: string;
    innerType?: ZodDef;
    checks?: Array<{ kind: string; value?: unknown; message?: string }>;
    values?: string[];
    options?: ZodDef[];
    type?: ZodDef;
  };
}

function getZodShape(schema: unknown): Record<string, unknown> | null {
  const s = schema as ZodDef;
  if (s?._def && typeof s._def === "object") {
    const def = s._def as Record<string, unknown>;
    if (typeof def.shape === "function") return (def.shape as () => Record<string, unknown>)();
    if (typeof def.shape === "object" && def.shape !== null) return def.shape as Record<string, unknown>;
  }
  return null;
}

function zodFieldToConfig(fieldName: string, field: ZodDef): IFieldConfig {
  const { typeName, isOptional } = unwrapZodType(field);
  const checks = getZodChecks(field);

  const config: IFieldConfig = {
    type: "Textbox",
    label: formatLabel(fieldName),
    required: !isOptional,
  };

  switch (typeName) {
    case "ZodString":
      config.type = "Textbox";
      if (checks.some(c => c.kind === "email")) {
        config.validate = [...(config.validate ?? []), { name: "email" }];
      }
      if (checks.some(c => c.kind === "url")) {
        config.validate = [...(config.validate ?? []), { name: "url" }];
      }
      break;
    case "ZodNumber":
      config.type = "Number";
      break;
    case "ZodBoolean":
      config.type = "Toggle";
      break;
    case "ZodEnum":
    case "ZodNativeEnum": {
      config.type = "Dropdown";
      const values = getZodEnumValues(field);
      if (values) {
        config.options = values.map(v => ({ value: String(v), label: String(v) }));
      }
      break;
    }
    case "ZodDate":
      config.type = "DateControl";
      break;
    case "ZodArray":
      config.type = "Multiselect";
      break;
    default:
      config.type = "Textbox";
  }

  return config;
}

function unwrapZodType(field: ZodDef): { typeName: string; isOptional: boolean } {
  let current = field;
  let isOptional = false;
  while (current?._def) {
    const tn = current._def.typeName;
    if (tn === "ZodOptional" || tn === "ZodNullable") {
      isOptional = true;
      current = current._def.innerType as ZodDef;
    } else if (tn === "ZodDefault") {
      current = current._def.innerType as ZodDef;
    } else {
      break;
    }
  }
  return { typeName: current?._def?.typeName ?? "ZodString", isOptional };
}

function getZodChecks(field: ZodDef): Array<{ kind: string; value?: unknown }> {
  let current = field;
  while (current?._def) {
    if (current._def.checks) return current._def.checks;
    if (current._def.innerType) { current = current._def.innerType as ZodDef; } else { break; }
  }
  return [];
}

function getZodEnumValues(field: ZodDef): string[] | null {
  let current = field;
  while (current?._def) {
    if (current._def.values) return current._def.values;
    if (current._def.innerType) { current = current._def.innerType as ZodDef; } else { break; }
  }
  return null;
}

function formatLabel(fieldName: string): string {
  return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
}
