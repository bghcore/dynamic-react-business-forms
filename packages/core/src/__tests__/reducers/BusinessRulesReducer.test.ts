import { describe, it, expect } from "vitest";
import rulesEngineReducer, { defaultRulesEngineState } from "../../reducers/BusinessRulesReducer";
import { RulesEngineActionType, RulesEngineAction } from "../../types/IRulesEngineAction";
import { IRulesEngineState, IRuntimeFormState } from "../../types/IRuntimeFieldState";

describe("BusinessRulesReducer (v2 — RulesEngineReducer)", () => {
  const makeFormState = (overrides?: Partial<IRuntimeFormState>): IRuntimeFormState => ({
    fieldOrder: ["field1", "field2"],
    fieldStates: {
      field1: { type: "Textbox", required: true },
      field2: { type: "Dropdown", required: false, hidden: false },
    },
    ...overrides,
  });

  describe("default/unknown action", () => {
    it("returns the same state for an unknown action type", () => {
      const state: IRulesEngineState = {
        configs: {
          existingConfig: makeFormState(),
        },
      };

      const unknownAction = {
        type: "UNKNOWN_ACTION",
        payload: {
          configName: "test",
          formState: makeFormState(),
        },
      } as unknown as RulesEngineAction;

      const result = rulesEngineReducer(state, unknownAction);
      expect(result).toBe(state);
    });

    it("returns default state when state is undefined and action is unknown", () => {
      const unknownAction = {
        type: "UNKNOWN_ACTION",
        payload: {
          configName: "test",
          formState: makeFormState(),
        },
      } as unknown as RulesEngineAction;

      const result = rulesEngineReducer(undefined, unknownAction);
      expect(result).toEqual(defaultRulesEngineState);
    });
  });

  describe("RULES_ENGINE_SET action", () => {
    it("sets form state for a config name on empty state", () => {
      const formState = makeFormState();

      const action: RulesEngineAction = {
        type: RulesEngineActionType.SET,
        payload: {
          configName: "myForm",
          formState,
        },
      };

      const result = rulesEngineReducer(defaultRulesEngineState, action);

      expect(result.configs).toHaveProperty("myForm");
      expect(result.configs.myForm.fieldOrder).toEqual(["field1", "field2"]);
      expect(result.configs.myForm.fieldStates.field1).toEqual({
        type: "Textbox",
        required: true,
      });
      expect(result.configs.myForm.fieldStates.field2).toEqual({
        type: "Dropdown",
        required: false,
        hidden: false,
      });
    });

    it("does not mutate the original state", () => {
      const state: IRulesEngineState = {
        configs: {},
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.SET,
        payload: {
          configName: "myForm",
          formState: makeFormState(),
        },
      };

      const result = rulesEngineReducer(state, action);

      expect(result).not.toBe(state);
      expect(state.configs).not.toHaveProperty("myForm");
    });

    it("overwrites an existing config when SET is dispatched again", () => {
      const initialFormState = makeFormState({
        fieldOrder: ["old1", "old2"],
        fieldStates: {
          old1: { type: "Textbox" },
          old2: { type: "Textbox" },
        },
      });

      const state: IRulesEngineState = {
        configs: {
          myForm: initialFormState,
        },
      };

      const newFormState = makeFormState({
        fieldOrder: ["new1"],
        fieldStates: {
          new1: { type: "Dropdown", required: true },
        },
      });

      const action: RulesEngineAction = {
        type: RulesEngineActionType.SET,
        payload: {
          configName: "myForm",
          formState: newFormState,
        },
      };

      const result = rulesEngineReducer(state, action);

      expect(result.configs.myForm.fieldOrder).toEqual(["new1"]);
      expect(result.configs.myForm.fieldStates).toEqual({
        new1: { type: "Dropdown", required: true },
      });
      expect(result.configs.myForm.fieldStates).not.toHaveProperty("old1");
    });
  });

  describe("RULES_ENGINE_UPDATE action", () => {
    it("merges field states and updates order", () => {
      const state: IRulesEngineState = {
        configs: {
          myForm: makeFormState(),
        },
      };

      const updatePayload: IRuntimeFormState = {
        fieldOrder: ["field2", "field1"],
        fieldStates: {
          field1: { required: false, hidden: true },
        },
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.UPDATE,
        payload: {
          configName: "myForm",
          formState: updatePayload,
        },
      };

      const result = rulesEngineReducer(state, action);

      // Order should be replaced
      expect(result.configs.myForm.fieldOrder).toEqual(["field2", "field1"]);

      // field1 should be merged: type from original, required/hidden from update
      expect(result.configs.myForm.fieldStates.field1).toEqual({
        type: "Textbox",
        required: false,
        hidden: true,
      });
    });

    it("preserves existing fields not in the update payload", () => {
      const state: IRulesEngineState = {
        configs: {
          myForm: makeFormState(),
        },
      };

      const updatePayload: IRuntimeFormState = {
        fieldOrder: ["field1", "field2"],
        fieldStates: {
          field1: { required: false },
        },
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.UPDATE,
        payload: {
          configName: "myForm",
          formState: updatePayload,
        },
      };

      const result = rulesEngineReducer(state, action);

      // field2 should be unchanged
      expect(result.configs.myForm.fieldStates.field2).toEqual({
        type: "Dropdown",
        required: false,
        hidden: false,
      });
    });

    it("does not mutate the original state", () => {
      const state: IRulesEngineState = {
        configs: {
          myForm: makeFormState(),
        },
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.UPDATE,
        payload: {
          configName: "myForm",
          formState: {
            fieldOrder: ["field2", "field1"],
            fieldStates: {
              field1: { hidden: true },
            },
          },
        },
      };

      const result = rulesEngineReducer(state, action);

      expect(result).not.toBe(state);
      // Original field1 should not have hidden
      expect(state.configs.myForm.fieldStates.field1).toEqual({
        type: "Textbox",
        required: true,
      });
    });

    it("returns same state when config does not exist", () => {
      const state: IRulesEngineState = {
        configs: {},
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.UPDATE,
        payload: {
          configName: "nonExistent",
          formState: {
            fieldOrder: ["a"],
            fieldStates: { a: { required: true } },
          },
        },
      };

      const result = rulesEngineReducer(state, action);
      expect(result).toBe(state);
    });
  });

  describe("RULES_ENGINE_CLEAR action", () => {
    it("clears a specific config when configName is provided", () => {
      const state: IRulesEngineState = {
        configs: {
          formA: makeFormState(),
          formB: makeFormState(),
        },
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.CLEAR,
        payload: { configName: "formA" },
      };

      const result = rulesEngineReducer(state, action);
      expect(result.configs).not.toHaveProperty("formA");
      expect(result.configs).toHaveProperty("formB");
    });

    it("clears all configs when no configName is provided", () => {
      const state: IRulesEngineState = {
        configs: {
          formA: makeFormState(),
          formB: makeFormState(),
        },
      };

      const action: RulesEngineAction = {
        type: RulesEngineActionType.CLEAR,
        payload: {},
      };

      const result = rulesEngineReducer(state, action);
      expect(result).toEqual(defaultRulesEngineState);
      expect(Object.keys(result.configs)).toHaveLength(0);
    });
  });

  describe("multiple configs coexisting", () => {
    it("SET for different config names results in both being present", () => {
      let state: IRulesEngineState = { configs: {} };

      const formStateA = makeFormState({
        fieldOrder: ["a1"],
        fieldStates: { a1: { type: "Textbox" } },
      });

      const formStateB = makeFormState({
        fieldOrder: ["b1", "b2"],
        fieldStates: {
          b1: { type: "Dropdown" },
          b2: { type: "Toggle" },
        },
      });

      state = rulesEngineReducer(state, {
        type: RulesEngineActionType.SET,
        payload: { configName: "formA", formState: formStateA },
      });

      state = rulesEngineReducer(state, {
        type: RulesEngineActionType.SET,
        payload: { configName: "formB", formState: formStateB },
      });

      expect(state.configs).toHaveProperty("formA");
      expect(state.configs).toHaveProperty("formB");
      expect(state.configs.formA.fieldOrder).toEqual(["a1"]);
      expect(state.configs.formB.fieldOrder).toEqual(["b1", "b2"]);
    });

    it("UPDATE on one config does not affect another", () => {
      const state: IRulesEngineState = {
        configs: {
          formA: makeFormState({
            fieldOrder: ["a1"],
            fieldStates: { a1: { type: "Textbox", required: true } },
          }),
          formB: makeFormState({
            fieldOrder: ["b1"],
            fieldStates: { b1: { type: "Dropdown", required: false } },
          }),
        },
      };

      const result = rulesEngineReducer(state, {
        type: RulesEngineActionType.UPDATE,
        payload: {
          configName: "formA",
          formState: {
            fieldOrder: ["a1"],
            fieldStates: { a1: { required: false } },
          },
        },
      });

      // formA updated
      expect(result.configs.formA.fieldStates.a1.required).toBe(false);

      // formB unchanged
      expect(result.configs.formB.fieldStates.b1).toEqual({
        type: "Dropdown",
        required: false,
      });
    });
  });
});
