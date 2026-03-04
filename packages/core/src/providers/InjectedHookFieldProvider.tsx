import React from "react";
import { IInjectedFieldProvider } from "./IInjectedHookFieldProvider";

const InjectedFieldContext: React.Context<IInjectedFieldProvider> = React.createContext(
  undefined as unknown as IInjectedFieldProvider
);

export function UseInjectedFieldContext() {
  const context = React.useContext(InjectedFieldContext);
  if (context === undefined) {
    throw new Error(
      "UseInjectedFieldContext() was called outside of <InjectedFieldProvider>. " +
      "Required hierarchy: <RulesEngineProvider> > <InjectedFieldProvider> > <DynamicForm>"
    );
  }
  return context;
}


export const InjectedFieldProvider: React.FC<React.PropsWithChildren<{}>> = (
  props: React.PropsWithChildren<{}>
): React.JSX.Element => {
  const [injectedFields, setInjectedFields] = React.useState<Record<string, React.JSX.Element>>(
    undefined as unknown as Record<string, React.JSX.Element>
  );

  const providerValue: IInjectedFieldProvider = React.useMemo(() => ({
    injectedFields,
    setInjectedFields,
  }), [injectedFields]);

  return (
    <InjectedFieldContext.Provider value={providerValue}>
      {props.children}
    </InjectedFieldContext.Provider>
  );
};

