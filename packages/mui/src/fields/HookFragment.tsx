import { IFieldProps } from "@bghcore/dynamic-forms-core";
import React from "react";

const HookFragment = (props: IFieldProps<{}>) => {
  const { value } = props;
  return <input type="hidden" value={value as string} />;
};

export default HookFragment;
