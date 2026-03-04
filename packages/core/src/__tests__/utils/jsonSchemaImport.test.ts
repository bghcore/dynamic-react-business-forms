import { describe, it, expect } from "vitest";
import { jsonSchemaToFieldConfig, IJsonSchema } from "../../utils/jsonSchemaImport";

describe("jsonSchemaToFieldConfig", () => {
  it("maps string type to Textbox", () => {
    const schema: IJsonSchema = {
      properties: {
        name: { type: "string" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.name).toBeDefined();
    expect(result.name.type).toBe("Textbox");
  });

  it("maps number type to Number", () => {
    const schema: IJsonSchema = {
      properties: {
        age: { type: "number" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.age).toBeDefined();
    expect(result.age.type).toBe("Number");
  });

  it("maps boolean type to Toggle", () => {
    const schema: IJsonSchema = {
      properties: {
        active: { type: "boolean" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.active).toBeDefined();
    expect(result.active.type).toBe("Toggle");
  });

  it("maps enum to Dropdown with options", () => {
    const schema: IJsonSchema = {
      properties: {
        status: {
          type: "string",
          enum: ["Active", "Inactive", "Pending"],
        },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.status).toBeDefined();
    expect(result.status.type).toBe("Dropdown");
    expect(result.status.options).toEqual([
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Pending", label: "Pending" },
    ]);
  });

  it("maps format=email to email validation rule", () => {
    const schema: IJsonSchema = {
      properties: {
        email: { type: "string", format: "email" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.email).toBeDefined();
    expect(result.email.validate).toBeDefined();
    expect(result.email.validate!.some(v => v.name === "email")).toBe(true);
  });

  it("maps format=date to DateControl", () => {
    const schema: IJsonSchema = {
      properties: {
        startDate: { type: "string", format: "date" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.startDate).toBeDefined();
    expect(result.startDate.type).toBe("DateControl");
  });

  it("maps required array to required: true", () => {
    const schema: IJsonSchema = {
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.name.required).toBe(true);
    expect(result.age.required).toBe(false);
    expect(result.email.required).toBe(true);
  });

  it("uses title as label, falls back to field name", () => {
    const schema: IJsonSchema = {
      properties: {
        firstName: { type: "string", title: "First Name" },
        lastName: { type: "string" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.firstName.label).toBe("First Name");
    expect(result.lastName.label).toBe("lastName");
  });

  it("handles empty schema", () => {
    const schema: IJsonSchema = {};

    const result = jsonSchemaToFieldConfig(schema);

    expect(result).toEqual({});
  });

  it("maps integer type to Number", () => {
    const schema: IJsonSchema = {
      properties: {
        count: { type: "integer" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.count.type).toBe("Number");
  });

  it("maps number with minimum and maximum to Slider", () => {
    const schema: IJsonSchema = {
      properties: {
        rating: { type: "number", minimum: 0, maximum: 10 },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.rating.type).toBe("Slider");
  });

  it("maps array type to Multiselect", () => {
    const schema: IJsonSchema = {
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.tags.type).toBe("Multiselect");
  });

  it("maps format=uri to Textbox with url validation", () => {
    const schema: IJsonSchema = {
      properties: {
        website: { type: "string", format: "uri" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.website.type).toBe("Textbox");
    expect(result.website.validate!.some(v => v.name === "url")).toBe(true);
  });

  it("maps string with maxLength > 200 to Textarea", () => {
    const schema: IJsonSchema = {
      properties: {
        description: { type: "string", maxLength: 500 },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.description.type).toBe("Textarea");
  });

  it("maps format=date-time to DateControl", () => {
    const schema: IJsonSchema = {
      properties: {
        createdAt: { type: "string", format: "date-time" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.createdAt.type).toBe("DateControl");
  });

  it("preserves default value", () => {
    const schema: IJsonSchema = {
      properties: {
        color: { type: "string", default: "blue" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.color.defaultValue).toBe("blue");
  });

  it("maps unknown type to Textbox", () => {
    const schema: IJsonSchema = {
      properties: {
        custom: { type: "object" },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.custom.type).toBe("Textbox");
  });

  it("handles type as array, using first element", () => {
    const schema: IJsonSchema = {
      properties: {
        nullable: { type: ["string", "null"] },
      },
    };

    const result = jsonSchemaToFieldConfig(schema);

    expect(result.nullable.type).toBe("Textbox");
  });
});
