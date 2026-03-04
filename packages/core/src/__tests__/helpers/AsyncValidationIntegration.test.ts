import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerValidators,
  resetValidatorRegistry,
  runSyncValidations,
  runValidations,
  ValidatorFn,
  IValidationContext,
} from "../../helpers/ValidationRegistry";
import { IValidationRule } from "../../types/IValidationRule";

describe("AsyncValidationIntegration", () => {
  beforeEach(() => {
    resetValidatorRegistry();

    // Register sync validators
    const syncFail: ValidatorFn = (value) =>
      value === "sync-bad" ? "Sync validation failed" : undefined;
    const syncPass: ValidatorFn = () => undefined;

    // Register async validators
    const asyncFail: ValidatorFn = async (value) =>
      value === "async-bad" ? "Async validation failed" : undefined;
    const asyncPass: ValidatorFn = async () => undefined;

    registerValidators({
      IntegSyncFail: syncFail,
      IntegSyncPass: syncPass,
      IntegAsyncFail: asyncFail,
      IntegAsyncPass: asyncPass,
    });
  });

  it("sync validation fails -> async not called", async () => {
    const asyncSpy = vi.fn<ValidatorFn>().mockResolvedValue(undefined);
    registerValidators({ IntegAsyncSpy: asyncSpy });

    const syncRules: IValidationRule[] = [{ name: "IntegSyncFail" }];
    const asyncRules: IValidationRule[] = [{ name: "IntegAsyncSpy", async: true }];
    const ctx: IValidationContext = { fieldName: "field1", values: { field1: "test" } };
    const value = "sync-bad";

    // Simulate the validate logic from HookRenderField:
    // 1. Run sync validations first
    // 2. Only run async if sync passes
    let result: string | undefined;
    const syncError = runSyncValidations(value, syncRules, ctx);
    if (syncError) {
      result = syncError;
    } else {
      result = await runValidations(value, asyncRules, ctx);
    }

    expect(result).toBe("Sync validation failed");
    expect(asyncSpy).not.toHaveBeenCalled();
  });

  it("sync passes -> async runs and returns error", async () => {
    const syncRules: IValidationRule[] = [{ name: "IntegSyncPass" }];
    const asyncRules: IValidationRule[] = [{ name: "IntegAsyncFail", async: true }];
    const ctx: IValidationContext = { fieldName: "field1", values: { field1: "test" } };
    const value = "async-bad";

    let result: string | undefined;
    const syncError = runSyncValidations(value, syncRules, ctx);
    if (syncError) {
      result = syncError;
    } else {
      result = await runValidations(value, asyncRules, ctx);
    }

    expect(result).toBe("Async validation failed");
  });

  it("both pass -> returns undefined", async () => {
    const syncRules: IValidationRule[] = [{ name: "IntegSyncPass" }];
    const asyncRules: IValidationRule[] = [{ name: "IntegAsyncPass", async: true }];
    const ctx: IValidationContext = { fieldName: "field1", values: { field1: "test" } };
    const value = "good-value";

    let result: string | undefined;
    const syncError = runSyncValidations(value, syncRules, ctx);
    if (syncError) {
      result = syncError;
    } else {
      result = await runValidations(value, asyncRules, ctx);
    }

    expect(result).toBeUndefined();
  });

  it("unified runValidations handles mixed sync and async rules", async () => {
    const allRules: IValidationRule[] = [
      { name: "IntegSyncPass" },
      { name: "IntegAsyncPass", async: true },
    ];
    const ctx: IValidationContext = { fieldName: "field1", values: {} };

    const result = await runValidations("good-value", allRules, ctx);
    expect(result).toBeUndefined();
  });

  it("unified runValidations stops at first sync failure before reaching async", async () => {
    const allRules: IValidationRule[] = [
      { name: "IntegSyncFail" },
      { name: "IntegAsyncPass", async: true },
    ];
    const ctx: IValidationContext = { fieldName: "field1", values: {} };

    const result = await runValidations("sync-bad", allRules, ctx);
    expect(result).toBe("Sync validation failed");
  });
});
