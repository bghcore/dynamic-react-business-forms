import { Dictionary } from "../utils";
import React from "react";
import { IInjectedHookFieldProvider } from "./IInjectedHookFieldProvider";

const InjectedHookFieldContext: React.Context<IInjectedHookFieldProvider> = React.createContext(undefined as unknown as IInjectedHookFieldProvider);

export function UseInjectedHookFieldContext() {
  const context = React.useContext(InjectedHookFieldContext);
  if (context === undefined) {
    throw new Error("InjectedHookFieldContext must be used within InjectedHookFieldProvider");
  }
  return context;
}

export const InjectedHookFieldProvider: React.FC<React.PropsWithChildren<{}>> = (
  props: React.PropsWithChildren<{}>
): JSX.Element => {
  const [injectedFields, setInjectedFields] = React.useState<Dictionary<JSX.Element>>(undefined as unknown as Dictionary<JSX.Element>);

  const providerValue: IInjectedHookFieldProvider = {
    injectedFields,
    setInjectedFields
  };

  return (
    <InjectedHookFieldContext.Provider value={providerValue}>
      {props.children}
    </InjectedHookFieldContext.Provider>
  );
};
