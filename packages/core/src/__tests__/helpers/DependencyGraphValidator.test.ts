import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectDependencyCycles,
  detectSelfDependencies,
  validateDependencyGraph,
} from "../../helpers/DependencyGraphValidator";
import { IFieldConfig } from "../../types/IFieldConfig";
import { circularDependencyConfigs } from "../__fixtures__/fieldConfigs";

describe("DependencyGraphValidator", () => {
  describe("detectDependencyCycles", () => {
    it("returns empty array for acyclic dependency graph", () => {
      // Acyclic chain: trigger -> fieldA -> fieldB
      // Each rule condition references a different (upstream) field.
      const fields: Record<string, IFieldConfig> = {
        trigger: {
          type: "Dropdown",
          label: "Trigger",
          options: [{ value: "x", label: "X" }],
          // No rules on trigger itself
        },
        fieldA: {
          type: "Textbox",
          label: "A",
          rules: [
            {
              // Condition references trigger (upstream), effect targets fieldB (downstream)
              when: { field: "trigger", operator: "equals", value: "x" },
              then: { fields: { fieldB: { required: true } } },
            },
          ],
        },
        fieldB: {
          type: "Textbox",
          label: "B",
        },
      };

      const errors = detectDependencyCycles(fields);
      expect(errors).toHaveLength(0);
    });

    it("detects a simple two-node cycle", () => {
      const errors = detectDependencyCycles(circularDependencyConfigs);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe("dependency");
      expect(errors[0].fields).toContain("fieldA");
      expect(errors[0].fields).toContain("fieldB");
    });

    it("detects a three-node cycle", () => {
      const fields: Record<string, IFieldConfig> = {
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
              then: { fields: { fieldC: { required: true } } },
            },
          ],
        },
        fieldC: {
          type: "Dropdown",
          label: "C",
          options: [{ value: "z", label: "Z" }],
          rules: [
            {
              when: { field: "fieldC", operator: "equals", value: "z" },
              then: { fields: { fieldA: { required: true } } },
            },
          ],
        },
      };

      const errors = detectDependencyCycles(fields);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].fields).toHaveLength(3);
    });

    it("returns empty array for fields with no rules", () => {
      const fields: Record<string, IFieldConfig> = {
        fieldA: { type: "Textbox", label: "A" },
        fieldB: { type: "Textbox", label: "B" },
      };

      const errors = detectDependencyCycles(fields);
      expect(errors).toHaveLength(0);
    });

    it("handles empty fields object", () => {
      const errors = detectDependencyCycles({});
      expect(errors).toHaveLength(0);
    });
  });

  describe("detectSelfDependencies", () => {
    it("detects a field that depends on and modifies itself via cross-field effects", () => {
      const fields: Record<string, IFieldConfig> = {
        fieldA: {
          type: "Textbox",
          label: "A",
          rules: [
            {
              when: { field: "fieldA", operator: "equals", value: "x" },
              then: { fields: { fieldA: { required: true } } },
            },
          ],
        },
      };

      const errors = detectSelfDependencies(fields);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe("self");
      expect(errors[0].fields).toContain("fieldA");
    });

    it("returns empty for rules that only modify self-state (no cross-field self-ref)", () => {
      const fields: Record<string, IFieldConfig> = {
        fieldA: {
          type: "Textbox",
          label: "A",
          rules: [
            {
              when: { field: "fieldA", operator: "equals", value: "x" },
              // This only modifies the field's own required/hidden — not via fields
              then: { required: true },
            },
          ],
        },
      };

      const errors = detectSelfDependencies(fields);
      expect(errors).toHaveLength(0);
    });

    it("returns empty for fields with no rules", () => {
      const fields: Record<string, IFieldConfig> = {
        fieldA: { type: "Textbox", label: "A" },
      };

      const errors = detectSelfDependencies(fields);
      expect(errors).toHaveLength(0);
    });
  });

  describe("validateDependencyGraph", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("logs warnings for cycles in dev mode", () => {
      const errors = validateDependencyGraph(circularDependencyConfigs);
      expect(errors.length).toBeGreaterThan(0);
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toContain("[dynamic-forms]");
    });

    it("returns empty for valid dependency graph (non-self-referencing conditions)", () => {
      // In v2, a rule whose condition references its own field creates a self-loop
      // in the dependency graph. To test an acyclic graph, use conditions that
      // reference a DIFFERENT field.
      const fields: Record<string, IFieldConfig> = {
        trigger: {
          type: "Dropdown",
          label: "Trigger",
          options: [{ value: "x", label: "X" }],
        },
        fieldA: {
          type: "Textbox",
          label: "A",
          rules: [
            {
              when: { field: "trigger", operator: "equals", value: "x" },
              then: { fields: { fieldB: { required: true } } },
            },
          ],
        },
        fieldB: {
          type: "Textbox",
          label: "B",
        },
      };

      const errors = validateDependencyGraph(fields);
      expect(errors).toHaveLength(0);
    });

    it("detects self-referencing rule (condition + effect on same field)", () => {
      const fields: Record<string, IFieldConfig> = {
        fieldA: {
          type: "Textbox",
          label: "A",
          rules: [
            {
              when: { field: "fieldA", operator: "equals", value: "x" },
              then: { fields: { fieldA: { required: true } } },
            },
          ],
        },
      };

      const errors = validateDependencyGraph(fields);
      expect(errors.length).toBeGreaterThan(0);
      const selfError = errors.find(e => e.type === "self");
      expect(selfError).toBeDefined();
      expect(selfError!.message).toContain("depends on and modifies itself");
    });
  });
});
