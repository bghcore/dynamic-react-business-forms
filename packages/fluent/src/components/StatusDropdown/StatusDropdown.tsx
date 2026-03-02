import { Dictionary } from "@brhanso/dynamic-forms-core";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import React from "react";
import { GetFieldDataTestId, onRenderDropdownItemWithIcon } from "../../helpers";
import StatusColor from "./StatusColor";

interface IStatusDropdownProps {
  className: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  fieldName: string;
  status: string;
  dropdownOptions: IDropdownOption[];
  meta?: Record<string, unknown>;
  onChange: (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => void;
}

const StatusDropdown = (props: IStatusDropdownProps) => {
  const { fieldName, programName, entityType, entityId, className, status, meta, dropdownOptions, onChange } = props;
  const statusColors = meta?.statusColors as Dictionary<string>;

  return (
    <div className={className}>
      <StatusColor statusColors={statusColors} status={status} />
      <Dropdown
        options={dropdownOptions}
        onChange={onChange}
        selectedKey={status}
        onRenderOption={onRenderDropdownItemWithIcon}
        calloutProps={{ className: "hook-status-dropdown-callout" }}
        data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
        {...meta}
      />
    </div>
  );
};

export default StatusDropdown;
