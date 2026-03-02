import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import React from "react";

const HookFragment = (props: IHookFieldSharedProps<{}>) => {
  const { value } = props;
  return <input type="hidden" value={value as string} />;
};

export default HookFragment;
