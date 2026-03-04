import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GetChildEntity,
  IsExpandVisible,
  GetConfirmInputModalProps,
  GetComputedValuesOnDirtyFields,
  GetComputedValuesOnCreate,
  CheckFieldValidationRules,
  CheckAsyncFieldValidationRules,
  ShowField,
  GetFieldsToRender,
  CheckDefaultValues,
  CheckValidDropdownOptions,
  ExecuteComputedValue,
  InitOnEditFormState,
  SortOptions,
} from "../../helpers/HookInlineFormHelper";
import { IEntityData } from "../../utils";
import { IRuntimeFieldState, IRuntimeFormState } from "../../types/IRuntimeFieldState";
import { IFieldConfig } from "../../types/IFieldConfig";
import { IOption } from "../../types/IOption";

describe("HookInlineFormHelper", () => {
  describe("GetChildEntity", () => {
    const parentEntity: IEntityData = {
      items: [
        { id: "child-1", name: "First" },
        { id: "child-2", name: "Second" },
        { id: "child-3", name: "Third" },
      ],
    };

    it("finds and returns the child entity with Parent reference when exactly one match", () => {
      const result = GetChildEntity("child-2", parentEntity, "items");
      expect(result).toBeDefined();
      expect(result!.id).toBe("child-2");
      expect(result!.name).toBe("Second");
      expect(result!.Parent).toEqual(parentEntity);
    });

    it("returns undefined when entityId does not match any child", () => {
      const result = GetChildEntity("nonexistent", parentEntity, "items");
      expect(result).toBeUndefined();
    });

    it("returns undefined when entity is undefined", () => {
      const result = GetChildEntity("child-1", undefined, "items");
      expect(result).toBeUndefined();
    });

    it("returns undefined when entityPath is undefined", () => {
      const result = GetChildEntity("child-1", parentEntity, undefined);
      expect(result).toBeUndefined();
    });

    it("returns undefined when multiple children match (ambiguous)", () => {
      const entityWithDuplicates: IEntityData = {
        items: [
          { id: "dup", name: "First" },
          { id: "dup", name: "Second" },
        ],
      };
      const result = GetChildEntity("dup", entityWithDuplicates, "items");
      expect(result).toBeUndefined();
    });

    it("supports custom idField parameter", () => {
      const entityWithCustomId: IEntityData = {
        records: [
          { code: "REC-1", title: "Record One" },
          { code: "REC-2", title: "Record Two" },
        ],
      };
      const result = GetChildEntity("REC-1", entityWithCustomId, "records", "code");
      expect(result).toBeDefined();
      expect(result!.code).toBe("REC-1");
      expect(result!.title).toBe("Record One");
    });
  });

  describe("IsExpandVisible", () => {
    it("returns true when visible (non-hidden) fields exceed the default cutoff", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {};
      for (let i = 0; i < 13; i++) {
        fieldStates[`field${i}`] = { hidden: false };
      }
      expect(IsExpandVisible(fieldStates)).toBe(true);
    });

    it("returns false when visible fields are at or below the default cutoff", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {};
      for (let i = 0; i < 12; i++) {
        fieldStates[`field${i}`] = { hidden: false };
      }
      expect(IsExpandVisible(fieldStates)).toBe(false);
    });

    it("does not count hidden fields", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {};
      for (let i = 0; i < 20; i++) {
        fieldStates[`field${i}`] = { hidden: true };
      }
      expect(IsExpandVisible(fieldStates)).toBe(false);
    });

    it("uses custom expandCutoffCount when provided", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        field1: { hidden: false },
        field2: { hidden: false },
        field3: { hidden: false },
      };
      expect(IsExpandVisible(fieldStates, 2)).toBe(true);
      expect(IsExpandVisible(fieldStates, 3)).toBe(false);
    });
  });

  describe("GetConfirmInputModalProps", () => {
    it("builds confirmInput props from dirty fields with confirm dependencies", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        trigger: { dependentFields: ["confirmed"] },
        confirmed: { confirmInput: true },
      };

      const result = GetConfirmInputModalProps(["trigger"], fieldStates);

      expect(result.confirmInputsTriggeredBy).toBe("trigger");
      expect(result.dependentFieldNames).toEqual(["confirmed"]);
      expect(result.otherDirtyFields).toEqual([]);
    });

    it("includes other dirty fields that are not the trigger or confirm dependents", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        trigger: { dependentFields: ["confirmed"] },
        confirmed: { confirmInput: true },
        otherField: {},
      };

      const result = GetConfirmInputModalProps(["trigger", "otherField"], fieldStates);

      expect(result.confirmInputsTriggeredBy).toBe("trigger");
      expect(result.dependentFieldNames).toEqual(["confirmed"]);
      expect(result.otherDirtyFields).toEqual(["otherField"]);
    });

    it("returns empty props when no dirty fields have confirm dependencies", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        fieldA: { dependentFields: ["fieldB"] },
        fieldB: { confirmInput: false },
      };

      const result = GetConfirmInputModalProps(["fieldA"], fieldStates);

      expect(result.confirmInputsTriggeredBy).toBeUndefined();
      expect(result.dependentFieldNames).toBeUndefined();
    });

    it("collects multiple confirm dependents from a single trigger", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        trigger: { dependentFields: ["confirm1", "confirm2"] },
        confirm1: { confirmInput: true },
        confirm2: { confirmInput: true },
      };

      const result = GetConfirmInputModalProps(["trigger"], fieldStates);

      expect(result.confirmInputsTriggeredBy).toBe("trigger");
      expect(result.dependentFieldNames).toEqual(["confirm1", "confirm2"]);
    });
  });

  describe("GetComputedValuesOnDirtyFields", () => {
    it("finds computed values on dependents of dirty fields", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { dependentFields: ["modifiedDate"] },
        modifiedDate: { computedValue: "$fn.setDate()" },
      };

      const result = GetComputedValuesOnDirtyFields(["name"], fieldStates);

      expect(result).toEqual([
        { fieldName: "modifiedDate", expression: "$fn.setDate()" },
      ]);
    });

    it("excludes dependents that are themselves dirty", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { dependentFields: ["modifiedDate"] },
        modifiedDate: { computedValue: "$fn.setDate()" },
      };

      const result = GetComputedValuesOnDirtyFields(["name", "modifiedDate"], fieldStates);
      expect(result).toEqual([]);
    });

    it("excludes dependents with computeOnCreateOnly flag", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { dependentFields: ["createdDate"] },
        createdDate: {
          computedValue: "$fn.setDate()",
          computeOnCreateOnly: true,
        },
      };

      const result = GetComputedValuesOnDirtyFields(["name"], fieldStates);
      expect(result).toEqual([]);
    });

    it("excludes dependents with no computedValue", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: { dependentFields: ["otherField"] },
        otherField: {},
      };

      const result = GetComputedValuesOnDirtyFields(["name"], fieldStates);
      expect(result).toEqual([]);
    });

    it("returns empty array when no dirty fields have dependents with computed values", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        name: {},
      };

      const result = GetComputedValuesOnDirtyFields(["name"], fieldStates);
      expect(result).toEqual([]);
    });
  });

  describe("GetComputedValuesOnCreate", () => {
    it("finds computeOnCreateOnly computed values", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        createdDate: {
          computedValue: "$fn.setDate()",
          computeOnCreateOnly: true,
        },
        modifiedDate: {
          computedValue: "$fn.setDate()",
        },
        name: {},
      };

      const result = GetComputedValuesOnCreate(fieldStates);

      expect(result).toEqual([
        { fieldName: "createdDate", expression: "$fn.setDate()" },
      ]);
    });

    it("returns empty array when no fields have computeOnCreateOnly", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        modifiedDate: { computedValue: "$fn.setDate()" },
        name: {},
      };

      const result = GetComputedValuesOnCreate(fieldStates);
      expect(result).toEqual([]);
    });
  });

  describe("CheckFieldValidationRules", () => {
    it("returns undefined when all validations pass", () => {
      const state: IRuntimeFieldState = {
        validate: [{ name: "email" }],
      };
      const result = CheckFieldValidationRules("user@example.com", "email", {}, state);
      expect(result).toBeUndefined();
    });

    it("returns the error message when a validation fails", () => {
      const state: IRuntimeFieldState = {
        validate: [{ name: "email" }],
      };
      const result = CheckFieldValidationRules("not-an-email", "email", {}, state);
      expect(result).toBe("Invalid email address");
    });

    it("returns undefined when validate array is empty", () => {
      const state: IRuntimeFieldState = { validate: [] };
      const result = CheckFieldValidationRules("anything", "field", {}, state);
      expect(result).toBeUndefined();
    });

    it("returns undefined when validate is undefined", () => {
      const state: IRuntimeFieldState = {};
      const result = CheckFieldValidationRules("anything", "field", {}, state);
      expect(result).toBeUndefined();
    });
  });

  describe("ShowField", () => {
    it("returns true when filterText is undefined (no filter)", () => {
      expect(ShowField(undefined, "anything", "Any Label")).toBe(true);
    });

    it("returns true when filterText is empty string", () => {
      expect(ShowField("", "anything", "Any Label")).toBe(true);
    });

    it("returns true when value contains filterText (case-insensitive)", () => {
      expect(ShowField("test", "Test Value", "Label")).toBe(true);
      expect(ShowField("TEST", "test value", "Label")).toBe(true);
    });

    it("returns true when label contains filterText (case-insensitive)", () => {
      expect(ShowField("label", "some value", "My Label")).toBe(true);
      expect(ShowField("LABEL", "some value", "my label")).toBe(true);
    });

    it("returns false when neither value nor label match", () => {
      expect(ShowField("xyz", "abc", "def")).toBe(false);
    });

    it("handles object values by serializing to JSON", () => {
      expect(ShowField("hello", { greeting: "hello world" }, "Label")).toBe(true);
    });

    it("handles array values by serializing to JSON", () => {
      expect(ShowField("item1", ["item1", "item2"], "Label")).toBe(true);
    });

    it("handles null/undefined value gracefully", () => {
      expect(ShowField("test", undefined, "test label")).toBe(true);
      expect(ShowField("test", null, "test label")).toBe(true);
    });
  });

  describe("GetFieldsToRender", () => {
    const fieldOrder = ["field1", "field2", "field3", "field4", "field5"];
    const fieldStates: Record<string, IRuntimeFieldState> = {
      field1: { hidden: false },
      field2: { hidden: false },
      field3: { hidden: true },
      field4: { hidden: false },
      field5: { hidden: false },
    };

    it("returns all fields as not softHidden when fieldRenderLimit is 0 (no limit)", () => {
      const result = GetFieldsToRender(0, fieldOrder, fieldStates);

      expect(result).toHaveLength(5);
      result.forEach((field) => {
        expect(field.softHidden).toBe(false);
      });
    });

    it("respects field render limit and soft-hides fields beyond it", () => {
      const result = GetFieldsToRender(2, fieldOrder, fieldStates);

      expect(result[0]).toEqual({ fieldName: "field1", softHidden: false });
      expect(result[1]).toEqual({ fieldName: "field2", softHidden: false });
      // field3 is hidden and skipped
      expect(result[2]).toEqual({ fieldName: "field4", softHidden: true });
      expect(result[3]).toEqual({ fieldName: "field5", softHidden: true });
    });

    it("skips hidden fields when limit is set", () => {
      const result = GetFieldsToRender(10, fieldOrder, fieldStates);
      const fieldNames = result.map((f) => f.fieldName);
      expect(fieldNames).not.toContain("field3");
      expect(result).toHaveLength(4);
    });

    it("handles empty field order", () => {
      const result = GetFieldsToRender(5, [], fieldStates);
      expect(result).toEqual([]);
    });

    it("returns all fields without limit (fieldRenderLimit = 0)", () => {
      const result = GetFieldsToRender(0, ["a", "b", "c"]);

      expect(result).toEqual([
        { fieldName: "a", softHidden: false },
        { fieldName: "b", softHidden: false },
        { fieldName: "c", softHidden: false },
      ]);
    });
  });

  describe("CheckDefaultValues", () => {
    it("calls setValue for fields with defaultValue when form value is null", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: { defaultValue: "Open", hidden: false },
        name: { hidden: false },
      };

      const formValues: IEntityData = { status: null, name: "existing" };
      const setValue = vi.fn();

      CheckDefaultValues(fieldStates, formValues, setValue);

      expect(setValue).toHaveBeenCalledTimes(1);
      expect(setValue).toHaveBeenCalledWith("status", "Open", { shouldDirty: true });
    });

    it("does not call setValue when form value already exists", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: { defaultValue: "Open", hidden: false },
      };
      const formValues: IEntityData = { status: "Active" };
      const setValue = vi.fn();

      CheckDefaultValues(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does not call setValue when field is hidden", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: { defaultValue: "Open", hidden: true },
      };
      const formValues: IEntityData = { status: null };
      const setValue = vi.fn();

      CheckDefaultValues(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does not call setValue when defaultValue is null/undefined", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: { defaultValue: undefined, hidden: false },
      };
      const formValues: IEntityData = { status: null };
      const setValue = vi.fn();

      CheckDefaultValues(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does nothing when fieldStates is empty", () => {
      const setValue = vi.fn();
      CheckDefaultValues({}, { status: null }, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does nothing when formValues is empty", () => {
      const setValue = vi.fn();
      CheckDefaultValues(
        { status: { defaultValue: "Open", hidden: false } },
        {},
        setValue
      );
      expect(setValue).not.toHaveBeenCalled();
    });
  });

  describe("CheckValidDropdownOptions", () => {
    it("clears dropdown value when it is not in options", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: {
          type: "Dropdown",
          options: [
            { value: "Active", label: "Active" },
            { value: "Closed", label: "Closed" },
          ],
        },
      };
      const formValues: IEntityData = { status: "Invalid" };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);

      expect(setValue).toHaveBeenCalledWith("status", null, { shouldDirty: false });
    });

    it("does not clear dropdown value when it is in options", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: {
          type: "Dropdown",
          options: [
            { value: "Active", label: "Active" },
            { value: "Closed", label: "Closed" },
          ],
        },
      };
      const formValues: IEntityData = { status: "Active" };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("filters multiselect values to valid options", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        tags: {
          type: "Multiselect",
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        },
      };
      const formValues: IEntityData = { tags: ["a", "b", "invalid"] };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);
      expect(setValue).toHaveBeenCalledWith("tags", ["a", "b"], { shouldDirty: false });
    });

    it("does not modify multiselect when all values are valid", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        tags: {
          type: "Multiselect",
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        },
      };
      const formValues: IEntityData = { tags: ["a", "b"] };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does nothing when fieldStates is empty", () => {
      const setValue = vi.fn();
      CheckValidDropdownOptions({}, { status: "X" }, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("does nothing when formValues is empty", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: { type: "Dropdown", options: [] },
      };
      const setValue = vi.fn();
      CheckValidDropdownOptions(fieldStates, {}, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("handles null form value for dropdown", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: {
          type: "Dropdown",
          options: [{ value: "Active", label: "Active" }],
        },
      };
      const formValues: IEntityData = { status: null };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);
      expect(setValue).not.toHaveBeenCalled();
    });

    it("handles StatusDropdown type", () => {
      const fieldStates: Record<string, IRuntimeFieldState> = {
        status: {
          type: "StatusDropdown",
          options: [{ value: "Open", label: "Open" }],
        },
      };
      const formValues: IEntityData = { status: "Missing" };
      const setValue = vi.fn();

      CheckValidDropdownOptions(fieldStates, formValues, setValue);
      expect(setValue).toHaveBeenCalledWith("status", null, { shouldDirty: false });
    });
  });

  describe("SortOptions", () => {
    it("sorts options alphabetically by label", () => {
      const options: IOption[] = [
        { value: "C", label: "Charlie" },
        { value: "A", label: "Alpha" },
        { value: "B", label: "Bravo" },
      ];
      const result = SortOptions(options);
      expect(result[0].label).toBe("Alpha");
      expect(result[1].label).toBe("Bravo");
      expect(result[2].label).toBe("Charlie");
    });

    it("returns empty array for empty input", () => {
      const result = SortOptions([]);
      expect(result).toEqual([]);
    });

    it("does not mutate the original array", () => {
      const options: IOption[] = [
        { value: "B", label: "Bravo" },
        { value: "A", label: "Alpha" },
      ];
      const original = [...options];
      SortOptions(options);
      expect(options).toEqual(original);
    });
  });

  describe("ExecuteComputedValue", () => {
    it("evaluates expression via the expression engine", () => {
      const result = ExecuteComputedValue(
        "$values.a + $values.b",
        { a: 3, b: 7 }
      );
      expect(result).toBe(10);
    });

    it("calls value function via $fn syntax", () => {
      const result = ExecuteComputedValue("$fn.setDate()", {}, "createdDate");
      expect(result).toBeInstanceOf(Date);
    });

    it("returns undefined for unknown value function", () => {
      const result = ExecuteComputedValue("$fn.unknownFunction()", {});
      expect(result).toBeUndefined();
    });
  });

  describe("InitOnEditFormState", () => {
    it("returns formState and initEntityData", () => {
      const fields: Record<string, IFieldConfig> = {
        name: { type: "Textbox", required: true, label: "Name" },
      };
      const defaultValues: IEntityData = { name: "Test" };
      const mockInitFormState = vi.fn().mockReturnValue({
        fieldStates: { name: { type: "Textbox", required: true } },
        fieldOrder: ["name"],
      });

      const result = InitOnEditFormState(
        "testConfig",
        fields,
        defaultValues,
        false,
        mockInitFormState
      );

      expect(result.initEntityData).toBe(defaultValues);
      expect(result.formState).toBeDefined();
      expect(mockInitFormState).toHaveBeenCalledWith(
        "testConfig", defaultValues, fields, false
      );
    });

    it("passes areAllFieldsReadonly flag", () => {
      const fields: Record<string, IFieldConfig> = {
        name: { type: "Textbox", label: "Name" },
      };
      const defaultValues: IEntityData = { name: "Test" };
      const mockInitFormState = vi.fn().mockReturnValue({
        fieldStates: {},
        fieldOrder: [],
      });

      InitOnEditFormState("config", fields, defaultValues, true, mockInitFormState);

      expect(mockInitFormState).toHaveBeenCalledWith(
        "config", defaultValues, fields, true
      );
    });
  });
});
