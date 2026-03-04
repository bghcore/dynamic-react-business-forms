import { IFieldProps, Dictionary } from "@bghcore/dynamic-forms-core";
import { Dropdown, Option } from "@fluentui/react-components";
import type { OptionOnSelectData } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import StatusColor from "../components/StatusDropdown/StatusColor";
import StatusDropdown from "../components/StatusDropdown/StatusDropdown";
import { FieldClassName } from "../helpers";

export interface IHookStatusDropdownProps {
  placeHolder?: string;
  statusColors?: Dictionary<string>;
}

const HookStatusDropdown = (props: IFieldProps<IHookStatusDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, config, options, setFieldValue } = props;

  const onOptionSelect = (_: unknown, data: OptionOnSelectData) => {
    setFieldValue(fieldName, data.optionValue);
  };

  return readOnly ? (
    <div className="hook-read-only-status-dropdown" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StatusColor statusColors={config?.statusColors as Dictionary<string>} status={value as string} />
      <ReadOnlyText fieldName={fieldName} value={value as string} />
    </div>
  ) : (
    <StatusDropdown
      className={FieldClassName("hook-status-dropdown", error)}
      fieldName={fieldName}
      programName={programName}
      entityType={entityType}
      entityId={entityId}
      dropdownOptions={options}
      status={value as string}
      onOptionSelect={onOptionSelect}
      meta={config as unknown as Record<string, unknown>}
    />
  );
};

export default HookStatusDropdown;
