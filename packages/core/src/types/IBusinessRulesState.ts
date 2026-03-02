import { Dictionary } from "../utils";
import { IConfigBusinessRules } from "./IConfigBusinessRules";

export interface IBusinessRulesState {
  configRules: Dictionary<IConfigBusinessRules>;
}
