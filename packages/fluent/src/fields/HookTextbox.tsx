import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import { ITextFieldProps, TextField } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookTextboxProps extends ITextFieldProps {
  ellipsifyTextCharacters?: number;
  placeHolder?: string;
}

const HookTextbox = (props: IHookFieldSharedProps<IHookTextboxProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, setFieldValue } = props;

  const onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setFieldValue(fieldName, newValue, false, 3000);
  };

  return readOnly ? (
    <ReadOnlyText
      fieldName={fieldName}
      value={value as string}
      ellipsifyTextCharacters={meta?.ellipsifyTextCharacters}
    />
  ) : (
    <TextField
      className={FieldClassName("hook-textbox", error)}
      autoComplete="off"
      value={value as string}
      onChange={onChange}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookTextbox;
