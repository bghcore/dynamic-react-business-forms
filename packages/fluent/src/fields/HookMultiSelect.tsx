import { IHookFieldSharedProps, getDropdownValue } from "@brhanso/dynamic-forms-core";
import { Dropdown, IDropdownOption, IDropdownProps } from "@fluentui/react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { FieldClassName, GetFieldDataTestId, onRenderDropdownItemWithIcon } from "../helpers";

interface IHookMultiSelectProps extends IDropdownProps {}

const HookMultiSelect = (props: IHookFieldSharedProps<IHookMultiSelectProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, dropdownOptions, setFieldValue } = props;

  const { watch } = useFormContext();
  const selectedOptions = watch(`${fieldName}` as const);

  const onChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    const optionValue = getDropdownValue(option);

    let newSelectedOptions: string[] = [];
    if (option.selected && !selectedOptions) {
      newSelectedOptions = [optionValue];
    } else if (option.selected) {
      newSelectedOptions = [...selectedOptions, optionValue];
    } else {
      newSelectedOptions = selectedOptions.filter((o: string) => o !== optionValue);
    }

    setFieldValue(fieldName, newSelectedOptions, false, 1500);
  };

  return readOnly ? (
    <>
      {value && (value as string[]).length > 0 ? (
        <Dropdown
          className="hook-multi-select-read-only"
          options={(value as string[]).map((v: string) => ({ key: v, text: v }))}
          multiSelect
          selectedKeys={value as string[]}
        />
      ) : (
        <></>
      )}
    </>
  ) : (
    <Dropdown
      className={FieldClassName("hook-multi-select", error)}
      options={dropdownOptions as IDropdownOption[]}
      onChange={onChange}
      multiSelect
      selectedKeys={value ? (value as string[]) : []}
      onRenderOption={onRenderDropdownItemWithIcon}
      calloutProps={{ className: "hook-multi-select-callout" }}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookMultiSelect;
