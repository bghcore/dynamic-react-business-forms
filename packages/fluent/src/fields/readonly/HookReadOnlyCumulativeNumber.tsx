import { IFieldProps, isEmpty } from "@bghcore/dynamic-forms-core";
import React from "react";
import { useFormContext } from "react-hook-form";
import { ReadOnlyText, IReadOnlyFieldProps } from "../../components/ReadOnlyText";

interface IHookReadOnlyCumulativeNumberProps extends IReadOnlyFieldProps {
  dependencyFields?: string[];
}

const HookReadOnlyCumulativeNumber = (props: IFieldProps<IHookReadOnlyCumulativeNumberProps>) => {
  const { fieldName, config } = props;
  const { formState, getValues } = useFormContext();
  const [value, setValue] = React.useState<number>();
  const { dependencyFields } = config || {};

  React.useEffect(() => {
    const formValues = getValues();
    if (!isEmpty(dependencyFields)) {
      let totalCount = 0;
      (dependencyFields as string[]).map(fn => {
        totalCount += Number(formValues[fn]) || 0;
      });
      setValue(totalCount);
    }
  }, [formState]);

  return fieldName ? <ReadOnlyText fieldName={fieldName} value={String(value)} {...config} /> : <></>;
};

export default HookReadOnlyCumulativeNumber;
