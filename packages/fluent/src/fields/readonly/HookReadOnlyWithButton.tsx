import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Button } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface HookReadOnlyWithButtonProps extends IReadOnlyFieldProps {
  containerClassName?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const HookReadOnlyWithButton = (props: IFieldProps<HookReadOnlyWithButtonProps>) => {
  const { fieldName, value, config } = props;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className={config?.containerClassName}>
      <ReadOnlyText fieldName={fieldName} value={`${value}`} />
      {config?.buttonText && <Button onClick={config.onButtonClick}>{config.buttonText}</Button>}
    </div>
  );
};

export default HookReadOnlyWithButton;
