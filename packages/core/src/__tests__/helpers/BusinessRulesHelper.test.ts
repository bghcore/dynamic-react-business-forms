import { describe, it, expect } from "vitest";
import {
  ProcessAllBusinessRules,
  ProcessFieldBusinessRule,
  ProcessFieldOrderDepencendies,
  GetFieldOrder,
  ProcessPreviousFieldBusinessRule,
  RevertFieldBusinessRule,
  ProcessComboFieldBusinessRule,
  ProcessDropdownOptions,
  ProcessFieldDropdownValues,
  CombineBusinessRules,
  GetFieldValue,
  SameFieldOrder,
  GetDefaultBusinessRules,
} from "../../helpers/BusinessRulesHelper";
import { IConfigBusinessRules } from "../../types/IConfigBusinessRules";
import { IBusinessRule } from "../../types/IBusinessRule";
import { IFieldConfig } from "../../types/IFieldConfig";
import { IDropdownOption } from "../../types/IDropdownOption";
import { Dictionary, IEntityData } from "../../utils";

import {
  simpleTextFieldConfigs,
  singleDependencyConfigs,
  comboDependencyConfigs,
  dropdownDependencyConfigs,
  orderDependencyConfigs,
  hiddenReadonlyConfigs,
  valueFunctionConfigs,
  validationConfigs,
  confirmInputConfigs,
  componentSwapConfigs,
  deprecatedDropdownConfigs,
  fragmentConfigs,
  allReadonlyConfigs,
  nestedOrderDependencyConfigs,
  defaultValueConfigs,
} from "../__fixtures__/fieldConfigs";

import {
  emptyEntity,
  simpleEntity,
  activeStatusEntity,
  inactiveStatusEntity,
  comboMetEntity,
  comboNotMetEntity,
  usCountryEntity,
  caCountryEntity,
  bugTypeEntity,
  featureTypeEntity,
  nestedEntity,
  allFieldsEntity,
  nestedOrderEntity,
  confirmTriggerEntity,
  simpleModEntity,
  advancedModeEntity,
} from "../__fixtures__/entityData";

// ---------------------------------------------------------------------------
// GetFieldValue
// ---------------------------------------------------------------------------
describe("GetFieldValue", () => {
  it("returns empty string for empty entity", () => {
    expect(GetFieldValue(emptyEntity, "name")).toBe("");
  });

  it("returns empty string for null entity", () => {
    expect(GetFieldValue(null as unknown as IEntityData, "name")).toBe("");
  });

  it("returns value for a simple field path", () => {
    expect(GetFieldValue(simpleEntity, "name")).toBe("Test Item");
  });

  it("returns value for another simple field", () => {
    expect(GetFieldValue(simpleEntity, "description")).toBe("A test description");
  });

  it("returns undefined-ish for a field that does not exist", () => {
    const result = GetFieldValue(simpleEntity, "nonExistent");
    expect(result).toBeUndefined();
  });

  it("returns value for a dotted (nested) path", () => {
    expect(GetFieldValue(nestedEntity, "Parent.name")).toBe("Parent Item");
  });

  it("returns value for a two-level dotted path", () => {
    expect(GetFieldValue(nestedEntity, "Parent.id")).toBe("parent-1");
  });

  it("returns value from non-nested context when intermediate path segment is missing", () => {
    const result = GetFieldValue(simpleEntity, "Parent.name");
    // Parent doesn't exist on simpleEntity, but currentEntityData stays as simpleEntity
    // and the last segment "name" resolves to simpleEntity.name
    expect(result).toBe("Test Item");
  });
});

