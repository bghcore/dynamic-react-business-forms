import { describe, it, expect } from "vitest";
import { defineFormConfig } from "../../types/TypedFieldConfig";

describe("defineFormConfig", () => {
  it("returns the input as Record<string, IFieldConfig>", () => {
    const configs = defineFormConfig({
      name: { type: "Textbox", label: "Name", required: true },
      status: {
        type: "Dropdown",
        label: "Status",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
    });

    expect(configs.name).toBeDefined();
    expect(configs.name.type).toBe("Textbox");
    expect(configs.status).toBeDefined();
    expect(configs.status.type).toBe("Dropdown");
  });

  it("preserves rule configurations", () => {
    const configs = defineFormConfig({
      type: {
        type: "Dropdown",
        label: "Type",
        options: [
          { value: "bug", label: "Bug" },
          { value: "feature", label: "Feature" },
        ],
        rules: [
          {
            when: { field: "type", operator: "equals", value: "bug" },
            then: { fields: { severity: { required: true, hidden: false } } },
          },
          {
            when: { field: "type", operator: "equals", value: "feature" },
            then: { fields: { severity: { hidden: true } } },
          },
        ],
      },
      severity: {
        type: "Dropdown",
        label: "Severity",
        hidden: true,
      },
    });

    expect(configs.type.rules).toBeDefined();
    expect(configs.type.rules).toHaveLength(2);
  });

  it("preserves validate array", () => {
    const configs = defineFormConfig({
      email: {
        type: "Textbox",
        label: "Email",
        required: true,
        validate: [
          { name: "email" },
          { name: "checkUnique", async: true },
        ],
        computedValue: "$values.firstName + '@example.com'",
      },
    });

    expect(configs.email.validate).toEqual([
      { name: "email" },
      { name: "checkUnique", async: true },
    ]);
    expect(configs.email.computedValue).toBe("$values.firstName + '@example.com'");
  });

  it("preserves options", () => {
    const configs = defineFormConfig({
      country: {
        type: "Dropdown",
        label: "Country",
        options: [
          { value: "US", label: "United States" },
          { value: "CA", label: "Canada" },
        ],
        rules: [
          {
            when: { field: "country", operator: "equals", value: "US" },
            then: {
              fields: {
                region: {
                  options: [
                    { value: "East", label: "East" },
                    { value: "West", label: "West" },
                  ],
                },
              },
            },
          },
        ],
      },
      region: {
        type: "Dropdown",
        label: "Region",
      },
    });

    expect(configs.country.options).toHaveLength(2);
    expect(configs.country.rules).toBeDefined();
    expect(configs.country.rules![0].then.fields!.region.options).toHaveLength(2);
  });

  it("returns empty object for empty input", () => {
    const configs = defineFormConfig({});
    expect(Object.keys(configs)).toHaveLength(0);
  });

  it("preserves all field config properties", () => {
    const configs = defineFormConfig({
      field: {
        type: "Textbox",
        label: "Field",
        required: true,
        hidden: false,
        readOnly: false,
        defaultValue: "default",
        computedValue: "$fn.setDate()",
        computeOnCreateOnly: true,
        config: { custom: true },
        description: "A field",
        placeholder: "Enter value",
        helpText: "Help text",
        confirmInput: false,
      },
    });

    expect(configs.field.type).toBe("Textbox");
    expect(configs.field.label).toBe("Field");
    expect(configs.field.required).toBe(true);
    expect(configs.field.defaultValue).toBe("default");
    expect(configs.field.computedValue).toBe("$fn.setDate()");
    expect(configs.field.computeOnCreateOnly).toBe(true);
    expect(configs.field.config).toEqual({ custom: true });
    expect(configs.field.description).toBe("A field");
  });
});
