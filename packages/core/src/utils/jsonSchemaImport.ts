import { IFieldConfig } from "../types/IFieldConfig";
import { IOption } from "../types/IOption";

export interface IJsonSchema {
  type?: string | string[];
  properties?: Record<string, IJsonSchemaProperty>;
  required?: string[];
}

export interface IJsonSchemaProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: (string | number)[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
  items?: IJsonSchemaProperty;
}

export function jsonSchemaToFieldConfig(schema: IJsonSchema): Record<string, IFieldConfig> {
  const configs: Record<string, IFieldConfig> = {};
  const requiredFields = new Set(schema.required ?? []);

  for (const [fieldName, property] of Object.entries(schema.properties ?? {})) {
    const type = mapTypeToComponent(property);
    const validate = mapFormatToValidations(property);
    const options: IOption[] | undefined = property.enum
      ? property.enum.map(v => ({ value: String(v), label: String(v) }))
      : undefined;

    configs[fieldName] = {
      type,
      label: property.title ?? fieldName,
      required: requiredFields.has(fieldName),
      validate: validate.length > 0 ? validate : undefined,
      options,
      defaultValue: property.default,
      description: property.description,
    };
  }

  return configs;
}

function mapTypeToComponent(property: IJsonSchemaProperty): string {
  if (property.enum) return "Dropdown";

  const type = Array.isArray(property.type) ? property.type[0] : property.type;

  switch (type) {
    case "string":
      if (property.format === "date" || property.format === "date-time") return "DateControl";
      if (property.format === "uri" || property.format === "url") return "Textbox";
      if (property.maxLength && property.maxLength > 200) return "Textarea";
      return "Textbox";
    case "number":
    case "integer":
      if (property.minimum !== undefined && property.maximum !== undefined) return "Slider";
      return "Number";
    case "boolean":
      return "Toggle";
    case "array":
      return "Multiselect";
    default:
      return "Textbox";
  }
}

function mapFormatToValidations(property: IJsonSchemaProperty): Array<{ name: string }> {
  const validations: Array<{ name: string }> = [];
  if (property.format === "email") validations.push({ name: "email" });
  if (property.format === "uri" || property.format === "url") validations.push({ name: "url" });
  if (property.format === "phone") validations.push({ name: "phone" });
  return validations;
}