// ---------------------------------------------------------------------------
// SameFieldOrder
// ---------------------------------------------------------------------------
describe("SameFieldOrder", () => {
  it("returns true when both arrays are identical", () => {
    expect(SameFieldOrder(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
  });

  it("returns false when order differs", () => {
    expect(SameFieldOrder(["a", "c", "b"], ["a", "b", "c"])).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(SameFieldOrder(["a", "b"], ["a", "b", "c"])).toBe(false);
  });

  it("returns true for two empty arrays", () => {
    expect(SameFieldOrder([], [])).toBe(true);
  });

  it("returns false when first is longer than second", () => {
    expect(SameFieldOrder(["a", "b", "c"], ["a", "b"])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GetDefaultBusinessRules
// ---------------------------------------------------------------------------
describe("GetDefaultBusinessRules", () => {
  it("creates a rule entry for every field config key", () => {
    const rules = GetDefaultBusinessRules(simpleTextFieldConfigs);
    expect(Object.keys(rules)).toEqual(["name", "description"]);
  });

  it("sets component from field config", () => {
    const rules = GetDefaultBusinessRules(simpleTextFieldConfigs);
    expect(rules.name.component).toBe("Textbox");
  });

  it("sets required from field config", () => {
    const rules = GetDefaultBusinessRules(simpleTextFieldConfigs);
    expect(rules.name.required).toBe(true);
    expect(rules.description.required).toBe(false);
  });

  it("sets hidden to true for DynamicFragment component", () => {
    const rules = GetDefaultBusinessRules(fragmentConfigs);
    expect(rules.fragment.hidden).toBe(true);
  });

  it("preserves hidden flag from field config", () => {
    const rules = GetDefaultBusinessRules(hiddenReadonlyConfigs);
    expect(rules.secret.hidden).toBe(true);
    expect(rules.name.hidden).toBeFalsy();
  });

  it("sets readOnly from isReadonly field config", () => {
    const rules = GetDefaultBusinessRules(hiddenReadonlyConfigs);
    expect(rules.id.readOnly).toBe(true);
    expect(rules.name.readOnly).toBeUndefined();
  });

  it("overrides readOnly when areAllFieldsReadonly is true", () => {
    const rules = GetDefaultBusinessRules(allReadonlyConfigs, true);
    expect(rules.name.readOnly).toBe(true);
    expect(rules.status.readOnly).toBe(true);
  });

  it("sets valueFunction from isValueFunction + value", () => {
    const rules = GetDefaultBusinessRules(valueFunctionConfigs);
    expect(rules.createdDate.valueFunction).toBe("setDate");
    expect(rules.modifiedDate.valueFunction).toBe("setDate");
    expect(rules.name.valueFunction).toBeUndefined();
  });

  it("sets onlyOnCreate and onlyOnCreateValue", () => {
    const rules = GetDefaultBusinessRules(valueFunctionConfigs);
    expect(rules.createdDate.onlyOnCreate).toBe(true);
    // isValueFunction is true so onlyOnCreateValue should be undefined (skipped)
    expect(rules.createdDate.onlyOnCreateValue).toBeUndefined();
  });

  it("sets validations array from field config", () => {
    const rules = GetDefaultBusinessRules(validationConfigs);
    expect(rules.email.validations).toEqual(["EmailValidation"]);
    expect(rules.phone.validations).toEqual(["PhoneNumberValidation"]);
  });

  it("populates dependentFields from dependencies", () => {
    const rules = GetDefaultBusinessRules(singleDependencyConfigs);
    expect(rules.status.dependentFields).toContain("priority");
  });

  it("populates dependsOnFields (reverse of dependentFields)", () => {
    const rules = GetDefaultBusinessRules(singleDependencyConfigs);
    expect(rules.priority.dependsOnFields).toContain("status");
  });

  it("returns empty orderDependentFields for top-level array order deps", () => {
    const rules = GetDefaultBusinessRules(orderDependencyConfigs);
    // RecursiveGetOrderDependentFields only tracks intermediate field names
    // in nested (non-array) order deps. Top-level arrays yield empty.
    expect(rules.type.orderDependentFields).toHaveLength(0);
  });

  it("sets pivotalRootField for fields with orderDependencies", () => {
    const rules = GetDefaultBusinessRules(orderDependencyConfigs);
    expect(rules.type.pivotalRootField).toBe("type");
  });

  it("does not propagate pivotalRootField when orderDependentFields is empty", () => {
    const rules = GetDefaultBusinessRules(orderDependencyConfigs);
    // Since orderDependentFields is empty for top-level array deps,
    // the second pass doesn't set pivotalRootField on other fields
    expect(rules.severity.pivotalRootField).toBeUndefined();
    expect(rules.steps.pivotalRootField).toBeUndefined();
  });

  it("populates orderDependentFields for nested order deps", () => {
    const rules = GetDefaultBusinessRules(nestedOrderDependencyConfigs);
    // Nested order deps: category -> A -> { subcategory: { A1: [...], A2: [...] } }
    // RecursiveGetOrderDependentFields finds "subcategory" as an intermediate field
    expect(rules.category.orderDependentFields).toContain("subcategory");
  });

  it("populates comboDependsOnFields from dependencyRules.rules", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    expect(rules.notes.comboDependsOnFields).toContain("status");
    expect(rules.notes.comboDependsOnFields).toContain("type");
  });

  it("populates comboDependentFields (reverse of comboDependsOnFields)", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    expect(rules.status.comboDependentFields).toContain("notes");
    expect(rules.type.comboDependentFields).toContain("notes");
  });

  it("populates dependsOnDropdownFields from dropdownDependencies", () => {
    const rules = GetDefaultBusinessRules(dropdownDependencyConfigs);
    // GetDependsOnDropDownFields reads country.dropdownDependencies keys: US->{region}, CA->{region}
    // So country.dependsOnDropdownFields = ["region"]
    expect(rules.country.dependsOnDropdownFields).toContain("region");
  });

  it("populates dependentDropdownFields via reverse mapping", () => {
    const rules = GetDefaultBusinessRules(dropdownDependencyConfigs);
    // In the second pass, country.dependsOnDropdownFields.forEach("region") ->
    // region.dependentDropdownFields.push("country")
    expect(rules.region.dependentDropdownFields).toContain("country");
  });

  it("sets dropdownOptions from field config", () => {
    const rules = GetDefaultBusinessRules(singleDependencyConfigs);
    expect(rules.status.dropdownOptions).toHaveLength(2);
    expect(rules.status.dropdownOptions![0].key).toBe("Active");
  });

  it("sets confirmInput from field config", () => {
    const rules = GetDefaultBusinessRules(confirmInputConfigs);
    expect(rules.confirmed.confirmInput).toBe(false);
  });

  it("sets defaultValue from field config", () => {
    const rules = GetDefaultBusinessRules(defaultValueConfigs);
    expect(rules.status.defaultValue).toBe("Open");
  });
});

// ---------------------------------------------------------------------------
// ProcessFieldBusinessRule
// ---------------------------------------------------------------------------
describe("ProcessFieldBusinessRule", () => {
  it("applies rule when field value matches dependency key", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const result = ProcessFieldBusinessRule("status", "Active", currentRules, singleDependencyConfigs);
    expect(result.fieldRules.priority).toBeDefined();
    expect(result.fieldRules.priority.required).toBe(true);
  });

  it("does not apply rule when field value does not match any dependency key", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const result = ProcessFieldBusinessRule("status", "Unknown", currentRules, singleDependencyConfigs);
    expect(Object.keys(result.fieldRules)).toHaveLength(0);
  });

  it("applies hidden rule from Inactive dependency", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const result = ProcessFieldBusinessRule("status", "Inactive", currentRules, singleDependencyConfigs);
    expect(result.fieldRules.priority.hidden).toBe(true);
    expect(result.fieldRules.priority.required).toBe(false);
  });

  it("applies rule only to targetField when specified", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const result = ProcessFieldBusinessRule(
      "status",
      "Active",
      currentRules,
      singleDependencyConfigs,
      undefined,
      "priority"
    );
    expect(result.fieldRules.priority).toBeDefined();
    expect(result.fieldRules.priority.required).toBe(true);
  });

  it("applies component swap from dependency", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(componentSwapConfigs),
      order: ["mode", "detail"],
    };
    const result = ProcessFieldBusinessRule("mode", "advanced", currentRules, componentSwapConfigs);
    expect(result.fieldRules.detail.component).toBe("PopOutEditor");
  });

  it("merges pending business rules when provided", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const pending: Dictionary<IBusinessRule> = {
      priority: { readOnly: true },
    };
    const result = ProcessFieldBusinessRule("status", "Active", currentRules, singleDependencyConfigs, pending);
    expect(result.fieldRules.priority.required).toBe(true);
    // readOnly should come from pending since updatedBusinessRule doesn't set isReadonly
    expect(result.fieldRules.priority.readOnly).toBe(true);
  });

  it("returns empty fieldRules when field has no dependencies", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(simpleTextFieldConfigs),
      order: ["name", "description"],
    };
    const result = ProcessFieldBusinessRule("name", "anything", currentRules, simpleTextFieldConfigs);
    expect(Object.keys(result.fieldRules)).toHaveLength(0);
  });

  it("applies confirmInput dependency rule", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(confirmInputConfigs),
      order: ["trigger", "confirmed"],
    };
    const result = ProcessFieldBusinessRule("trigger", "Yes", currentRules, confirmInputConfigs);
    expect(result.fieldRules.confirmed.confirmInput).toBe(true);
  });

  it("applies valueFunction dependency rule", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(valueFunctionConfigs),
      order: ["createdDate", "modifiedDate", "name"],
    };
    const result = ProcessFieldBusinessRule("name", "test", currentRules, valueFunctionConfigs);
    expect(result.fieldRules.modifiedDate.valueFunction).toBe("setDate");
  });
});

