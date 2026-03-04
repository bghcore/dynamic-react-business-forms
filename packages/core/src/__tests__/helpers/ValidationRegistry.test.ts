import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getValidator,
  getValidatorRegistry,
  registerValidators,
  resetValidatorRegistry,
  runSyncValidations,
  runValidations,
  ValidatorFn,
  IValidationContext,
} from "../../helpers/ValidationRegistry";
import { IValidationRule } from "../../types/IValidationRule";

describe("ValidationRegistry", () => {
  // NOTE: The registry is module-level mutable state. We use resetValidatorRegistry
  // in beforeEach to keep tests isolated.

  beforeEach(() => {
    resetValidatorRegistry();
  });

  describe("default validators are registered", () => {
    it.each([
      "email",
      "phone",
      "year",
      "url",
      "noSpecialCharacters",
      "currency",
      "uniqueInArray",
      "minLength",
      "maxLength",
      "numericRange",
      "pattern",
      "maxKb",
      "requiredIf",
      "required",
    ])("getValidator('%s') returns a function", (name) => {
      const fn = getValidator(name);
      expect(fn).toBeDefined();
      expect(typeof fn).toBe("function");
    });
  });

  describe("legacy name aliases are registered", () => {
    it.each([
      "EmailValidation",
      "PhoneNumberValidation",
      "YearValidation",
      "isValidUrl",
      "NoSpecialCharactersValidation",
      "CurrencyValidation",
      "UniqueInArrayValidation",
      "Max150KbValidation",
      "Max32KbValidation",
    ])("getValidator('%s') returns a function (legacy alias)", (name) => {
      const fn = getValidator(name);
      expect(fn).toBeDefined();
      expect(typeof fn).toBe("function");
    });
  });

  describe("getValidator returns undefined for unknown name", () => {
    it("returns undefined for a name that was never registered", () => {
      expect(getValidator("NonExistentValidator")).toBeUndefined();
    });
  });

  describe("getValidatorRegistry returns all registered validators", () => {
    it("contains every default validator", () => {
      const registry = getValidatorRegistry();
      expect(registry).toHaveProperty("email");
      expect(registry).toHaveProperty("phone");
      expect(registry).toHaveProperty("year");
      expect(registry).toHaveProperty("url");
      expect(registry).toHaveProperty("required");
    });

    it("returns a copy (mutating it does not affect the internal registry)", () => {
      const registry = getValidatorRegistry();
      registry["email"] = (() => "hacked") as ValidatorFn;
      const fresh = getValidator("email");
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      // The original should still work correctly
      expect(fresh!("test@example.com", undefined, ctx)).toBeUndefined();
    });
  });

  describe("email validator", () => {
    it("returns undefined for a valid email", () => {
      const fn = getValidator("email")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("user@example.com", undefined, ctx)).toBeUndefined();
    });

    it("returns undefined for empty/null input", () => {
      const fn = getValidator("email")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("", undefined, ctx)).toBeUndefined();
      expect(fn(null, undefined, ctx)).toBeUndefined();
      expect(fn(undefined, undefined, ctx)).toBeUndefined();
    });

    it("returns error string for invalid email", () => {
      const fn = getValidator("email")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("not-an-email", undefined, ctx)).toBe("Invalid email address");
      expect(fn("missing@domain", undefined, ctx)).toBe("Invalid email address");
      expect(fn("@no-local.com", undefined, ctx)).toBe("Invalid email address");
    });
  });

  describe("phone validator", () => {
    it("returns undefined for valid phone numbers", () => {
      const fn = getValidator("phone")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("+1-555-1234", undefined, ctx)).toBeUndefined();
      expect(fn("(555) 123-4567", undefined, ctx)).toBeUndefined();
      expect(fn("5551234567", undefined, ctx)).toBeUndefined();
    });

    it("returns undefined for empty/null input", () => {
      const fn = getValidator("phone")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("", undefined, ctx)).toBeUndefined();
      expect(fn(null, undefined, ctx)).toBeUndefined();
    });

    it("returns error string for invalid phone numbers", () => {
      const fn = getValidator("phone")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("abc", undefined, ctx)).toBe("Invalid phone number");
      expect(fn("hello world", undefined, ctx)).toBe("Invalid phone number");
    });
  });

  describe("year validator", () => {
    it("returns undefined for valid years", () => {
      const fn = getValidator("year")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("2024", undefined, ctx)).toBeUndefined();
      expect(fn("1900", undefined, ctx)).toBeUndefined();
      expect(fn("2100", undefined, ctx)).toBeUndefined();
    });

    it("returns undefined for empty/null input", () => {
      const fn = getValidator("year")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("", undefined, ctx)).toBeUndefined();
      expect(fn(null, undefined, ctx)).toBeUndefined();
    });

    it("returns error string for invalid years", () => {
      const fn = getValidator("year")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("1899", undefined, ctx)).toBe("Invalid year");
      expect(fn("2101", undefined, ctx)).toBe("Invalid year");
      expect(fn("abcd", undefined, ctx)).toBe("Invalid year");
      expect(fn("0", undefined, ctx)).toBe("Invalid year");
    });
  });

  describe("Max150KbValidation (legacy alias)", () => {
    it("returns undefined for content under 150KB", () => {
      const fn = getValidator("Max150KbValidation")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("short string", undefined, ctx)).toBeUndefined();
    });

    it("returns error string for content exceeding 150KB", () => {
      const fn = getValidator("Max150KbValidation")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      const largeString = "x".repeat(151_000);
      expect(fn(largeString, undefined, ctx)).toBe("Content exceeds maximum size of 150KB");
    });
  });

  describe("url validator", () => {
    it("returns undefined for valid URLs", () => {
      const fn = getValidator("url")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("http://example.com", undefined, ctx)).toBeUndefined();
      expect(fn("https://example.com", undefined, ctx)).toBeUndefined();
    });

    it("returns undefined for empty/null input", () => {
      const fn = getValidator("url")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("", undefined, ctx)).toBeUndefined();
      expect(fn(null, undefined, ctx)).toBeUndefined();
    });

    it("returns error string for invalid URLs", () => {
      const fn = getValidator("url")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("not-a-url", undefined, ctx)).toBe("Invalid URL");
      expect(fn("ftp://example.com", undefined, ctx)).toBe("Invalid URL");
      expect(fn("example.com", undefined, ctx)).toBe("Invalid URL");
    });
  });

  describe("registerValidators", () => {
    it("adds custom validators that can be retrieved", () => {
      const customFn: ValidatorFn = (value) =>
        value === "bad" ? "Custom error" : undefined;

      registerValidators({ CustomValidator: customFn });

      const retrieved = getValidator("CustomValidator");
      expect(retrieved).toBe(customFn);
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(retrieved!("bad", undefined, ctx)).toBe("Custom error");
      expect(retrieved!("good", undefined, ctx)).toBeUndefined();
    });

    it("can override a default validator", () => {
      const overrideFn: ValidatorFn = () => "Always invalid";

      registerValidators({ email: overrideFn });

      const retrieved = getValidator("email");
      expect(retrieved).toBe(overrideFn);
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(retrieved!("user@example.com", undefined, ctx)).toBe("Always invalid");
    });

    it("preserves previously registered validators when adding new ones", () => {
      registerValidators({ AnotherCustom: () => undefined });
      registerValidators({ YetAnother: () => undefined });
      expect(getValidator("AnotherCustom")).toBeDefined();
      expect(getValidator("YetAnother")).toBeDefined();
    });

    it("shows custom validators in getValidatorRegistry", () => {
      registerValidators({ CustomA: () => undefined, CustomB: () => undefined });
      const registry = getValidatorRegistry();
      expect(registry).toHaveProperty("CustomA");
      expect(registry).toHaveProperty("CustomB");
    });
  });

  describe("runSyncValidations", () => {
    it("returns undefined when all validations pass", () => {
      const rules: IValidationRule[] = [{ name: "email" }];
      const ctx: IValidationContext = { fieldName: "email", values: {} };
      const result = runSyncValidations("test@example.com", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("returns error from first failing validation", () => {
      const rules: IValidationRule[] = [{ name: "email" }];
      const ctx: IValidationContext = { fieldName: "email", values: {} };
      const result = runSyncValidations("not-an-email", rules, ctx);
      expect(result).toBe("Invalid email address");
    });

    it("skips async rules", () => {
      const rules: IValidationRule[] = [
        { name: "email", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "email", values: {} };
      const result = runSyncValidations("not-an-email", rules, ctx);
      expect(result).toBeUndefined(); // async rule skipped
    });

    it("uses custom message when provided", () => {
      const rules: IValidationRule[] = [
        { name: "email", message: "Please enter a valid email" },
      ];
      const ctx: IValidationContext = { fieldName: "email", values: {} };
      const result = runSyncValidations("not-an-email", rules, ctx);
      expect(result).toBe("Please enter a valid email");
    });

    it("skips conditional validation when condition not met", () => {
      const rules: IValidationRule[] = [
        {
          name: "required",
          when: { field: "status", operator: "equals", value: "Active" },
        },
      ];
      const ctx: IValidationContext = { fieldName: "name", values: { status: "Inactive" } };
      const result = runSyncValidations("", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("runs conditional validation when condition is met", () => {
      const rules: IValidationRule[] = [
        {
          name: "required",
          when: { field: "status", operator: "equals", value: "Active" },
        },
      ];
      const ctx: IValidationContext = { fieldName: "name", values: { status: "Active" } };
      const result = runSyncValidations("", rules, ctx);
      expect(result).toBe("This field is required");
    });

    it("returns undefined when rules array is empty", () => {
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      const result = runSyncValidations("anything", [], ctx);
      expect(result).toBeUndefined();
    });

    it("skips unknown validators gracefully", () => {
      const rules: IValidationRule[] = [{ name: "NonExistentValidator" }];
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      const result = runSyncValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });
  });

  describe("runValidations (async)", () => {
    it("runs async validators in sequence", async () => {
      const callOrder: string[] = [];

      registerValidators({
        asyncFirst: async () => {
          callOrder.push("first");
          return undefined;
        },
        asyncSecond: async () => {
          callOrder.push("second");
          return undefined;
        },
      });

      const rules: IValidationRule[] = [
        { name: "asyncFirst", async: true },
        { name: "asyncSecond", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      await runValidations("test", rules, ctx);
      expect(callOrder).toEqual(["first", "second"]);
    });

    it("returns first error found", async () => {
      registerValidators({
        asyncFail1: async () => "First error",
        asyncFail2: async () => "Second error",
      });

      const rules: IValidationRule[] = [
        { name: "asyncFail1", async: true },
        { name: "asyncFail2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBe("First error");
    });

    it("respects AbortSignal cancellation", async () => {
      registerValidators({
        asyncAbort: async () => "Should not reach",
      });

      const controller = new AbortController();
      controller.abort();

      const rules: IValidationRule[] = [{ name: "asyncAbort", async: true }];
      const ctx: IValidationContext = { fieldName: "test", values: {}, signal: controller.signal };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });

    it("returns undefined when all pass", async () => {
      registerValidators({
        asyncPass1: async () => undefined,
        asyncPass2: async () => undefined,
      });

      const rules: IValidationRule[] = [
        { name: "asyncPass1", async: true },
        { name: "asyncPass2", async: true },
      ];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      const result = await runValidations("test", rules, ctx);
      expect(result).toBeUndefined();
    });
  });
});
