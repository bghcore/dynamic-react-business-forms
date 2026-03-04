import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getValueFunction,
  registerValueFunctions,
  executeValueFunction,
  resetValueFunctionRegistry,
  ValueFunction,
} from "../../helpers/ValueFunctionRegistry";

describe("ValueFunctionRegistry", () => {
  beforeEach(() => {
    resetValueFunctionRegistry();
  });

  describe("default value functions are registered", () => {
    it.each([
      "setDate",
      "setDateIfNull",
      "setLoggedInUser",
      "inheritFromParent",
    ])("getValueFunction('%s') returns a function", (name) => {
      const fn = getValueFunction(name);
      expect(fn).toBeDefined();
      expect(typeof fn).toBe("function");
    });
  });

  describe("getValueFunction returns undefined for unknown name", () => {
    it("returns undefined for a name that was never registered", () => {
      expect(getValueFunction("nonExistentFunction")).toBeUndefined();
    });
  });

  describe("setDate", () => {
    it("returns a Date object", () => {
      const fn = getValueFunction("setDate")!;
      const before = new Date();
      const result = fn({ fieldName: "createdDate", values: {} });
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect((result as Date).getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("setDateIfNull", () => {
    it("returns the existing value when fieldValue is present (truthy)", () => {
      const fn = getValueFunction("setDateIfNull")!;
      const existing = new Date(2020, 0, 1);
      const result = fn({ fieldName: "modifiedDate", fieldValue: existing, values: {} });
      expect(result).toBe(existing);
    });

    it("returns the existing string value when fieldValue is a non-empty string", () => {
      const fn = getValueFunction("setDateIfNull")!;
      const result = fn({ fieldName: "modifiedDate", fieldValue: "2020-01-01", values: {} });
      expect(result).toBe("2020-01-01");
    });

    it("returns a new Date when fieldValue is null", () => {
      const fn = getValueFunction("setDateIfNull")!;
      const before = new Date();
      const result = fn({ fieldName: "modifiedDate", fieldValue: null, values: {} });
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect((result as Date).getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("returns a new Date when fieldValue is undefined", () => {
      const fn = getValueFunction("setDateIfNull")!;
      const result = fn({ fieldName: "modifiedDate", fieldValue: undefined, values: {} });
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("setLoggedInUser", () => {
    it("returns {id: userId} when currentUserId is provided", () => {
      const fn = getValueFunction("setLoggedInUser")!;
      const result = fn({ fieldName: "owner", currentUserId: "user-123", values: {} });
      expect(result).toEqual({ id: "user-123" });
    });

    it("returns undefined when currentUserId is not provided", () => {
      const fn = getValueFunction("setLoggedInUser")!;
      const result = fn({ fieldName: "owner", values: {} });
      expect(result).toBeUndefined();
    });

    it("returns undefined when currentUserId is empty string", () => {
      const fn = getValueFunction("setLoggedInUser")!;
      const result = fn({ fieldName: "owner", currentUserId: "", values: {} });
      expect(result).toBeUndefined();
    });
  });

  describe("inheritFromParent", () => {
    it("returns the parent entity value for the given field name", () => {
      const fn = getValueFunction("inheritFromParent")!;
      const values = { Parent: { region: "East", country: "US" } };
      const result = fn({ fieldName: "region", values });
      expect(result).toBe("East");
    });

    it("returns undefined when Parent is not in values", () => {
      const fn = getValueFunction("inheritFromParent")!;
      const result = fn({ fieldName: "region", values: {} });
      expect(result).toBeUndefined();
    });

    it("returns undefined when the field does not exist on the parent", () => {
      const fn = getValueFunction("inheritFromParent")!;
      const values = { Parent: { country: "US" } };
      const result = fn({ fieldName: "nonExistent", values });
      expect(result).toBeUndefined();
    });
  });

  describe("registerValueFunctions", () => {
    it("adds custom value functions that can be retrieved", () => {
      const customFn: ValueFunction = ({ fieldValue }) =>
        fieldValue ? `processed-${fieldValue}` : "default";

      registerValueFunctions({ customProcessor: customFn });

      const retrieved = getValueFunction("customProcessor");
      expect(retrieved).toBe(customFn);
      expect(retrieved!({ fieldName: "test", fieldValue: "input", values: {} })).toBe("processed-input");
      expect(retrieved!({ fieldName: "test", values: {} })).toBe("default");
    });

    it("can override a default value function", () => {
      const overrideFn: ValueFunction = () => "overridden";

      registerValueFunctions({ setDate: overrideFn });

      const retrieved = getValueFunction("setDate");
      expect(retrieved).toBe(overrideFn);
      expect(retrieved!({ fieldName: "test", values: {} })).toBe("overridden");
    });

    it("preserves previously registered functions when adding new ones", () => {
      registerValueFunctions({ customA: () => "a" });
      registerValueFunctions({ customB: () => "b" });
      expect(getValueFunction("customA")).toBeDefined();
      expect(getValueFunction("customB")).toBeDefined();
    });
  });

  describe("executeValueFunction", () => {
    it("calls the right function with the correct arguments", () => {
      const spyFn = vi.fn(({ fieldName, fieldValue, currentUserId }) => {
        return `${fieldName}-${fieldValue}-${currentUserId}`;
      });

      registerValueFunctions({ spyFunction: spyFn });

      const result = executeValueFunction(
        "myField",
        "spyFunction",
        { parentKey: "parentVal" },
        "myValue",
        { parentKey: "parentVal" },
        "user-42"
      );

      expect(spyFn).toHaveBeenCalledTimes(1);
      expect(spyFn).toHaveBeenCalledWith({
        fieldName: "myField",
        fieldValue: "myValue",
        values: { parentKey: "parentVal" },
        parentEntity: { parentKey: "parentVal" },
        currentUserId: "user-42",
      });
      expect(result).toBe("myField-myValue-user-42");
    });

    it("returns undefined for an unknown value function name", () => {
      const result = executeValueFunction("field", "unknownFunction", {});
      expect(result).toBeUndefined();
    });

    it("passes undefined for optional parameters when not provided", () => {
      const spyFn = vi.fn(() => "result");
      registerValueFunctions({ optionalParamsFn: spyFn });

      executeValueFunction("field", "optionalParamsFn", {});

      expect(spyFn).toHaveBeenCalledWith({
        fieldName: "field",
        fieldValue: undefined,
        values: {},
        parentEntity: undefined,
        currentUserId: undefined,
      });
    });
  });
});
