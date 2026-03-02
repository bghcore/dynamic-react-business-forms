import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import { ComboBox, IComboBox, IComboBoxOption, IComboBoxProps, Dropdown, IDropdownOption } from "@fluentui/react";
import React from "react";
import { FieldClassName, GetFieldDataTestId, onRenderDropdownItemWithIcon } from "../helpers";

interface IHookMultiSelectProps extends IComboBoxProps {}

const HookMultiSelectSearch = (props: IHookFieldSharedProps<IHookMultiSelectProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, dropdownOptions, setFieldValue } = props;

  const onMultiSelectChange = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
    if (!option) return;
    const currentValues = (value as string[]) || [];
    const newValues = option.selected
      ? [...currentValues, String(option.key)]
      : currentValues.filter(v => v !== String(option.key));
    setFieldValue(fieldName, newValues, false, 3000);
  };

  return readOnly ? (
    <>
      {value && (value as string[]).length > 0 ? (
        <Dropdown
          className="hook-multi-select-search-read-only"
          options={(value as string[]).map((v: string) => ({ key: v, text: v }))}
          multiSelect
          selectedKeys={value as string[]}
        />
      ) : (
        <></>
      )}
    </>
  ) : (
    <ComboBox
      className={FieldClassName("hook-multi-select-search", error)}
      options={(dropdownOptions as IComboBoxOption[]) || []}
      onChange={onMultiSelectChange}
      multiSelect
      allowFreeform
      autoComplete="on"
      selectedKey={value ? (value as string[]) : []}
      calloutProps={{ className: "hook-multi-select-search-callout" }}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookMultiSelectSearch;