// ---------------------------------------------------------------------------
// RevertFieldBusinessRule
// ---------------------------------------------------------------------------
describe("RevertFieldBusinessRule", () => {
  it("reverts affected fields to their fieldConfig defaults", () => {
    let currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    // First apply Active rule
    currentRules = CombineBusinessRules(
      currentRules,
      ProcessFieldBusinessRule("status", "Active", currentRules, singleDependencyConfigs)
    );
    expect(currentRules.fieldRules.priority.required).toBe(true);

    // Now revert the Active rule
    const reverted = RevertFieldBusinessRule("status", "Active", currentRules, singleDependencyConfigs);
    expect(reverted.fieldRules.priority).toBeDefined();
    expect(reverted.fieldRules.priority.required).toBe(false); // back to fieldConfig default
  });

  it("preserves component from fieldConfig on revert", () => {
    let currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(componentSwapConfigs),
      order: ["mode", "detail"],
    };
    currentRules = CombineBusinessRules(
      currentRules,
      ProcessFieldBusinessRule("mode", "advanced", currentRules, componentSwapConfigs)
    );
    expect(currentRules.fieldRules.detail.component).toBe("PopOutEditor");

    const reverted = RevertFieldBusinessRule("mode", "advanced", currentRules, componentSwapConfigs);
    expect(reverted.fieldRules.detail.component).toBe("Textbox");
  });

  it("returns empty fieldRules when previous value has no dependencies", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(singleDependencyConfigs),
      order: ["status", "priority"],
    };
    const reverted = RevertFieldBusinessRule("status", "Unknown", currentRules, singleDependencyConfigs);
    expect(Object.keys(reverted.fieldRules)).toHaveLength(0);
  });

  it("preserves dropdownOptions from current business rules on revert", () => {
    const configs: Dictionary<IFieldConfig> = {
      trigger: {
        component: "Dropdown",
        required: true,
        label: "Trigger",
        dropdownOptions: [
          { key: "A", text: "A" },
          { key: "B", text: "B" },
        ],
        dependencies: {
          A: {
            target: { required: true },
          },
        },
      },
      target: {
        component: "Dropdown",
        required: false,
        label: "Target",
        dropdownOptions: [
          { key: "X", text: "X" },
        ],
      },
    };
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(configs),
      order: ["trigger", "target"],
    };
    const reverted = RevertFieldBusinessRule("trigger", "A", currentRules, configs);
    expect(reverted.fieldRules.target.dropdownOptions).toEqual([{ key: "X", text: "X" }]);
  });

  it("reverts confirmInput to fieldConfig default", () => {
    let currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(confirmInputConfigs),
      order: ["trigger", "confirmed"],
    };
    currentRules = CombineBusinessRules(
      currentRules,
      ProcessFieldBusinessRule("trigger", "Yes", currentRules, confirmInputConfigs)
    );
    expect(currentRules.fieldRules.confirmed.confirmInput).toBe(true);

    const reverted = RevertFieldBusinessRule("trigger", "Yes", currentRules, confirmInputConfigs);
    expect(reverted.fieldRules.confirmed.confirmInput).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ProcessPreviousFieldBusinessRule
// ---------------------------------------------------------------------------
describe("ProcessPreviousFieldBusinessRule", () => {
  it("re-applies rules from other dependsOn fields after revert", () => {
    // Create configs where two fields both affect a third
    const configs: Dictionary<IFieldConfig> = {
      fieldA: {
        component: "Dropdown",
        required: true,
        label: "Field A",
        dropdownOptions: [{ key: "X", text: "X" }, { key: "Y", text: "Y" }],
        dependencies: {
          X: { target: { required: true } },
        },
      },
      fieldB: {
        component: "Dropdown",
        required: true,
        label: "Field B",
        dropdownOptions: [{ key: "P", text: "P" }, { key: "Q", text: "Q" }],
        dependencies: {
          P: { target: { hidden: true } },
        },
      },
      target: {
        component: "Textbox",
        required: false,
        label: "Target",
      },
    };

    const defaultRules = GetDefaultBusinessRules(configs);
    let currentRules: IConfigBusinessRules = {
      fieldRules: defaultRules,
      order: ["fieldA", "fieldB", "target"],
    };

    // Both fieldA=X and fieldB=P were applied
    currentRules = CombineBusinessRules(
      currentRules,
      ProcessFieldBusinessRule("fieldA", "X", currentRules, configs)
    );
    currentRules = CombineBusinessRules(
      currentRules,
      ProcessFieldBusinessRule("fieldB", "P", currentRules, configs)
    );
    expect(currentRules.fieldRules.target.required).toBe(true);
    expect(currentRules.fieldRules.target.hidden).toBe(true);

    // Now fieldA changes from X to Y -- we revert X, then re-apply fieldB's rule on target
    const entityData: IEntityData = { fieldA: "Y", fieldB: "P", target: "" };
    const pending: Dictionary<IBusinessRule> = {};
    const result = ProcessPreviousFieldBusinessRule(
      "fieldA",
      "X",
      currentRules,
      configs,
      entityData,
      pending
    );
    // fieldB=P still applies hidden:true on target
    expect(result.fieldRules.target?.hidden).toBe(true);
  });

  it("returns empty fieldRules when there are no previous dependencies", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(simpleTextFieldConfigs),
      order: ["name", "description"],
    };
    const result = ProcessPreviousFieldBusinessRule(
      "name",
      "old",
      currentRules,
      simpleTextFieldConfigs,
      simpleEntity,
      {}
    );
    expect(Object.keys(result.fieldRules)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ProcessComboFieldBusinessRule
// ---------------------------------------------------------------------------
describe("ProcessComboFieldBusinessRule", () => {
  it("applies combo rule when all conditions are met", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    const result = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      comboDependencyConfigs.notes,
      comboMetEntity
    );
    expect(result.notes).toBeDefined();
    expect(result.notes.required).toBe(true);
  });

  it("does not apply combo rule when not all conditions are met", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    const result = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      comboDependencyConfigs.notes,
      comboNotMetEntity
    );
    expect(result.notes).toBeDefined();
    // Should revert to fieldConfig defaults
    expect(result.notes.required).toBe(false);
  });

  it("returns empty object when field has no dependencyRules", () => {
    const rules = GetDefaultBusinessRules(simpleTextFieldConfigs);
    const result = ProcessComboFieldBusinessRule(
      "name",
      rules.name,
      simpleTextFieldConfigs.name,
      simpleEntity
    );
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("applies combo rule with pending business rule", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    const pending: IBusinessRule = { readOnly: true };
    const result = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      comboDependencyConfigs.notes,
      comboMetEntity,
      pending
    );
    expect(result.notes.required).toBe(true);
    expect(result.notes.readOnly).toBe(true);
  });

  it("reverts to fieldConfig defaults when combo conditions become unmet", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    // First ensure rule is met
    const metResult = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      comboDependencyConfigs.notes,
      comboMetEntity
    );
    expect(metResult.notes.required).toBe(true);

    // Now unmet
    const unmetResult = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      comboDependencyConfigs.notes,
      { status: "Closed", type: "Bug", notes: "" }
    );
    expect(unmetResult.notes.required).toBe(false);
  });

  it("returns empty when fieldConfig is undefined", () => {
    const rules = GetDefaultBusinessRules(comboDependencyConfigs);
    const result = ProcessComboFieldBusinessRule(
      "notes",
      rules.notes,
      undefined as unknown as IFieldConfig,
      comboMetEntity
    );
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ProcessDropdownOptions
// ---------------------------------------------------------------------------
describe("ProcessDropdownOptions", () => {
  it("sorts dropdown options alphabetically by default", () => {
    const options: IDropdownOption[] = [
      { key: "C", text: "Charlie" },
      { key: "A", text: "Alpha" },
      { key: "B", text: "Bravo" },
    ];
    const config: IFieldConfig = { component: "Dropdown", label: "Test" };
    const result = ProcessDropdownOptions(options, config);
    expect(result[0].text).toBe("Alpha");
    expect(result[1].text).toBe("Bravo");
    expect(result[2].text).toBe("Charlie");
  });

  it("does not sort when disableAlphabeticSort is true", () => {
    const options: IDropdownOption[] = [
      { key: "C", text: "Charlie" },
      { key: "A", text: "Alpha" },
      { key: "B", text: "Bravo" },
    ];
    const config: IFieldConfig = {
      component: "Dropdown",
      label: "Test",
      meta: { disableAlphabeticSort: true },
    };
    const result = ProcessDropdownOptions(options, config);
    expect(result[0].text).toBe("Charlie");
    expect(result[1].text).toBe("Alpha");
    expect(result[2].text).toBe("Bravo");
  });

  it("adds icon data from meta.data", () => {
    const options: IDropdownOption[] = [
      { key: "1", text: "Option 1" },
      { key: "2", text: "Option 2" },
    ];
    const config: IFieldConfig = {
      component: "Dropdown",
      label: "Test",
      meta: {
        disableAlphabeticSort: true,
        data: [
          { icon: "Star", iconTitle: "Starred" },
          { icon: "Flag", iconTitle: "Flagged" },
        ],
      },
    };
    const result = ProcessDropdownOptions(options, config);
    expect(result[0].data).toEqual({ iconName: "Star", iconTitle: "Starred" });
    expect(result[1].data).toEqual({ iconName: "Flag", iconTitle: "Flagged" });
  });

  it("returns empty array for empty input", () => {
    const config: IFieldConfig = { component: "Dropdown", label: "Test" };
    const result = ProcessDropdownOptions([], config);
    expect(result).toEqual([]);
  });

  it("sets data to undefined when meta.data has no entry at index", () => {
    const options: IDropdownOption[] = [
      { key: "1", text: "Option 1" },
      { key: "2", text: "Option 2" },
    ];
    const config: IFieldConfig = {
      component: "Dropdown",
      label: "Test",
      meta: {
        disableAlphabeticSort: true,
        data: [{ icon: "Star", iconTitle: "Starred" }],
      },
    };
    const result = ProcessDropdownOptions(options, config);
    expect(result[0].data).toEqual({ iconName: "Star", iconTitle: "Starred" });
    expect(result[1].data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ProcessFieldDropdownValues
// ---------------------------------------------------------------------------
describe("ProcessFieldDropdownValues", () => {
  it("filters dropdown options for dependent field based on source value (US)", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(dropdownDependencyConfigs),
      order: ["country", "region"],
    };
    const result = ProcessFieldDropdownValues(
      "country",
      usCountryEntity,
      currentRules,
      dropdownDependencyConfigs,
      currentRules.fieldRules
    );
    expect(result.fieldRules.region).toBeDefined();
    const regionKeys = result.fieldRules.region.dropdownOptions!.map((o) => o.key);
    expect(regionKeys).toContain("Central");
    expect(regionKeys).toContain("East");
    expect(regionKeys).toContain("West");
  });

  it("filters dropdown options for CA country", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(dropdownDependencyConfigs),
      order: ["country", "region"],
    };
    const result = ProcessFieldDropdownValues(
      "country",
      caCountryEntity,
      currentRules,
      dropdownDependencyConfigs,
      currentRules.fieldRules
    );
    expect(result.fieldRules.region).toBeDefined();
    const regionKeys = result.fieldRules.region.dropdownOptions!.map((o) => o.key);
    expect(regionKeys).toContain("BC");
    expect(regionKeys).toContain("Ontario");
    expect(regionKeys).toContain("Quebec");
  });

  it("returns empty fieldRules when field has no dropdownDependencies", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(simpleTextFieldConfigs),
      order: ["name", "description"],
    };
    const result = ProcessFieldDropdownValues(
      "name",
      simpleEntity,
      currentRules,
      simpleTextFieldConfigs,
      currentRules.fieldRules
    );
    expect(Object.keys(result.fieldRules)).toHaveLength(0);
  });

  it("returns empty fieldRules when value does not match any dropdown dependency key", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(dropdownDependencyConfigs),
      order: ["country", "region"],
    };
    const entity: IEntityData = { country: "UK", region: "" };
    const result = ProcessFieldDropdownValues(
      "country",
      entity,
      currentRules,
      dropdownDependencyConfigs,
      currentRules.fieldRules
    );
    expect(Object.keys(result.fieldRules)).toHaveLength(0);
  });

  it("dropdown options are sorted alphabetically", () => {
    const currentRules: IConfigBusinessRules = {
      fieldRules: GetDefaultBusinessRules(dropdownDependencyConfigs),
      order: ["country", "region"],
    };
    const result = ProcessFieldDropdownValues(
      "country",
      usCountryEntity,
      currentRules,
      dropdownDependencyConfigs,
      currentRules.fieldRules
    );
    const texts = result.fieldRules.region.dropdownOptions!.map((o) => o.text);
    expect(texts).toEqual(["Central", "East", "West"]);
  });
});

