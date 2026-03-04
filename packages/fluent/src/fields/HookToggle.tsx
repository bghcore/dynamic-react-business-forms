import { IFieldProps, convertBooleanToYesOrNoText } from "@bghcore/dynamic-forms-core";
import { Switch } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { GetFieldDataTestId } from "../helpers";

const HookToggle = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, setFieldValue } = props;

  const onChange = (_: React.ChangeEvent<HTMLInputElement>, data: { checked: boolean }) => {
    setFieldValue(fieldName, data.checked);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={convertBooleanToYesOrNoText(value as boolean)} />
  ) : (
    <Switch
      className="hook-toggle"
      checked={value as boolean}
      onChange={onChange}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
    />
  );
};

export default HookToggle;
