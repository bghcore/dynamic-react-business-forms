import { Dictionary } from "../utils";

export interface IInjectedHookFieldProvider {
  injectedFields: Dictionary<JSX.Element>;
  setInjectedFields: (injectedFields: Dictionary<JSX.Element>) => void;
}
