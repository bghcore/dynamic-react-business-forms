import { IHookFieldSharedProps, isNull } from "@brhanso/dynamic-forms-core";
import { ITextFieldProps, TextField } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookNumberProps extends ITextFieldProps {}

const HookNumber = (props: IHookFieldSharedProps<IHookNumberProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, setFieldValue } = props;

  const onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const number = Number(newValue);
    if (!isNaN(number)) {
      setFieldValue(fieldName, number, false, 1500);
    }
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={String(value)} />
  ) : (
    <TextField
      className={FieldClassName("hook-number", error)}
      autoComplete="off"
      value={!isNull(value) ? String(value) : ""}
      onChange={onChange}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookNumber;
