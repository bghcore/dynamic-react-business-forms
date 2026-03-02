import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import React from "react";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface IHookReadOnlyArrayProps extends IReadOnlyFieldProps {}

const HookReadOnlyArray = (props: IHookFieldSharedProps<IHookReadOnlyArrayProps>) => {
  const { fieldName, value, meta } = props;
  return (
    <>
      {(value as string[])?.map((v, i) => (
        <ReadOnlyText key={i} fieldName={fieldName} value={v} {...meta} />
      ))}
    </>
  );
};

export default HookReadOnlyArray;