// ---------------------------------------------------------------------------
// ProcessFieldOrderDepencendies
// ---------------------------------------------------------------------------
describe("ProcessFieldOrderDepencendies", () => {
  it("returns new order based on field value (Bug)", () => {
    const result = ProcessFieldOrderDepencendies("type", orderDependencyConfigs, bugTypeEntity);
    expect(result.order).toEqual(["type", "severity", "steps", "description"]);
  });

  it("returns new order based on field value (Feature)", () => {
    const result = ProcessFieldOrderDepencendies("type", orderDependencyConfigs, featureTypeEntity);
    expect(result.order).toEqual(["type", "description", "priority"]);
  });

  it("returns empty order when field value does not match any order dependency", () => {
    const entity: IEntityData = { type: "Task" };
    const result = ProcessFieldOrderDepencendies("type", orderDependencyConfigs, entity);
    expect(result.order).toEqual([]);
  });

  it("returns empty order when field has no orderDependencies", () => {
    const result = ProcessFieldOrderDepencendies("name", simpleTextFieldConfigs, simpleEntity);
    expect(result.order).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GetFieldOrder
// ---------------------------------------------------------------------------
describe("GetFieldOrder", () => {
  it("resolves flat order dependency", () => {
    const orderDeps = orderDependencyConfigs.type.orderDependencies!;
    const result = GetFieldOrder(orderDeps, bugTypeEntity, "type");
    expect(result).toEqual(["type", "severity", "steps", "description"]);
  });

  it("resolves nested order dependency (A -> subcategory A1)", () => {
    const orderDeps = nestedOrderDependencyConfigs.category.orderDependencies!;
    const result = GetFieldOrder(orderDeps, nestedOrderEntity, "category");
    expect(result).toEqual(["category", "subcategory", "name"]);
  });

  it("resolves flat order when nested category=B", () => {
    const orderDeps = nestedOrderDependencyConfigs.category.orderDependencies!;
    const entity: IEntityData = { category: "B", subcategory: "A1", name: "Test", description: "Desc" };
    const result = GetFieldOrder(orderDeps, entity, "category");
    expect(result).toEqual(["category", "name", "description"]);
  });

  it("returns empty array when no matching value in order dependencies", () => {
    const orderDeps = orderDependencyConfigs.type.orderDependencies!;
    const entity: IEntityData = { type: "Unknown" };
    const result = GetFieldOrder(orderDeps, entity, "type");
    expect(result).toEqual([]);
  });

  it("resolves nested order dependency with subcategory A2", () => {
    const orderDeps = nestedOrderDependencyConfigs.category.orderDependencies!;
    const entity: IEntityData = { category: "A", subcategory: "A2", name: "Test", description: "Desc" };
    const result = GetFieldOrder(orderDeps, entity, "category");
    expect(result).toEqual(["category", "subcategory", "description"]);
  });
});

// ---------------------------------------------------------------------------
// CombineBusinessRules
// ---------------------------------------------------------------------------
describe("CombineBusinessRules", () => {
  it("merges additional field rules into existing rules", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {
        name: { component: "Textbox", required: false },
      },
      order: ["name"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {
        name: { required: true },
      },
      order: [],
    };
    const result = CombineBusinessRules(existing, additional);
    expect(result.fieldRules.name.required).toBe(true);
    expect(result.fieldRules.name.component).toBe("Textbox"); // preserved
  });

  it("does not override order when checkOrder is false", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {},
      order: ["a", "b"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {},
      order: ["b", "a"],
    };
    const result = CombineBusinessRules(existing, additional, false);
    expect(result.order).toEqual(["a", "b"]);
  });

  it("overrides order when checkOrder is true and additional order is non-empty", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {},
      order: ["a", "b"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {},
      order: ["b", "a"],
    };
    const result = CombineBusinessRules(existing, additional, true);
    expect(result.order).toEqual(["b", "a"]);
  });

  it("does not override order when checkOrder is true but additional order is empty", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {},
      order: ["a", "b"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {},
      order: [],
    };
    const result = CombineBusinessRules(existing, additional, true);
    expect(result.order).toEqual(["a", "b"]);
  });

  it("creates field rule entry when field does not exist in existing rules", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {},
      order: [],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {
        newField: { component: "Textbox", required: true },
      },
      order: [],
    };
    const result = CombineBusinessRules(existing, additional);
    expect(result.fieldRules.newField).toBeDefined();
    expect(result.fieldRules.newField.component).toBe("Textbox");
  });

  it("merges multiple fields at once", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: {
        a: { component: "Textbox", required: false },
        b: { component: "Dropdown", hidden: false },
      },
      order: ["a", "b"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: {
        a: { required: true },
        b: { hidden: true },
      },
      order: [],
    };
    const result = CombineBusinessRules(existing, additional);
    expect(result.fieldRules.a.required).toBe(true);
    expect(result.fieldRules.b.hidden).toBe(true);
  });

  it("does not mutate the existing config", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: { a: { component: "Textbox" } },
      order: ["a"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: { a: { required: true } },
      order: [],
    };
    const existingCopy = JSON.parse(JSON.stringify(existing));
    CombineBusinessRules(existing, additional);
    expect(existing).toEqual(existingCopy);
  });

  it("does not mutate the additional config", () => {
    const existing: IConfigBusinessRules = {
      fieldRules: { a: { component: "Textbox" } },
      order: ["a"],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: { a: { required: true } },
      order: [],
    };
    const additionalCopy = JSON.parse(JSON.stringify(additional));
    CombineBusinessRules(existing, additional);
    expect(additional).toEqual(additionalCopy);
  });

  it("preserves dropdownOptions when new ones are not provided", () => {
    const options: IDropdownOption[] = [{ key: "A", text: "A" }];
    const existing: IConfigBusinessRules = {
      fieldRules: { field: { dropdownOptions: options } },
      order: [],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: { field: { required: true } },
      order: [],
    };
    const result = CombineBusinessRules(existing, additional);
    expect(result.fieldRules.field.dropdownOptions).toEqual(options);
  });

  it("overrides dropdownOptions when new ones are provided", () => {
    const oldOptions: IDropdownOption[] = [{ key: "A", text: "A" }];
    const newOptions: IDropdownOption[] = [{ key: "B", text: "B" }];
    const existing: IConfigBusinessRules = {
      fieldRules: { field: { dropdownOptions: oldOptions } },
      order: [],
    };
    const additional: IConfigBusinessRules = {
      fieldRules: { field: { dropdownOptions: newOptions } },
      order: [],
    };
    const result = CombineBusinessRules(existing, additional);
    expect(result.fieldRules.field.dropdownOptions).toEqual(newOptions);
  });
});

