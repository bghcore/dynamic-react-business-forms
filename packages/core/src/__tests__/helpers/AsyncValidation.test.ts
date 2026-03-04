import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerValidators,
  getValidator,
  resetValidatorRegistry,
  runValidations,
  ValidatorFn,
  IValidationContext,
} from "../../helpers/ValidationRegistry";
import { IValidationRule } from "../../types/IValidationRule";

describe("Async Validation (unified registry)", () => {
  beforeEach(() => {
    resetValidatorRegistry();
  });

  describe("registerValidators with async functions", () => {
    it("registers async validators that can be retrieved", () => {
      const asyncFn: ValidatorFn = async (value) =>
        value === "bad" ? "Async error" : undefined;

      registerValidators({ AsyncCustomValidator: asyncFn });

      const retrieved = getValidator("AsyncCustomValidator");
      expect(retrieved).toBeDefined();
      expect(retrieved).toBe(asyncFn);
    });
  });

  describe("getValidator with async validator", () => {
    it("returns registered async function", async () => {
      const asyncFn: ValidatorFn = async (value) =>
        value === "invalid" ? "Invalid value" : undefined;

      registerValidators({ AsyncGetTest: asyncFn });

      const retrieved = getValidator("AsyncGetTest");
      expect(retrieved).toBeDefined();
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(await retrieved!("invalid", undefined, ctx)).toBe("Invalid value");
      expect(await retrieved!("valid", undefined, ctx)).toBeUndefined();
    });

    it("returns undefined for unknown", () => {
      const result = getValidator("NonExistentAsyncValidator");
      expect(result).toBeUndefined();
    });
  });

  describe("runValidations with async rules", () => {
    it("runs async validators in sequence", async () => {
      const callOrder: string[] = [];

      registerValidators({
        AsyncSequence1: async () => {
          callOrder.push("first");
          return undefined;
        },
        AsyncSequence2: async () => {
          callOrder.push("second");
          return undefined;
        },
      });

      const rules: IValidationRule[] = [
        { name: "AsyncSequence1", async: true },
        { name: "AsyncSequence2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: { field1: "test" } };

      await runValidations("test", rules, ctx);
      expect(callOrder).toEqual(["first", "second"]);
    });

    it("returns first error found", async () => {
      registerValidators({
        AsyncFirstError1: async () => "First error",
        AsyncFirstError2: async () => "Second error",
      });

      const rules: IValidationRule[] = [
        { name: "AsyncFirstError1", async: true },
        { name: "AsyncFirstError2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBe("First error");
    });

    it("respects AbortSignal cancellation", async () => {
      const controller = new AbortController();

      registerValidators({
        AsyncAbortTest: async () => "Should not reach",
      });

      // Abort before calling
      controller.abort();

      const rules: IValidationRule[] = [{ name: "AsyncAbortTest", async: true }];
      const ctx: IValidationContext = { fieldName: "test", values: {}, signal: controller.signal };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("respects AbortSignal cancellation between validators", async () => {
      const controller = new AbortController();
      const callOrder: string[] = [];

      registerValidators({
        AsyncAbortBetween1: async () => {
          callOrder.push("first");
          controller.abort(); // Abort after first validator runs
          return undefined;
        },
        AsyncAbortBetween2: async () => {
          callOrder.push("second");
          return "Error from second";
        },
      });

      const rules: IValidationRule[] = [
        { name: "AsyncAbortBetween1", async: true },
        { name: "AsyncAbortBetween2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {}, signal: controller.signal };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
      expect(callOrder).toEqual(["first"]);
    });

    it("returns undefined when all pass", async () => {
      registerValidators({
        AsyncAllPass1: async () => undefined,
        AsyncAllPass2: async () => undefined,
      });

      const rules: IValidationRule[] = [
        { name: "AsyncAllPass1", async: true },
        { name: "AsyncAllPass2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("skips unknown validator names", async () => {
      registerValidators({
        AsyncSkipUnknown: async () => undefined,
      });

      const rules: IValidationRule[] = [
        { name: "NonExistentValidator", async: true },
        { name: "AsyncSkipUnknown", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("passes value, params, and context to the validator", async () => {
      const spyFn = vi.fn<ValidatorFn>().mockResolvedValue(undefined);
      registerValidators({ AsyncSpyTest: spyFn });

      const controller = new AbortController();
      const rules: IValidationRule[] = [
        { name: "AsyncSpyTest", async: true, params: { custom: "param" } },
      ];
      const ctx: IValidationContext = {
        fieldName: "testField",
        values: { field1: "test" },
        signal: controller.signal,
      };

      await runValidations("myValue", rules, ctx);

      expect(spyFn).toHaveBeenCalledWith("myValue", { custom: "param" }, ctx);
    });
  });
});
