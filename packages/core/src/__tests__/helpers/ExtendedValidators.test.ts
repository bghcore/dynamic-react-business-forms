import { describe, it, expect } from "vitest";
import {
  createMinLengthRule,
  createMaxLengthRule,
  createNumericRangeRule,
  createPatternRule,
  createRequiredIfRule,
  getValidator,
  runSyncValidations,
  IValidationContext,
} from "../../helpers/ValidationRegistry";
import { IValidationRule } from "../../types/IValidationRule";

describe("Extended Validators", () => {
  describe("createMinLengthRule", () => {
    it("returns an IValidationRule with correct name and params", () => {
      const rule = createMinLengthRule(3);
      expect(rule.name).toBe("minLength");
      expect(rule.params).toEqual({ min: 3 });
    });

    it("validates correctly via runSyncValidations", () => {
      const rules: IValidationRule[] = [createMinLengthRule(3)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("abc", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("abcdef", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("ab", rules, ctx)).toBe("Must be at least 3 characters");
    });

    it("returns undefined for empty/null value", () => {
      const rules: IValidationRule[] = [createMinLengthRule(3)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("", rules, ctx)).toBeUndefined();
      expect(runSyncValidations(null, rules, ctx)).toBeUndefined();
      expect(runSyncValidations(undefined, rules, ctx)).toBeUndefined();
    });

    it("returns undefined for non-string value", () => {
      const rules: IValidationRule[] = [createMinLengthRule(3)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations(42, rules, ctx)).toBeUndefined();
    });

    it("supports custom message", () => {
      const rule = createMinLengthRule(5, "Too short!");
      expect(rule.message).toBe("Too short!");

      const rules: IValidationRule[] = [rule];
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(runSyncValidations("ab", rules, ctx)).toBe("Too short!");
    });
  });

  describe("createMaxLengthRule", () => {
    it("returns an IValidationRule with correct name and params", () => {
      const rule = createMaxLengthRule(5);
      expect(rule.name).toBe("maxLength");
      expect(rule.params).toEqual({ max: 5 });
    });

    it("validates correctly via runSyncValidations", () => {
      const rules: IValidationRule[] = [createMaxLengthRule(5)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("abc", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("abcde", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("abcdef", rules, ctx)).toBe("Must be at most 5 characters");
    });

    it("returns undefined for empty/null value", () => {
      const rules: IValidationRule[] = [createMaxLengthRule(5)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("", rules, ctx)).toBeUndefined();
      expect(runSyncValidations(null, rules, ctx)).toBeUndefined();
    });
  });

  describe("createNumericRangeRule", () => {
    it("returns an IValidationRule with correct name and params", () => {
      const rule = createNumericRangeRule(1, 100);
      expect(rule.name).toBe("numericRange");
      expect(rule.params).toEqual({ min: 1, max: 100 });
    });

    it("validates correctly via runSyncValidations", () => {
      const rules: IValidationRule[] = [createNumericRangeRule(1, 100)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations(50, rules, ctx)).toBeUndefined();
      expect(runSyncValidations(1, rules, ctx)).toBeUndefined();
      expect(runSyncValidations(100, rules, ctx)).toBeUndefined();
      expect(runSyncValidations("50", rules, ctx)).toBeUndefined();
    });

    it("returns error for value out of range", () => {
      const rules: IValidationRule[] = [createNumericRangeRule(1, 100)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations(0, rules, ctx)).toBe("Must be between 1 and 100");
      expect(runSyncValidations(101, rules, ctx)).toBe("Must be between 1 and 100");
      expect(runSyncValidations(-5, rules, ctx)).toBe("Must be between 1 and 100");
    });

    it("returns error for non-numeric string", () => {
      const rules: IValidationRule[] = [createNumericRangeRule(1, 100)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("abc", rules, ctx)).toBe("Must be a number");
    });

    it("returns undefined for null/empty value", () => {
      const rules: IValidationRule[] = [createNumericRangeRule(1, 100)];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations(null, rules, ctx)).toBeUndefined();
      expect(runSyncValidations("", rules, ctx)).toBeUndefined();
      expect(runSyncValidations(undefined, rules, ctx)).toBeUndefined();
    });
  });

  describe("createPatternRule", () => {
    it("returns an IValidationRule with correct name and params", () => {
      const rule = createPatternRule("^[A-Z]{3}$", "Must be 3 uppercase letters");
      expect(rule.name).toBe("pattern");
      expect(rule.params).toEqual({ pattern: "^[A-Z]{3}$", message: "Must be 3 uppercase letters" });
    });

    it("validates correctly via runSyncValidations", () => {
      const rules: IValidationRule[] = [createPatternRule("^[A-Z]{3}$", "Must be 3 uppercase letters")];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("ABC", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("XYZ", rules, ctx)).toBeUndefined();
      expect(runSyncValidations("abc", rules, ctx)).toBe("Must be 3 uppercase letters");
      expect(runSyncValidations("AB", rules, ctx)).toBe("Must be 3 uppercase letters");
      expect(runSyncValidations("ABCD", rules, ctx)).toBe("Must be 3 uppercase letters");
    });

    it("returns undefined for empty/null value", () => {
      const rules: IValidationRule[] = [createPatternRule("^[A-Z]{3}$", "Must be 3 uppercase letters")];
      const ctx: IValidationContext = { fieldName: "test", values: {} };

      expect(runSyncValidations("", rules, ctx)).toBeUndefined();
      expect(runSyncValidations(null, rules, ctx)).toBeUndefined();
    });
  });

  describe("createRequiredIfRule", () => {
    it("returns an IValidationRule with correct name and params", () => {
      const rule = createRequiredIfRule("status", ["Active"]);
      expect(rule.name).toBe("requiredIf");
      expect(rule.params).toEqual({ field: "status", values: ["Active"] });
    });

    it("returns error when condition is met and value is empty", () => {
      const rules: IValidationRule[] = [createRequiredIfRule("status", ["Active"])];
      const ctx: IValidationContext = { fieldName: "name", values: { status: "Active" } };

      expect(runSyncValidations("", rules, ctx)).toBe("This field is required");
      expect(runSyncValidations(null, rules, ctx)).toBe("This field is required");
    });

    it("returns undefined when condition is met and value is provided", () => {
      const rules: IValidationRule[] = [createRequiredIfRule("status", ["Active"])];
      const ctx: IValidationContext = { fieldName: "name", values: { status: "Active" } };

      expect(runSyncValidations("something", rules, ctx)).toBeUndefined();
    });

    it("returns undefined when condition is not met", () => {
      const rules: IValidationRule[] = [createRequiredIfRule("status", ["Active"])];
      const ctx: IValidationContext = { fieldName: "name", values: { status: "Inactive" } };

      expect(runSyncValidations("", rules, ctx)).toBeUndefined();
      expect(runSyncValidations(null, rules, ctx)).toBeUndefined();
    });

    it("supports multiple dependent values", () => {
      const rules: IValidationRule[] = [createRequiredIfRule("type", ["Bug", "Issue"])];

      expect(runSyncValidations("", rules, { fieldName: "name", values: { type: "Bug" } }))
        .toBe("This field is required");
      expect(runSyncValidations("", rules, { fieldName: "name", values: { type: "Issue" } }))
        .toBe("This field is required");
      expect(runSyncValidations("", rules, { fieldName: "name", values: { type: "Feature" } }))
        .toBeUndefined();
    });
  });

  describe("Default registry entries", () => {
    it("includes noSpecialCharacters", () => {
      const fn = getValidator("noSpecialCharacters")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("abc123", undefined, ctx)).toBeUndefined();
      expect(fn("abc-def_ghi.jkl", undefined, ctx)).toBeUndefined();
      expect(fn("abc@def", undefined, ctx)).toBe("Special characters are not allowed");
      expect(fn("abc#$%", undefined, ctx)).toBe("Special characters are not allowed");
    });

    it("includes currency", () => {
      const fn = getValidator("currency")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn("100", undefined, ctx)).toBeUndefined();
      expect(fn("100.50", undefined, ctx)).toBeUndefined();
      expect(fn("-50.25", undefined, ctx)).toBeUndefined();
      expect(fn("100.123", undefined, ctx)).toBe("Invalid currency format");
      expect(fn("abc", undefined, ctx)).toBe("Invalid currency format");
    });

    it("includes uniqueInArray", () => {
      const fn = getValidator("uniqueInArray")!;
      const ctx: IValidationContext = { fieldName: "test", values: {} };
      expect(fn(["a", "b", "c"], undefined, ctx)).toBeUndefined();
      expect(fn(["a", "b", "a"], undefined, ctx)).toBe("Duplicate value: a");
      expect(fn(null, undefined, ctx)).toBeUndefined();
      expect(fn("not-array", undefined, ctx)).toBeUndefined();
    });
  });
});
