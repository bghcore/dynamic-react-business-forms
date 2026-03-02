import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import { DatePicker, IDatePickerProps, IconButton } from "@fluentui/react";
import React from "react";
import { FieldClassName, GetFieldDataTestId, formatDateTime } from "../helpers";
import { HookInlineFormStrings } from "@brhanso/dynamic-forms-core";

interface IHookDateControlProps extends IDatePickerProps {}

const HookDateControl = (props: IHookFieldSharedProps<IHookDateControlProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, setFieldValue } = props;

  const onChange = (date: Date) => {
    setFieldValue(fieldName, date.toISOString());
  };

  const onClearDate = () => {
    setFieldValue(fieldName, null);
  };

  return readOnly ? (
    <>
      {value ? (
        <span className="hook-read-only-date">{formatDateTime(value as string, { hideTimestamp: true })}</span>
      ) : (
        <>-</>
      )}
    </>
  ) : (
    <div className="hook-date-control-container">
      <DatePicker
        className={FieldClassName("hook-date-control", error)}
        value={value ? new Date(value as string) : null}
        onSelectDate={onChange}
        data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
        {...meta}
      />
      <IconButton
        iconProps={{ iconName: "Cancel", className: "clear-date" }}
        title={HookInlineFormStrings.clickToClear}
        onClick={onClearDate}
        tabIndex={0}
        aria-label={`${fieldName} ${HookInlineFormStrings.clear}`}
      />
    </div>
  );
};

export default HookDateControl;
