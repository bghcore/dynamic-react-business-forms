import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import { DefaultButton, IButtonProps } from "@fluentui/react";
import React from "react";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface HookReadOnlyWithButton extends IReadOnlyFieldProps {
  containerClassName?: string;
  buttonConfig?: IButtonProps & { text?: string; onClick?: () => void };
}

const HookReadOnlyWithButton = (props: IHookFieldSharedProps<HookReadOnlyWithButton>) => {
  const { fieldName, value, meta } = props;
  return (
    <div className={`flexBox ${meta?.containerClassName || ""}`}>
      <ReadOnlyText fieldName={fieldName} value={`${value}`} />
      {meta?.buttonConfig && <DefaultButton {...meta.buttonConfig} />}
    </div>
  );
};

export default HookReadOnlyWithButton;
