import { IHookFieldSharedProps, getDropdownValue, Dictionary } from "@brhanso/dynamic-forms-core";
import { IDropdownOption, IDropdownProps } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import StatusColor from "../components/StatusDropdown/StatusColor";
import StatusDropdown from "../components/StatusDropdown/StatusDropdown";
import { FieldClassName } from "../helpers";

export interface IHookStatusDropdownProps extends IDropdownProps {
  placeHolder?: string;
  statusColors?: Dictionary<string>;
}

const HookStatusDropdown = (props: IHookFieldSharedProps<IHookStatusDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, meta, dropdownOptions, setFieldValue } = props;

  const onChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    setFieldValue(fieldName, getDropdownValue(option));
  };

  return readOnly ? (
    <div className="hook-read-only-status-dropdown">
      <StatusColor statusColors={meta?.statusColors as Dictionary<string>} status={value as string} />
      <ReadOnlyText fieldName={fieldName} value={value as string} {...meta} />
    </div>
  ) : (
    <StatusDropdown
      className={FieldClassName("hook-status-dropdown", error)}
      fieldName={fieldName}
      programName={programName}
      entityType={entityType}
      entityId={entityId}
      dropdownOptions={dropdownOptions as IDropdownOption[]}
      status={value as string}
      onChange={onChange}
      meta={meta as unknown as Record<string, unknown>}
    />
  );
};

export default HookStatusDropdown;
