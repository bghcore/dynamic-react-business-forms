import { describe, it, expect } from "vitest";
import { zodSchemaToFieldConfig } from "../../utils/zodSchemaImport";

// Mock Zod schema structures (matching Zod's internal _def format)
function mockZodString(checks: Array<{ kind: string }> = []) {
  return { _def: { typeName: "ZodString", checks } };
}
function mockZodNumber(checks: Array<{ kind: string }> = []) {
  return { _def: { typeName: "ZodNumber", checks } };
}
function mockZodBoolean() {
  return { _def: { typeName: "ZodBoolean", checks: [] } };
}
function mockZodEnum(values: string[]) {
  return { _def: { typeName: "ZodEnum", values } };
}
function mockZodDate() {
  return { _def: { typeName: "ZodDate", checks: [] } };
}
function mockZodArray(type: unknown) {
  return { _def: { typeName: "ZodArray", type } };
}
function mockZodOptional(innerType: unknown) {
  return { _def: { typeName: "ZodOptional", innerType } };
}
function mockZodObject(shape: Record<string, unknown>) {
  return { _def: { typeName: "ZodObject", shape: () => shape } };
}

describe("zodSchemaToFieldConfig", () => {
  it("maps string to Textbox", () => {
    const schema = mockZodObject({ name: mockZodString() });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.name).toBeDefined();
    expect(result.name.type).toBe("Textbox");
    expect(result.name.required).toBe(true);
  });

  it("maps number to Number", () => {
    const schema = mockZodObject({ age: mockZodNumber() });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.age).toBeDefined();
    expect(result.age.type).toBe("Number");
    expect(result.age.required).toBe(true);
  });

  it("maps boolean to Toggle", () => {
    const schema = mockZodObject({ active: mockZodBoolean() });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.active).toBeDefined();
    expect(result.active.type).toBe("Toggle");
  });

  it("maps enum to Dropdown with options", () => {
    const schema = mockZodObject({
      role: mockZodEnum(["admin", "user", "guest"]),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.role).toBeDefined();
    expect(result.role.type).toBe("Dropdown");
    expect(result.role.options).toEqual([
      { value: "admin", label: "admin" },
      { value: "user", label: "user" },
      { value: "guest", label: "guest" },
    ]);
  });

  it("maps date to DateControl", () => {
    const schema = mockZodObject({ startDate: mockZodDate() });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.startDate).toBeDefined();
    expect(result.startDate.type).toBe("DateControl");
  });

  it("maps array to Multiselect", () => {
    const schema = mockZodObject({
      tags: mockZodArray(mockZodString()),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.tags).toBeDefined();
    expect(result.tags.type).toBe("Multiselect");
  });

  it("marks optional fields as not required", () => {
    const schema = mockZodObject({
      nickname: mockZodOptional(mockZodString()),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.nickname).toBeDefined();
    expect(result.nickname.required).toBe(false);
    expect(result.nickname.type).toBe("Textbox");
  });

  it("detects email check and adds email validation", () => {
    const schema = mockZodObject({
      email: mockZodString([{ kind: "email" }]),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.email).toBeDefined();
    expect(result.email.type).toBe("Textbox");
    expect(result.email.validate!.some(v => v.name === "email")).toBe(true);
  });

  it("detects url check and adds url validation", () => {
    const schema = mockZodObject({
      website: mockZodString([{ kind: "url" }]),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.website).toBeDefined();
    expect(result.website.type).toBe("Textbox");
    expect(result.website.validate!.some(v => v.name === "url")).toBe(true);
  });

  it("formats camelCase field names to Title Case labels", () => {
    const schema = mockZodObject({
      firstName: mockZodString(),
      lastName: mockZodString(),
      emailAddress: mockZodString(),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.firstName.label).toBe("First Name");
    expect(result.lastName.label).toBe("Last Name");
    expect(result.emailAddress.label).toBe("Email Address");
  });

  it("handles empty schema", () => {
    const schema = mockZodObject({});
    const result = zodSchemaToFieldConfig(schema);

    expect(result).toEqual({});
  });

  it("returns empty for non-object schema", () => {
    const result = zodSchemaToFieldConfig(mockZodString());

    expect(result).toEqual({});
  });

  it("handles nullable fields as optional", () => {
    const nullable = {
      _def: {
        typeName: "ZodNullable",
        innerType: mockZodString(),
      },
    };
    const schema = mockZodObject({ middleName: nullable });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.middleName.required).toBe(false);
    expect(result.middleName.type).toBe("Textbox");
  });

  it("handles ZodDefault by unwrapping to inner type", () => {
    const withDefault = {
      _def: {
        typeName: "ZodDefault",
        innerType: mockZodNumber(),
      },
    };
    const schema = mockZodObject({ count: withDefault });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.count.type).toBe("Number");
  });

  it("handles shape as a static object (not a function)", () => {
    const schema = {
      _def: {
        typeName: "ZodObject",
        shape: { name: mockZodString() },
      },
    };
    const result = zodSchemaToFieldConfig(schema);

    expect(result.name).toBeDefined();
    expect(result.name.type).toBe("Textbox");
  });

  it("maps unknown Zod type to Textbox", () => {
    const schema = mockZodObject({
      custom: { _def: { typeName: "ZodSomethingNew" } },
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.custom.type).toBe("Textbox");
  });

  it("handles multiple checks on a single field", () => {
    const schema = mockZodObject({
      link: mockZodString([{ kind: "url" }, { kind: "min" }]),
    });
    const result = zodSchemaToFieldConfig(schema);

    expect(result.link.validate!.some(v => v.name === "url")).toBe(true);
  });

  it("returns empty for null input", () => {
    const result = zodSchemaToFieldConfig(null);

    expect(result).toEqual({});
  });

  it("returns empty for undefined input", () => {
    const result = zodSchemaToFieldConfig(undefined);

    expect(result).toEqual({});
  });
});