// ---------------------------------------------------------------------------
// ProcessAllBusinessRules
// ---------------------------------------------------------------------------
describe("ProcessAllBusinessRules", () => {
  it("returns config with fieldRules and order for simple text fields", () => {
    const result = ProcessAllBusinessRules(simpleEntity, simpleTextFieldConfigs);
    expect(result.fieldRules).toBeDefined();
    expect(result.order).toBeDefined();
    expect(result.order).toEqual(["name", "description"]);
  });

  it("processes single dependencies correctly for Active status", () => {
    const result = ProcessAllBusinessRules(activeStatusEntity, singleDependencyConfigs);
    expect(result.fieldRules.priority.required).toBe(true);
  });

  it("processes single dependencies correctly for Inactive status", () => {
    const result = ProcessAllBusinessRules(inactiveStatusEntity, singleDependencyConfigs);
    expect(result.fieldRules.priority.hidden).toBe(true);
    expect(result.fieldRules.priority.required).toBe(false);
  });

  it("processes combo dependencies when all conditions met", () => {
    const result = ProcessAllBusinessRules(comboMetEntity, comboDependencyConfigs);
    expect(result.fieldRules.notes.required).toBe(true);
  });

  it("processes combo dependencies when conditions not met", () => {
    const result = ProcessAllBusinessRules(comboNotMetEntity, comboDependencyConfigs);
    expect(result.fieldRules.notes.required).toBe(false);
  });

  it("processes dropdown dependencies for US country", () => {
    const result = ProcessAllBusinessRules(usCountryEntity, dropdownDependencyConfigs);
    const regionKeys = result.fieldRules.region.dropdownOptions!.map((o) => o.key);
    expect(regionKeys).toContain("East");
    expect(regionKeys).toContain("West");
    expect(regionKeys).toContain("Central");
  });

  it("processes order dependencies for Bug type", () => {
    const result = ProcessAllBusinessRules(bugTypeEntity, orderDependencyConfigs);
    expect(result.order).toEqual(["type", "severity", "steps", "description"]);
  });

  it("processes order dependencies for Feature type", () => {
    const result = ProcessAllBusinessRules(featureTypeEntity, orderDependencyConfigs);
    expect(result.order).toEqual(["type", "description", "priority"]);
  });

  it("sets all fields readOnly when areAllFieldsReadonly is true", () => {
    const result = ProcessAllBusinessRules(allFieldsEntity, allReadonlyConfigs, true);
    expect(result.fieldRules.name.readOnly).toBe(true);
    expect(result.fieldRules.status.readOnly).toBe(true);
  });

  it("uses provided defaultFieldRules when given", () => {
    const customRules: Dictionary<IBusinessRule> = {
      name: { component: "Textbox", required: false, hidden: false, readOnly: false },
      description: { component: "Textbox", required: false, hidden: false, readOnly: false },
    };
    const result = ProcessAllBusinessRules(simpleEntity, simpleTextFieldConfigs, false, customRules);
    expect(result.fieldRules.name.required).toBe(false);
  });

  it("marks DynamicFragment as hidden in default rules", () => {
    const entity: IEntityData = { fragment: "", name: "Test" };
    const result = ProcessAllBusinessRules(entity, fragmentConfigs);
    expect(result.fieldRules.fragment.hidden).toBe(true);
  });

  it("processes component swap for simple mode", () => {
    const result = ProcessAllBusinessRules(simpleModEntity, componentSwapConfigs);
    expect(result.fieldRules.detail.component).toBe("Textbox");
  });

  it("processes component swap for advanced mode", () => {
    const result = ProcessAllBusinessRules(advancedModeEntity, componentSwapConfigs);
    expect(result.fieldRules.detail.component).toBe("PopOutEditor");
  });

  it("processes confirm input dependency", () => {
    const result = ProcessAllBusinessRules(confirmTriggerEntity, confirmInputConfigs);
    expect(result.fieldRules.confirmed.confirmInput).toBe(true);
  });

  it("handles empty entity data gracefully", () => {
    const result = ProcessAllBusinessRules(emptyEntity, simpleTextFieldConfigs);
    expect(result.fieldRules).toBeDefined();
    expect(Object.keys(result.fieldRules)).toHaveLength(2);
  });

  it("processes nested order dependencies", () => {
    const result = ProcessAllBusinessRules(nestedOrderEntity, nestedOrderDependencyConfigs);
    expect(result.order).toEqual(["category", "subcategory", "name"]);
  });

  it("processes dropdown dependencies for CA country", () => {
    const result = ProcessAllBusinessRules(caCountryEntity, dropdownDependencyConfigs);
    const regionKeys = result.fieldRules.region.dropdownOptions!.map((o) => o.key);
    expect(regionKeys).toContain("BC");
    expect(regionKeys).toContain("Ontario");
    expect(regionKeys).toContain("Quebec");
  });

  it("includes deprecated dropdown options for deprecated value entity", () => {
    const result = ProcessAllBusinessRules(
      { category: "C" },
      deprecatedDropdownConfigs
    );
    const categoryKeys = result.fieldRules.category.dropdownOptions!.map((o) => o.key);
    // The deprecated value "C" should be added to options
    expect(categoryKeys).toContain("C");
  });
});
