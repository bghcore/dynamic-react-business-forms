import { IRuntimeFormState } from "./IRuntimeFieldState";

/** Action type keys for the rules engine reducer */
export enum RulesEngineActionType {
  SET = "RULES_ENGINE_SET",
  UPDATE = "RULES_ENGINE_UPDATE",
  CLEAR = "RULES_ENGINE_CLEAR",
}

export interface ISetRulesAction {
  readonly type: RulesEngineActionType.SET;
  readonly payload: {
    readonly configName: string;
    readonly formState: IRuntimeFormState;
  };
}

export interface IUpdateRulesAction {
  readonly type: RulesEngineActionType.UPDATE;
  readonly payload: {
    readonly configName: string;
    readonly formState: IRuntimeFormState;
  };
}

export interface IClearRulesAction {
  readonly type: RulesEngineActionType.CLEAR;
  readonly payload: {
    readonly configName?: string;
  };
}

export type RulesEngineAction = ISetRulesAction | IUpdateRulesAction | IClearRulesAction;
