import { IHookFieldSharedProps, convertBooleanToYesOrNoText } from "@brhanso/dynamic-forms-core";
import { IToggleProps, Toggle } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { GetFieldDataTestId } from "../helpers";

interface IHookToggleProps extends IToggleProps {
  value: boolean;
}

const HookToggle = (props: IHookFieldSharedProps<IHookToggleProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, setFieldValue } = props;

  const onChange = (event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) => {
    setFieldValue(fieldName, checked);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={convertBooleanToYesOrNoText(value as boolean)} />
  ) : (
    <Toggle
      className="hook-toggle"
      checked={value as boolean}
      onChange={onChange}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookToggle;
