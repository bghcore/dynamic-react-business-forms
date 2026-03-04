import { describe, it, expect } from "vitest";
import {
  evaluateAllRules,
  evaluateAffectedFields,
  buildDefaultFieldStates,
  buildDependencyGraph,
  topologicalSort,
} from "../../helpers/RuleEngine";
import { evaluateCondition } from "../../helpers/ConditionEvaluator";
import { IRuntimeFormState, IRuntimeFieldState } from "../../types/IRuntimeFieldState";
import { IFieldConfig } from "../../types/IFieldConfig";
import { IEntityData } from "../../utils";

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
  fragmentConfigs,
  allReadonlyConfigs,
  defaultValueConfigs,
  circularDependencyConfigs,
  multiselectConfigs,
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
  confirmTriggerEntity,
  simpleModEntity,
  advancedModeEntity,
} from "../__fixtures__/entityData";

// ---------------------------------------------------------------------------
// evaluateCondition
// ---------------------------------------------------------------------------
describe("evaluateCondition", () => {
  it("returns false for empty entity with equals check", () => {
    const result = evaluateCondition(
      { field: "name", operator: "equals", value: "Test" },
      emptyEntity
    );
    expect(result).toBe(false);
  });

  it("returns true for matching field value with equals", () => {
    const result = evaluateCondition(
      { field: "name", operator: "equals", value: "Test Item" },
      simpleEntity
    );
    expect(result).toBe(true);
  });

  it("returns false for non-matching field value with equals", () => {
    const result = evaluateCondition(
      { field: "name", operator: "equals", value: "Other" },
      simpleEntity
    );
    expect(result).toBe(false);
  });

  it("evaluates notEquals correctly", () => {
    expect(
      evaluateCondition({ field: "name", operator: "notEquals", value: "Other" }, simpleEntity)
    ).toBe(true);
    expect(
      evaluateCondition({ field: "name", operator: "notEquals", value: "Test Item" }, simpleEntity)
    ).toBe(false);
  });

  it("evaluates isEmpty correctly", () => {
    expect(evaluateCondition({ field: "name", operator: "isEmpty" }, emptyEntity)).toBe(true);
    expect(evaluateCondition({ field: "name", operator: "isEmpty" }, simpleEntity)).toBe(false);
  });

  it("evaluates isNotEmpty correctly", () => {
    expect(evaluateCondition({ field: "name", operator: "isNotEmpty" }, simpleEntity)).toBe(true);
    expect(evaluateCondition({ field: "name", operator: "isNotEmpty" }, emptyEntity)).toBe(false);
  });

  it("evaluates nested dotted paths", () => {
    const result = evaluateCondition(
      { field: "Parent.name", operator: "equals", value: "Parent Item" },
      nestedEntity
    );
    expect(result).toBe(true);
  });

  it("evaluates 'in' operator", () => {
    expect(
      evaluateCondition({ field: "status", operator: "in", value: ["Active", "Pending"] }, activeStatusEntity)
    ).toBe(true);
    expect(
      evaluateCondition({ field: "status", operator: "in", value: ["Closed", "Pending"] }, activeStatusEntity)
    ).toBe(false);
  });

  it("evaluates 'contains' operator", () => {
    expect(
      evaluateCondition({ field: "description", operator: "contains", value: "test" }, simpleEntity)
    ).toBe(true);
    expect(
      evaluateCondition({ field: "description", operator: "contains", value: "xyz" }, simpleEntity)
    ).toBe(false);
  });

  it("evaluates 'and' logical condition", () => {
    const result = evaluateCondition(
      {
        operator: "and",
        conditions: [
          { field: "status", operator: "equals", value: "Active" },
          { field: "type", operator: "equals", value: "Bug" },
        ],
      },
      comboMetEntity
    );
    expect(result).toBe(true);
  });

  it("evaluates 'or' logical condition", () => {
    const result = evaluateCondition(
      {
        operator: "or",
        conditions: [
          { field: "status", operator: "equals", value: "Active" },
          { field: "type", operator: "equals", value: "Task" },
        ],
      },
      comboMetEntity
    );
    expect(result).toBe(true);
  });

  it("evaluates 'not' logical condition", () => {
    const result = evaluateCondition(
      {
        operator: "not",
        conditions: [
          { field: "status", operator: "equals", value: "Inactive" },
        ],
      },
      activeStatusEntity
    );
    expect(result).toBe(true);
  });

  it("evaluates greaterThan and lessThan", () => {
    const values = { age: 25 };
    expect(evaluateCondition({ field: "age", operator: "greaterThan", value: 20 }, values)).toBe(true);
    expect(evaluateCondition({ field: "age", operator: "lessThan", value: 30 }, values)).toBe(true);
    expect(evaluateCondition({ field: "age", operator: "greaterThan", value: 30 }, values)).toBe(false);
  });

  it("evaluates matches (regex) operator", () => {
    expect(
      evaluateCondition({ field: "name", operator: "matches", value: "^Test" }, simpleEntity)
    ).toBe(true);
    expect(
      evaluateCondition({ field: "name", operator: "matches", value: "^Other" }, simpleEntity)
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildDependencyGraph
// ---------------------------------------------------------------------------
describe("buildDependencyGraph", () => {
  it("builds empty graph for fields with no rules", () => {
    const graph = buildDependencyGraph(simpleTextFieldConfigs);
    expect(graph.name.size).toBe(0);
    expect(graph.description.size).toBe(0);
  });

  it("builds forward dependencies from rules", () => {
    const graph = buildDependencyGraph(singleDependencyConfigs);
    // status has a rule that references status itself in condition => status affects priority
    expect(graph.status.has("priority")).toBe(true);
  });

  it("builds dependencies for dropdown filtering rules", () => {
    const graph = buildDependencyGraph(dropdownDependencyConfigs);
    // country's rules reference country in condition and target region in effects
    expect(graph.country.has("region")).toBe(true);
  });

  it("builds dependencies for combo (AND) rules", () => {
    const graph = buildDependencyGraph(comboDependencyConfigs);
    // notes has a rule with AND condition referencing status and type
    expect(graph.status.has("notes")).toBe(true);
    expect(graph.type.has("notes")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// topologicalSort
// ---------------------------------------------------------------------------
describe("topologicalSort", () => {
  it("sorts acyclic graph correctly", () => {
    const graph: Record<string, Set<string>> = {
      a: new Set(["b"]),
      b: new Set(["c"]),
      c: new Set(),
    };
    const { sorted, hasCycle } = topologicalSort(graph);
    expect(hasCycle).toBe(false);
    expect(sorted.indexOf("a")).toBeLessThan(sorted.indexOf("b"));
    expect(sorted.indexOf("b")).toBeLessThan(sorted.indexOf("c"));
  });

  it("detects cycles", () => {
    const graph: Record<string, Set<string>> = {
      a: new Set(["b"]),
      b: new Set(["a"]),
    };
    const { hasCycle, cycleFields } = topologicalSort(graph);
    expect(hasCycle).toBe(true);
    expect(cycleFields).toContain("a");
    expect(cycleFields).toContain("b");
  });

  it("handles empty graph", () => {
    const { sorted, hasCycle } = topologicalSort({});
    expect(sorted).toEqual([]);
    expect(hasCycle).toBe(false);
  });

  it("handles disconnected nodes", () => {
    const graph: Record<string, Set<string>> = {
      a: new Set(),
      b: new Set(),
      c: new Set(),
    };
    const { sorted, hasCycle } = topologicalSort(graph);
    expect(hasCycle).toBe(false);
    expect(sorted).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// buildDefaultFieldStates
// ---------------------------------------------------------------------------
describe("buildDefaultFieldStates", () => {
  it("creates a state entry for every field config key", () => {
    const states = buildDefaultFieldStates(simpleTextFieldConfigs);
    expect(Object.keys(states)).toEqual(["name", "description"]);
  });

  it("sets type from field config", () => {
    const states = buildDefaultFieldStates(simpleTextFieldConfigs);
    expect(states.name.type).toBe("Textbox");
  });

  it("sets required from field config", () => {
    const states = buildDefaultFieldStates(simpleTextFieldConfigs);
    expect(states.name.required).toBe(true);
    expect(states.description.required).toBe(false);
  });

  it("sets hidden to true for DynamicFragment type", () => {
    const states = buildDefaultFieldStates(fragmentConfigs);
    expect(states.fragment.hidden).toBe(true);
  });

  it("preserves hidden flag from field config", () => {
    const states = buildDefaultFieldStates(hiddenReadonlyConfigs);
    expect(states.secret.hidden).toBe(true);
    expect(states.name.hidden).toBeFalsy();
  });

  it("sets readOnly from field config", () => {
    const states = buildDefaultFieldStates(hiddenReadonlyConfigs);
    expect(states.id.readOnly).toBe(true);
    expect(states.name.readOnly).toBeUndefined();
  });

  it("overrides readOnly when areAllFieldsReadonly is true", () => {
    const states = buildDefaultFieldStates(allReadonlyConfigs, true);
    expect(states.name.readOnly).toBe(true);
    expect(states.status.readOnly).toBe(true);
  });

  it("sets computedValue from field config", () => {
    const states = buildDefaultFieldStates(valueFunctionConfigs);
    expect(states.createdDate.computedValue).toBe("$fn.setDate()");
    expect(states.modifiedDate.computedValue).toBe("$fn.setDate()");
    expect(states.name.computedValue).toBeUndefined();
  });

  it("sets computeOnCreateOnly flag", () => {
    const states = buildDefaultFieldStates(valueFunctionConfigs);
    expect(states.createdDate.computeOnCreateOnly).toBe(true);
    expect(states.modifiedDate.computeOnCreateOnly).toBeUndefined();
  });

  it("sets validate array from field config", () => {
    const states = buildDefaultFieldStates(validationConfigs);
    expect(states.email.validate).toEqual([{ name: "email" }]);
    expect(states.phone.validate).toEqual([{ name: "phone" }]);
  });

  it("populates dependentFields from rules", () => {
    const states = buildDefaultFieldStates(singleDependencyConfigs);
    expect(states.status.dependentFields).toContain("priority");
  });

  it("populates dependsOnFields (reverse of dependentFields)", () => {
    const states = buildDefaultFieldStates(singleDependencyConfigs);
    expect(states.priority.dependsOnFields).toContain("status");
  });

  it("sets options from field config", () => {
    const states = buildDefaultFieldStates(singleDependencyConfigs);
    expect(states.status.options).toHaveLength(2);
    expect(states.status.options![0].value).toBe("Active");
  });

  it("sets confirmInput from field config", () => {
    const states = buildDefaultFieldStates(confirmInputConfigs);
    expect(states.confirmed.confirmInput).toBe(true);
  });

  it("sets defaultValue from field config", () => {
    const states = buildDefaultFieldStates(defaultValueConfigs);
    expect(states.status.defaultValue).toBe("Open");
  });
});

// ---------------------------------------------------------------------------
// evaluateAllRules
// ---------------------------------------------------------------------------
describe("evaluateAllRules", () => {
  it("returns formState with fieldStates and fieldOrder for simple text fields", () => {
    const result = evaluateAllRules(simpleTextFieldConfigs, simpleEntity);
    expect(result.fieldStates).toBeDefined();
    expect(result.fieldOrder).toBeDefined();
    expect(result.fieldOrder).toEqual(["name", "description"]);
  });

  it("processes single dependency correctly for Active status", () => {
    const result = evaluateAllRules(singleDependencyConfigs, activeStatusEntity);
    expect(result.fieldStates.priority.required).toBe(true);
  });

  it("processes single dependency correctly for Inactive status", () => {
    const result = evaluateAllRules(singleDependencyConfigs, inactiveStatusEntity);
    expect(result.fieldStates.priority.hidden).toBe(true);
    expect(result.fieldStates.priority.required).toBe(false);
  });

  it("processes combo (AND) rules when all conditions met", () => {
    const result = evaluateAllRules(comboDependencyConfigs, comboMetEntity);
    expect(result.fieldStates.notes.required).toBe(true);
  });

  it("processes combo (AND) rules when conditions not met", () => {
    const result = evaluateAllRules(comboDependencyConfigs, comboNotMetEntity);
    expect(result.fieldStates.notes.required).toBe(false);
  });

  it("processes dropdown filtering rules for US country", () => {
    const result = evaluateAllRules(dropdownDependencyConfigs, usCountryEntity);
    const regionValues = result.fieldStates.region.options!.map((o) => o.value);
    expect(regionValues).toContain("East");
    expect(regionValues).toContain("West");
    expect(regionValues).toContain("Central");
  });

  it("processes dropdown filtering rules for CA country", () => {
    const result = evaluateAllRules(dropdownDependencyConfigs, caCountryEntity);
    const regionValues = result.fieldStates.region.options!.map((o) => o.value);
    expect(regionValues).toContain("BC");
    expect(regionValues).toContain("Ontario");
    expect(regionValues).toContain("Quebec");
  });

  it("processes order rules for Bug type (via non-self-referencing rules)", () => {
    // When a rule condition references its own field, it creates a self-loop in the
    // dependency graph, causing topological sort to exclude it. We use a separate
    // trigger field to test order rules properly.
    const orderFields: Record<string, IFieldConfig> = {
      trigger: {
        type: "Dropdown",
        label: "Trigger",
        options: [
          { value: "Bug", label: "Bug" },
          { value: "Feature", label: "Feature" },
        ],
      },
      severity: { type: "Textbox", label: "Severity" },
      steps: { type: "Textbox", label: "Steps" },
      description: { type: "Textbox", label: "Description" },
      priority: { type: "Textbox", label: "Priority" },
    };
    // Put rules on the non-trigger fields (referencing trigger in condition)
    orderFields.severity = {
      ...orderFields.severity,
      rules: [
        {
          when: { field: "trigger", operator: "equals", value: "Bug" },
          then: { fieldOrder: ["trigger", "severity", "steps", "description"] },
        },
      ],
    };

    const result = evaluateAllRules(orderFields, { trigger: "Bug" });
    expect(result.fieldOrder).toEqual(["trigger", "severity", "steps", "description"]);
  });

  it("processes order rules for Feature type (via non-self-referencing rules)", () => {
    const orderFields: Record<string, IFieldConfig> = {
      trigger: {
        type: "Dropdown",
        label: "Trigger",
        options: [
          { value: "Bug", label: "Bug" },
          { value: "Feature", label: "Feature" },
        ],
      },
      severity: { type: "Textbox", label: "Severity" },
      description: { type: "Textbox", label: "Description" },
      priority: { type: "Textbox", label: "Priority" },
    };
    orderFields.description = {
      ...orderFields.description,
      rules: [
        {
          when: { field: "trigger", operator: "equals", value: "Feature" },
          then: { fieldOrder: ["trigger", "description", "priority"] },
        },
      ],
    };

    const result = evaluateAllRules(orderFields, { trigger: "Feature" });
    expect(result.fieldOrder).toEqual(["trigger", "description", "priority"]);
  });

  it("sets all fields readOnly when areAllFieldsReadonly is true", () => {
    const result = evaluateAllRules(allReadonlyConfigs, allFieldsEntity, true);
    expect(result.fieldStates.name.readOnly).toBe(true);
    expect(result.fieldStates.status.readOnly).toBe(true);
  });

  it("marks DynamicFragment as hidden in default states", () => {
    const entity: IEntityData = { fragment: "", name: "Test" };
    const result = evaluateAllRules(fragmentConfigs, entity);
    expect(result.fieldStates.fragment.hidden).toBe(true);
  });

  it("processes component swap for simple mode", () => {
    const result = evaluateAllRules(componentSwapConfigs, simpleModEntity);
    expect(result.fieldStates.detail.type).toBe("Textbox");
  });

  it("processes component swap for advanced mode", () => {
    const result = evaluateAllRules(componentSwapConfigs, advancedModeEntity);
    expect(result.fieldStates.detail.type).toBe("PopOutEditor");
  });

  it("handles empty entity data gracefully", () => {
    const result = evaluateAllRules(simpleTextFieldConfigs, emptyEntity);
    expect(result.fieldStates).toBeDefined();
    expect(Object.keys(result.fieldStates)).toHaveLength(2);
  });

  it("preserves validation rules in field states", () => {
    const result = evaluateAllRules(validationConfigs, { email: "", phone: "", website: "" });
    expect(result.fieldStates.email.validate).toEqual([{ name: "email" }]);
    expect(result.fieldStates.phone.validate).toEqual([{ name: "phone" }]);
    expect(result.fieldStates.website.validate).toEqual([{ name: "url" }]);
  });

  it("preserves default value in field states", () => {
    const result = evaluateAllRules(defaultValueConfigs, { status: null, name: "" });
    expect(result.fieldStates.status.defaultValue).toBe("Open");
  });
});

// ---------------------------------------------------------------------------
// evaluateAffectedFields
// ---------------------------------------------------------------------------
describe("evaluateAffectedFields", () => {
  it("re-evaluates fields affected by a changed field", () => {
    // First evaluate all rules with Active status
    const initialState = evaluateAllRules(singleDependencyConfigs, activeStatusEntity);
    expect(initialState.fieldStates.priority.required).toBe(true);

    // Now status changes to Inactive
    const updatedState = evaluateAffectedFields(
      "status",
      singleDependencyConfigs,
      inactiveStatusEntity,
      initialState
    );
    expect(updatedState.fieldStates.priority.hidden).toBe(true);
    expect(updatedState.fieldStates.priority.required).toBe(false);
  });

  it("returns same state when changed field has no dependents", () => {
    const initialState = evaluateAllRules(simpleTextFieldConfigs, simpleEntity);
    const updatedState = evaluateAffectedFields(
      "name",
      simpleTextFieldConfigs,
      { ...simpleEntity, name: "New Name" },
      initialState
    );
    // Should be same reference since no fields were affected
    expect(updatedState).toBe(initialState);
  });

  it("updates dropdown options when source field changes", () => {
    const initialState = evaluateAllRules(dropdownDependencyConfigs, usCountryEntity);
    const usRegionValues = initialState.fieldStates.region.options!.map((o) => o.value);
    expect(usRegionValues).toContain("East");

    const updatedState = evaluateAffectedFields(
      "country",
      dropdownDependencyConfigs,
      caCountryEntity,
      initialState
    );
    const caRegionValues = updatedState.fieldStates.region.options!.map((o) => o.value);
    expect(caRegionValues).toContain("Ontario");
    expect(caRegionValues).toContain("Quebec");
  });

  it("updates field order when order rule triggers", () => {
    // Use non-self-referencing configs to avoid topological sort cycle
    const orderFields: Record<string, IFieldConfig> = {
      trigger: {
        type: "Dropdown",
        label: "Trigger",
        options: [
          { value: "A", label: "A" },
          { value: "B", label: "B" },
        ],
      },
      field1: { type: "Textbox", label: "Field 1" },
      field2: { type: "Textbox", label: "Field 2" },
      field3: {
        type: "Textbox",
        label: "Field 3",
        rules: [
          {
            when: { field: "trigger", operator: "equals", value: "A" },
            then: { fieldOrder: ["trigger", "field1", "field3"] },
          },
          {
            when: { field: "trigger", operator: "equals", value: "B" },
            then: { fieldOrder: ["trigger", "field2", "field3"] },
          },
        ],
      },
    };

    const initialState = evaluateAllRules(orderFields, { trigger: "A" });
    expect(initialState.fieldOrder).toEqual(["trigger", "field1", "field3"]);

    const updatedState = evaluateAffectedFields(
      "trigger",
      orderFields,
      { trigger: "B" },
      initialState
    );
    expect(updatedState.fieldOrder).toEqual(["trigger", "field2", "field3"]);
  });

  it("updates component swap on field change", () => {
    const initialState = evaluateAllRules(componentSwapConfigs, simpleModEntity);
    expect(initialState.fieldStates.detail.type).toBe("Textbox");

    const updatedState = evaluateAffectedFields(
      "mode",
      componentSwapConfigs,
      advancedModeEntity,
      initialState
    );
    expect(updatedState.fieldStates.detail.type).toBe("PopOutEditor");
  });

  it("updates combo (AND) rule when one condition changes", () => {
    // Both conditions met initially
    const initialState = evaluateAllRules(comboDependencyConfigs, comboMetEntity);
    expect(initialState.fieldStates.notes.required).toBe(true);

    // Change status to Closed (breaks AND condition)
    const updatedState = evaluateAffectedFields(
      "status",
      comboDependencyConfigs,
      { status: "Closed", type: "Bug", notes: "" },
      initialState
    );
    expect(updatedState.fieldStates.notes.required).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rule priority
// ---------------------------------------------------------------------------
describe("Rule priority", () => {
  it("higher priority rule wins when both apply", () => {
    const fields: Record<string, IFieldConfig> = {
      trigger: {
        type: "Textbox",
        label: "Trigger",
        rules: [
          {
            id: "low-priority",
            when: { field: "trigger", operator: "isNotEmpty" },
            then: { fields: { target: { required: false } } },
            priority: 0,
          },
          {
            id: "high-priority",
            when: { field: "trigger", operator: "isNotEmpty" },
            then: { fields: { target: { required: true } } },
            priority: 10,
          },
        ],
      },
      target: { type: "Textbox", label: "Target" },
    };

    const result = evaluateAllRules(fields, { trigger: "value" });
    expect(result.fieldStates.target.required).toBe(true);
  });

  it("else branch applies when condition is false", () => {
    const fields: Record<string, IFieldConfig> = {
      status: {
        type: "Dropdown",
        label: "Status",
        options: [{ value: "A", label: "A" }, { value: "B", label: "B" }],
        rules: [
          {
            when: { field: "status", operator: "equals", value: "A" },
            then: { fields: { detail: { required: true } } },
            else: { fields: { detail: { hidden: true } } },
          },
        ],
      },
      detail: { type: "Textbox", label: "Detail" },
    };

    const result = evaluateAllRules(fields, { status: "B" });
    expect(result.fieldStates.detail.hidden).toBe(true);
  });
});
