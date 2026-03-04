import React from "react";

export interface IInjectedFieldProvider {
  injectedFields: Record<string, React.JSX.Element>;
  setInjectedFields: (injectedFields: Record<string, React.JSX.Element>) => void;
}

