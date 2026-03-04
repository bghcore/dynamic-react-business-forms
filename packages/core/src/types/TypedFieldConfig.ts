import { IFieldConfig } from "./IFieldConfig";
import { ICondition } from "./ICondition";
import { IFieldEffect } from "./IFieldEffect";

/**
 * A field config where rule targets are constrained to known field names.
 * Provides compile-time checking that cross-field rule effects reference valid fields.
 */
export type TypedFieldConfig<TFields extends string> = Omit<IFieldConfig, "rules"> & {
  /**
   * Business rules with type-safe cross-field effect targets.
   * Field names in `then.fields` and `else.fields` are checked against TFields.
   */
  rules?: Array<{
    id?: string;
    when: ICondition;
    then: Omit<IFieldEffect, "fields"> & {
      fields?: Partial<Record<TFields, IFieldEffect>>;
    };
    else?: Omit<IFieldEffect, "fields"> & {
      fields?: Partial<Record<TFields, IFieldEffect>>;
    };
    priority?: number;
  }>;
};

/**
 * Define field configs with type-safe rule references.
 * TypeScript will error if a rule's cross-field effect targets a field name that doesn't exist.
 *
 * At runtime this is a no-op -- it just returns the input. The value is purely at compile time.
 *
 * @example
 * const config = defineFormConfig({
 *   name: { type: "Textbox", label: "Name" },
 *   status: {
 *     type: "Dropdown",
 *     label: "Status",
 *     options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }],
 *     rules: [{
 *       when: { field: "status", operator: "equals", value: "Active" },
 *       then: { fields: { name: { required: true } } },  // "name" checked at compile time
 *     }],
 *   },
 * });
 */
export function defineFormConfig<T extends Record<string, TypedFieldConfig<Extract<keyof T, string>>>>(
  fields: T
): Record<string, IFieldConfig> {
  return fields as unknown as Record<string, IFieldConfig>;
}
