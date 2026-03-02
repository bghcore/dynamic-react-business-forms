import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import React from "react";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface IHookReadOnlyProps extends IReadOnlyFieldProps {}

const HookReadOnly = (props: IHookFieldSharedProps<IHookReadOnlyProps>) => {
  const { fieldName, value, meta } = props;
  return <ReadOnlyText fieldName={fieldName} value={value as string} {...meta} />;
};

export default HookReadOnly;
