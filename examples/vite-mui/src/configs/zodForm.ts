import { zodSchemaToFieldConfig } from "@bghcore/dynamic-forms-core";

// This would normally be: import { z } from "zod";
// For this example we construct a mock Zod-like schema
// to demonstrate zodSchemaToFieldConfig() without requiring zod as a dep.
//
// In a real app, you'd do:
//   const schema = z.object({ name: z.string(), email: z.string().email(), ... });
//   const config = zodSchemaToFieldConfig(schema);

const mockZodSchema = {
  _def: {
    typeName: "ZodObject",
    shape: () => ({
      fullName: { _def: { typeName: "ZodString", checks: [] } },
      emailAddress: { _def: { typeName: "ZodString", checks: [{ kind: "email" }] } },
      age: { _def: { typeName: "ZodNumber", checks: [] } },
      role: { _def: { typeName: "ZodEnum", values: ["developer", "designer", "manager", "other"] } },
      active: { _def: { typeName: "ZodBoolean", checks: [] } },
      startDate: { _def: { typeName: "ZodDate", checks: [] } },
    }),
  },
};

export const zodExampleConfig = zodSchemaToFieldConfig(mockZodSchema);

export const zodExampleDefaults = {
  fullName: "",
  emailAddress: "",
  age: 0,
  role: "",
  active: true,
  startDate: "",
};
