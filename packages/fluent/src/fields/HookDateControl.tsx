import { IFieldProps, FormStrings } from "@bghcore/dynamic-forms-core";
import { Input, Button } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import React from "react";
import { FieldClassName, GetFieldDataTestId, formatDateTime } from "../helpers";

const HookDateControl = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, setFieldValue } = props;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value);
    if (!isNaN(date.getTime())) {
      setFieldValue(fieldName, date.toISOString());
    }
  };

  const onClearDate = () => {
    setFieldValue(fieldName, null);
  };

  const dateInputValue = value ? new Date(value as string).toISOString().split("T")[0] : "";

  return readOnly ? (
    <>
      {value ? (
        <span className="hook-read-only-date">{formatDateTime(value as string, { hideTimestamp: true })}</span>
      ) : (
        <>-</>
      )}
    </>
  ) : (
    <div className="hook-date-control-container" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <Input
        className={FieldClassName("hook-date-control", error)}
        type="date"
        value={dateInputValue}
        onChange={onChange}
        data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      />
      <Button
        appearance="subtle"
        icon={<DismissRegular />}
        onClick={onClearDate}
        title={FormStrings.clickToClear}
        aria-label={`${fieldName} ${FormStrings.clear}`}
      />
    </div>
  );
};

export default HookDateControl;
