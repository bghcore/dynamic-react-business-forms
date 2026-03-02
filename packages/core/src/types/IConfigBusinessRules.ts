import { Dictionary } from "../utils";
import { IBusinessRule } from "./IBusinessRule";

export interface IConfigBusinessRules {
  order: string[];
  fieldRules: Dictionary<IBusinessRule>;
}
