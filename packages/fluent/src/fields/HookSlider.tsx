import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Slider } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookSliderProps {
  max?: number;
  min?: number;
  step?: number;
}

const HookSlider = (props: IFieldProps<IHookSliderProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, setFieldValue } = props;

  const onChange = (_: unknown, data: { value: number }) => {
    setFieldValue(fieldName, data.value);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={String(value)} />
  ) : (
    <Slider
      className={FieldClassName("hook-slider", error)}
      value={value as number}
      onChange={onChange}
      max={config?.max}
      min={config?.min}
      step={config?.step}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
    />
  );
};

export default HookSlider;
