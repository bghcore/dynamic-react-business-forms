"use client";

import { useEffect } from "react";
import { UseInjectedHookFieldContext } from "@bghcore/dynamic-forms-core";
import { createMuiFieldRegistry } from "@bghcore/dynamic-forms-mui";

export default function FieldRegistrar({ children }: { children: React.ReactNode }) {
  const { setInjectedFields } = UseInjectedHookFieldContext();
  useEffect(() => {
    setInjectedFields(createMuiFieldRegistry());
  }, [setInjectedFields]);
  return <>{children}</>;
}
