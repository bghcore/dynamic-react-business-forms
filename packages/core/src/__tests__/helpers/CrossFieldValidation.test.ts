import { describe, it, expect, beforeEach } from "vitest";
import {
  registerValidators,
  resetValidatorRegistry,
  runSyncValidations,
  runValidations,
  ValidatorFn,
  IValidationContext,
} from "../../helpers/ValidationRegistry";
import { IValidationRule } from "../../types/IValidationRule";

describe("CrossFieldValidation (unified registry)", () => {
  beforeEach(() => {
    resetValidatorRegistry();
  });

  describe("registering cross-field validators", () => {
    it("registers validators that access context.values", () => {
      const validator: ValidatorFn = (value, params, context) => {
        return context.values[context.fieldName] === "bad" ? "Field is bad" : undefined;
      };

      registerValidators({ TestCrossField: validator });

      const ctx: IValidationContext = { fieldName: "myField", values: { myField: "bad" } };
      const rules: IValidationRule[] = [{ name: "TestCrossField" }];

      const result = runSyncValidations("bad", rules, ctx);
      expect(result).toBe("Field is bad");
    });

    it("merges with previously registered validators", () => {
      registerValidators({ ValidatorA: () => undefined });
      registerValidators({ ValidatorB: () => undefined });

      const ctxA: IValidationContext = { fieldName: "test", values: {} };
      expect(runSyncValidations("x", [{ name: "ValidatorA" }], ctxA)).toBeUndefined();
      expect(runSyncValidations("x", [{ name: "ValidatorB" }], ctxA)).toBeUndefined();
    });
  });

  describe("cross-field validation via runSyncValidations", () => {
    it("runs validators with all form values and field name", () => {
      const dateRangeValidator: ValidatorFn = (_value, _params, context) => {
        if (context.fieldName === "endDate") {
          const start = context.values.startDate as number;
          const end = context.values.endDate as number;
          if (start != null && end != null && end < start) {
            return "End date must be after start date";
          }
        }
        return undefined;
      };

      registerValidators({ DateRangeCheck: dateRangeValidator });

      const values = { startDate: 100, endDate: 50 };
      const ctx: IValidationContext = { fieldName: "endDate", values };
      const rules: IValidationRule[] = [{ name: "DateRangeCheck" }];

      const result = runSyncValidations(50, rules, ctx);
      expect(result).toBe("End date must be after start date");
    });

    it("returns first error found when multiple validators fail", () => {
      registerValidators({
        FirstFailer: () => "First error",
        SecondFailer: () => "Second error",
      });

      const ctx: IValidationContext = { fieldName: "someField", values: { someField: "value" } };
      const rules: IValidationRule[] = [
        { name: "FirstFailer" },
        { name: "SecondFailer" },
      ];

      const result = runSyncValidations("value", rules, ctx);
      expect(result).toBe("First error");
    });

    it("returns undefined when all validators pass", () => {
      registerValidators({
        AlwaysPasses: () => undefined,
        AlsoAlwaysPasses: () => undefined,
      });

      const ctx: IValidationContext = { fieldName: "field", values: { field: "value" } };
      const rules: IValidationRule[] = [
        { name: "AlwaysPasses" },
        { name: "AlsoAlwaysPasses" },
      ];

      const result = runSyncValidations("value", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("skips unknown validator names without error", () => {
      registerValidators({
        KnownValidator: () => undefined,
      });

      const ctx: IValidationContext = { fieldName: "field", values: { field: "value" } };
      const rules: IValidationRule[] = [
        { name: "UnknownValidator123" },
        { name: "KnownValidator" },
      ];

      const result = runSyncValidations("value", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("returns error from known validator even when preceded by unknown ones", () => {
      registerValidators({
        FailingValidator: () => "This failed",
      });

      const ctx: IValidationContext = { fieldName: "field", values: { field: "value" } };
      const rules: IValidationRule[] = [
        { name: "CompletelyUnknown" },
        { name: "FailingValidator" },
      ];

      const result = runSyncValidations("value", rules, ctx);
      expect(result).toBe("This failed");
    });

    it("handles empty validations array", () => {
      const ctx: IValidationContext = { fieldName: "field", values: { field: "value" } };
      const result = runSyncValidations("value", [], ctx);
      expect(result).toBeUndefined();
    });

    it("passes context correctly to validator", () => {
      let capturedValues: Record<string, unknown> | undefined;
      let capturedFieldName: string | undefined;

      registerValidators({
        CaptureArgs: (_value, _params, context) => {
          capturedValues = context.values;
          capturedFieldName = context.fieldName;
          return undefined;
        },
      });

      const entityData = { a: 1, b: "two", c: true };
      const ctx: IValidationContext = { fieldName: "testField", values: entityData };
      const rules: IValidationRule[] = [{ name: "CaptureArgs" }];

      runSyncValidations("test", rules, ctx);

      expect(capturedValues).toBe(entityData);
      expect(capturedFieldName).toBe("testField");
    });
  });
});
