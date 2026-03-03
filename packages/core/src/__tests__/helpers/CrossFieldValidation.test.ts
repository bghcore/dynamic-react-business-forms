import { describe, it, expect, beforeEach } from "vitest";
import {
  registerCrossFieldValidations,
  getCrossFieldValidation,
  CrossFieldValidationFunction,
} from "../../helpers/ValidationRegistry";
import { CheckCrossFieldValidationRules } from "../../helpers/HookInlineFormHelper";

describe("CrossFieldValidation", () => {
  describe("registerCrossFieldValidations", () => {
    it("registers validators that can be retrieved", () => {
      const validator: CrossFieldValidationFunction = (values, fieldName) => {
        return values[fieldName] === "bad" ? "Field is bad" : undefined;
      };

      registerCrossFieldValidations({ TestValidator: validator });

      const retrieved = getCrossFieldValidation("TestValidator");
      expect(retrieved).toBeDefined();
      expect(typeof retrieved).toBe("function");
    });

    it("merges with previously registered validators", () => {
      registerCrossFieldValidations({
        ValidatorA: () => undefined,
      });
      registerCrossFieldValidations({
        ValidatorB: () => undefined,
      });

      expect(getCrossFieldValidation("ValidatorA")).toBeDefined();
      expect(getCrossFieldValidation("ValidatorB")).toBeDefined();
    });
  });

  describe("getCrossFieldValidation", () => {
    it("returns the registered function", () => {
      const myValidator: CrossFieldValidationFunction = () => "error";
      registerCrossFieldValidations({ MyValidator: myValidator });

      const retrieved = getCrossFieldValidation("MyValidator");
      expect(retrieved).toBe(myValidator);
    });

    it("returns undefined for unknown validator names", () => {
      const result = getCrossFieldValidation("NonExistentCrossFieldValidator");
      expect(result).toBeUndefined();
    });
  });

  describe("CheckCrossFieldValidationRules", () => {
    it("runs validators with all form values and field name", () => {
      const dateRangeValidator: CrossFieldValidationFunction = (values, fieldName) => {
        if (fieldName === "endDate") {
          const start = values.startDate as number;
          const end = values.endDate as number;
          if (start != null && end != null && end < start) {
            return "End date must be after start date";
          }
        }
        return undefined;
      };

      registerCrossFieldValidations({ DateRangeCheck: dateRangeValidator });

      const values = { startDate: 100, endDate: 50 };
      const result = CheckCrossFieldValidationRules(
        values,
        "endDate",
        ["DateRangeCheck"]
      );
      expect(result).toBe("End date must be after start date");
    });

    it("returns first error found when multiple validators fail", () => {
      registerCrossFieldValidations({
        FirstFailer: () => "First error",
        SecondFailer: () => "Second error",
      });

      const result = CheckCrossFieldValidationRules(
        { someField: "value" },
        "someField",
        ["FirstFailer", "SecondFailer"]
      );
      expect(result).toBe("First error");
    });

    it("returns undefined when all validators pass", () => {
      registerCrossFieldValidations({
        AlwaysPasses: () => undefined,
        AlsoAlwaysPasses: () => undefined,
      });

      const result = CheckCrossFieldValidationRules(
        { field: "value" },
        "field",
        ["AlwaysPasses", "AlsoAlwaysPasses"]
      );
      expect(result).toBeUndefined();
    });

    it("skips unknown validator names without error", () => {
      registerCrossFieldValidations({
        KnownValidator: () => undefined,
      });

      const result = CheckCrossFieldValidationRules(
        { field: "value" },
        "field",
        ["UnknownValidator123", "KnownValidator"]
      );
      expect(result).toBeUndefined();
    });

    it("returns error from known validator even when preceded by unknown ones", () => {
      registerCrossFieldValidations({
        FailingValidator: () => "This failed",
      });

      const result = CheckCrossFieldValidationRules(
        { field: "value" },
        "field",
        ["CompletelyUnknown", "FailingValidator"]
      );
      expect(result).toBe("This failed");
    });

    it("handles empty validations array", () => {
      const result = CheckCrossFieldValidationRules(
        { field: "value" },
        "field",
        []
      );
      expect(result).toBeUndefined();
    });

    it("passes entityData and fieldName correctly to validator", () => {
      let capturedValues: Record<string, unknown> | undefined;
      let capturedFieldName: string | undefined;

      registerCrossFieldValidations({
        CaptureArgs: (values, fieldName) => {
          capturedValues = values;
          capturedFieldName = fieldName;
          return undefined;
        },
      });

      const entityData = { a: 1, b: "two", c: true };
      CheckCrossFieldValidationRules(entityData, "testField", ["CaptureArgs"]);

      expect(capturedValues).toBe(entityData);
      expect(capturedFieldName).toBe("testField");
    });
  });
});
