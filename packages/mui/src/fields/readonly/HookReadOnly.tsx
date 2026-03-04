import { IFieldProps } from "@bghcore/dynamic-forms-core";
import React from "react";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface IHookReadOnlyProps extends IReadOnlyFieldProps {}

const HookReadOnly = (props: IFieldProps<IHookReadOnlyProps>) => {
  const { fieldName, value, config } = props;
  return <ReadOnlyText fieldName={fieldName} value={value as string} {...config} />;
};

export default HookReadOnly;
