import { IHookFieldSharedProps } from "@brhanso/dynamic-forms-core";
import { ISliderProps, Slider } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookSliderProps extends ISliderProps {
  max?: number;
}

const HookSlider = (props: IHookFieldSharedProps<IHookSliderProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, setFieldValue } = props;

  const [sliderValue, setSliderValue] = React.useState<number>(value as number);

  React.useEffect(() => {
    setSliderValue(value as number);
  }, [value]);

  const onChange = (val: number) => {
    setSliderValue(val);
  };

  const onChanged = (event: MouseEvent | TouchEvent | KeyboardEvent, val: number) => {
    setFieldValue(fieldName, val);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={String(value)} />
  ) : (
    <Slider
      className={FieldClassName("hook-slider", error)}
      value={sliderValue}
      onChanged={onChanged}
      onChange={onChange}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookSlider;
