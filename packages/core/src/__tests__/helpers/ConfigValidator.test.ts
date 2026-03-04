import { describe, it, expect, vi, afterEach } from "vitest";
import { validateFieldConfigs } from "../../helpers/ConfigValidator";
import { IFieldConfig } from "../../types/IFieldConfig";

describe("ConfigValidator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for valid simple config", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      name: { type: "Textbox", required: true, label: "Name" },
      status: {
        type: "Dropdown",
        required: true,
        label: "Status",
        options: [{ value: "Active", label: "Active" }],
      },
    };

    const errors = validateFieldConfigs(configs);
    expect(errors).toHaveLength(0);
  });

  it("detects rule condition referencing non-existent field", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      status: {
        type: "Dropdown",
        label: "Status",
        options: [{ value: "Active", label: "Active" }],
        rules: [
          {
            when: { field: "nonExistent", operator: "equals", value: "X" },
            then: { required: true },
          },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const ruleErrors = errors.filter(e => e.type === "missing_rule_target");
    expect(ruleErrors.length).toBeGreaterThan(0);
    expect(ruleErrors[0].message).toContain("nonExistent");
  });

  it("detects cross-field effect targeting non-existent field", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      status: {
        type: "Dropdown",
        label: "Status",
        options: [{ value: "Active", label: "Active" }],
        rules: [
          {
            when: { field: "status", operator: "equals", value: "Active" },
            then: { fields: { nonExistentTarget: { required: true } } },
          },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const ruleErrors = errors.filter(e => e.type === "missing_rule_target");
    expect(ruleErrors.length).toBeGreaterThan(0);
    expect(ruleErrors[0].message).toContain("nonExistentTarget");
  });

  it("detects else-effect targeting non-existent field", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      status: {
        type: "Dropdown",
        label: "Status",
        options: [{ value: "Active", label: "Active" }],
        rules: [
          {
            when: { field: "status", operator: "equals", value: "Active" },
            then: { required: true },
            else: { fields: { ghostField: { hidden: true } } },
          },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const ruleErrors = errors.filter(e => e.type === "missing_rule_target");
    expect(ruleErrors.length).toBeGreaterThan(0);
    expect(ruleErrors[0].message).toContain("ghostField");
  });

  it("detects unregistered component type when registry provided", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      field: { type: "CustomWidget", label: "Field" },
    };

    const registeredComponents = new Set(["Textbox", "Dropdown"]);
    const errors = validateFieldConfigs(configs, registeredComponents);
    const compErrors = errors.filter(e => e.type === "unregistered_component");
    expect(compErrors.length).toBeGreaterThan(0);
    expect(compErrors[0].message).toContain("CustomWidget");
    expect(compErrors[0].message).toContain("Textbox");
  });

  it("does not flag component types when no registry provided", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      field: { type: "CustomWidget", label: "Field" },
    };

    const errors = validateFieldConfigs(configs);
    const compErrors = errors.filter(e => e.type === "unregistered_component");
    expect(compErrors).toHaveLength(0);
  });

  it("detects unregistered validator name in validate array", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      email: {
        type: "Textbox",
        label: "Email",
        validate: [
          { name: "email" },
          { name: "NonExistentValidation" },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const valErrors = errors.filter(e => e.type === "unregistered_validator");
    expect(valErrors).toHaveLength(1);
    expect(valErrors[0].message).toContain("NonExistentValidation");
  });

  it("does not flag registered validator names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      email: {
        type: "Textbox",
        label: "Email",
        validate: [{ name: "email" }],
      },
    };

    const errors = validateFieldConfigs(configs);
    const valErrors = errors.filter(e => e.type === "unregistered_validator");
    expect(valErrors).toHaveLength(0);
  });

  it("detects circular dependencies in rules", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      fieldA: {
        type: "Dropdown",
        label: "A",
        options: [{ value: "x", label: "X" }],
        rules: [
          {
            when: { field: "fieldA", operator: "equals", value: "x" },
            then: { fields: { fieldB: { required: true } } },
          },
        ],
      },
      fieldB: {
        type: "Dropdown",
        label: "B",
        options: [{ value: "y", label: "Y" }],
        rules: [
          {
            when: { field: "fieldB", operator: "equals", value: "y" },
            then: { fields: { fieldA: { required: true } } },
          },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const cycleErrors = errors.filter(e => e.type === "circular_dependency");
    expect(cycleErrors.length).toBeGreaterThan(0);
  });

  it("warns about dropdown without options and no rules providing them", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      status: {
        type: "Dropdown",
        label: "Status",
        // No options, no rules providing options
      },
    };

    const errors = validateFieldConfigs(configs);
    const ddErrors = errors.filter(e => e.type === "missing_options");
    expect(ddErrors).toHaveLength(1);
    expect(ddErrors[0].message).toContain("no options");
  });

  it("does not warn about dropdown when a rule provides options", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      country: {
        type: "Dropdown",
        label: "Country",
        options: [{ value: "US", label: "US" }],
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
        // No options, but country's rule provides them
      },
    };

    const errors = validateFieldConfigs(configs);
    const ddErrors = errors.filter(e => e.type === "missing_options" && e.fieldName === "region");
    expect(ddErrors).toHaveLength(0);
  });

  it("handles empty config", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const errors = validateFieldConfigs({});
    expect(errors).toHaveLength(0);
  });

  it("detects self-dependency", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const configs: Record<string, IFieldConfig> = {
      field: {
        type: "Textbox",
        label: "Field",
        rules: [
          {
            when: { field: "field", operator: "equals", value: "x" },
            then: { fields: { field: { required: true } } },
          },
        ],
      },
    };

    const errors = validateFieldConfigs(configs);
    const selfErrors = errors.filter(e => e.type === "self_dependency");
    expect(selfErrors.length).toBeGreaterThan(0);
  });
});
