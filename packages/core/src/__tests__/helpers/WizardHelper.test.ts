import { describe, it, expect } from "vitest";
import {
  getVisibleSteps,
  getStepFields,
  getStepFieldOrder,
  validateStepFields,
  isStepValid,
  getStepIndex,
} from "../../helpers/WizardHelper";
import { IWizardStep } from "../../types/IWizardConfig";
import { IRuntimeFieldState } from "../../types/IRuntimeFieldState";

describe("WizardHelper", () => {
  const baseSteps: IWizardStep[] = [
    {
      id: "step1",
      title: "Basic Info",
      fields: ["name", "email", "phone"],
    },
    {
      id: "step2",
      title: "Address",
      fields: ["street", "city", "zip"],
      visibleWhen: { field: "hasAddress", operator: "in", value: ["true", "yes"] },
    },
    {
      id: "step3",
      title: "Review",
      fields: ["notes", "confirm"],
    },
  ];

  describe("getVisibleSteps", () => {
    it("shows all steps when no conditions are set", () => {
      const stepsNoConditions: IWizardStep[] = [
        { id: "a", title: "A", fields: ["f1"] },
        { id: "b", title: "B", fields: ["f2"] },
      ];
      const result = getVisibleSteps(stepsNoConditions, {});
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("a");
      expect(result[1].id).toBe("b");
    });

    it("filters steps by condition when entity data matches", () => {
      const result = getVisibleSteps(baseSteps, { hasAddress: "true" });
      expect(result).toHaveLength(3);
      expect(result.map(s => s.id)).toEqual(["step1", "step2", "step3"]);
    });

    it("filters out steps when condition is not met", () => {
      const result = getVisibleSteps(baseSteps, { hasAddress: "false" });
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(["step1", "step3"]);
    });

    it("handles empty entity data gracefully", () => {
      const result = getVisibleSteps(baseSteps, {});
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(["step1", "step3"]);
    });

    it("supports multiple allowed values in visibleWhen", () => {
      const result1 = getVisibleSteps(baseSteps, { hasAddress: "yes" });
      expect(result1).toHaveLength(3);

      const result2 = getVisibleSteps(baseSteps, { hasAddress: "true" });
      expect(result2).toHaveLength(3);
    });

    it("returns empty array for empty steps", () => {
      const result = getVisibleSteps([], {});
      expect(result).toHaveLength(0);
    });

    it("supports equals condition", () => {
      const steps: IWizardStep[] = [
        {
          id: "conditional",
          title: "Conditional",
          fields: ["field1"],
          visibleWhen: { field: "role", operator: "equals", value: "admin" },
        },
      ];

      expect(getVisibleSteps(steps, { role: "admin" })).toHaveLength(1);
      expect(getVisibleSteps(steps, { role: "user" })).toHaveLength(0);
    });

    it("supports isNotEmpty condition", () => {
      const steps: IWizardStep[] = [
        {
          id: "conditional",
          title: "Conditional",
          fields: ["field1"],
          visibleWhen: { field: "name", operator: "isNotEmpty" },
        },
      ];

      expect(getVisibleSteps(steps, { name: "Alice" })).toHaveLength(1);
      expect(getVisibleSteps(steps, { name: "" })).toHaveLength(0);
      expect(getVisibleSteps(steps, {})).toHaveLength(0);
    });
  });

  describe("getStepFields", () => {
    const step: IWizardStep = {
      id: "step1",
      title: "Step 1",
      fields: ["name", "email", "phone"],
    };

    it("returns all fields when no fieldStates are provided", () => {
      const result = getStepFields(step);
      expect(result).toEqual(["name", "email", "phone"]);
    });

    it("returns all fields when fieldStates is undefined", () => {
      const result = getStepFields(step, undefined);
      expect(result).toEqual(["name", "email", "phone"]);
    });

    it("filters hidden fields based on field states", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { hidden: false, type: "Textbox" },
        email: { hidden: true, type: "Textbox" },
        phone: { hidden: false, type: "Textbox" },
      };
      const result = getStepFields(step, fieldStates);
      expect(result).toEqual(["name", "phone"]);
    });

    it("returns all fields when none are hidden", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { hidden: false, type: "Textbox" },
        email: { hidden: false, type: "Textbox" },
        phone: { hidden: false, type: "Textbox" },
      };
      const result = getStepFields(step, fieldStates);
      expect(result).toEqual(["name", "email", "phone"]);
    });

    it("includes fields that have no matching state entry", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { hidden: false, type: "Textbox" },
      };
      const result = getStepFields(step, fieldStates);
      expect(result).toEqual(["name", "email", "phone"]);
    });
  });

  describe("getStepFieldOrder", () => {
    it("returns all visible step fields in order", () => {
      const result = getStepFieldOrder(baseSteps, { hasAddress: "true" });
      expect(result).toEqual(["name", "email", "phone", "street", "city", "zip", "notes", "confirm"]);
    });

    it("excludes fields from hidden steps", () => {
      const result = getStepFieldOrder(baseSteps, { hasAddress: "false" });
      expect(result).toEqual(["name", "email", "phone", "notes", "confirm"]);
    });

    it("returns empty array for no steps", () => {
      const result = getStepFieldOrder([], {});
      expect(result).toEqual([]);
    });
  });

  describe("validateStepFields", () => {
    const step: IWizardStep = {
      id: "step1",
      title: "Step 1",
      fields: ["name", "email", "phone"],
    };

    it("returns fields that have errors", () => {
      const errors: Record<string, unknown> = {
        name: { type: "required", message: "Name is required" },
        email: { type: "pattern", message: "Invalid email" },
      };
      const result = validateStepFields(step, errors);
      expect(result).toEqual(["name", "email"]);
    });

    it("returns empty array when no step fields have errors", () => {
      const errors: Record<string, unknown> = {
        someOtherField: { type: "required", message: "Required" },
      };
      const result = validateStepFields(step, errors);
      expect(result).toEqual([]);
    });

    it("returns empty array when errors object is empty", () => {
      const result = validateStepFields(step, {});
      expect(result).toEqual([]);
    });

    it("returns only the step fields that appear in errors", () => {
      const errors: Record<string, unknown> = {
        phone: { type: "required", message: "Phone required" },
        otherField: { type: "required", message: "Required" },
      };
      const result = validateStepFields(step, errors);
      expect(result).toEqual(["phone"]);
    });
  });

  describe("isStepValid", () => {
    const step: IWizardStep = {
      id: "step1",
      title: "Step 1",
      fields: ["name", "email"],
    };

    it("returns true when no errors exist for step fields", () => {
      const result = isStepValid(step, {});
      expect(result).toBe(true);
    });

    it("returns true when errors exist only for fields outside the step", () => {
      const errors: Record<string, unknown> = {
        otherField: { type: "required" },
      };
      const result = isStepValid(step, errors);
      expect(result).toBe(true);
    });

    it("returns false when any step field has an error", () => {
      const errors: Record<string, unknown> = {
        name: { type: "required", message: "Required" },
      };
      const result = isStepValid(step, errors);
      expect(result).toBe(false);
    });

    it("returns false when multiple step fields have errors", () => {
      const errors: Record<string, unknown> = {
        name: { type: "required" },
        email: { type: "pattern" },
      };
      const result = isStepValid(step, errors);
      expect(result).toBe(false);
    });
  });

  describe("getStepIndex", () => {
    it("finds step by id", () => {
      expect(getStepIndex(baseSteps, "step1")).toBe(0);
      expect(getStepIndex(baseSteps, "step2")).toBe(1);
      expect(getStepIndex(baseSteps, "step3")).toBe(2);
    });

    it("returns -1 for missing step id", () => {
      expect(getStepIndex(baseSteps, "nonexistent")).toBe(-1);
    });

    it("returns -1 for empty steps array", () => {
      expect(getStepIndex([], "step1")).toBe(-1);
    });
  });
});
