import { Label } from "@fluentui/react";
import React from "react";

export interface IReadOnlyFieldProps {
  readonly value?: string;
  readonly fieldName?: string;
  readonly labelClassName?: string;
  readonly valueClassName?: string;
  readonly showControlOnSide?: boolean;
  readonly containerClassName?: string;
  readonly ellipsifyTextCharacters?: number;
}

export const ReadOnlyText: React.FunctionComponent<IReadOnlyFieldProps> = (props: IReadOnlyFieldProps) => {
  const { value, fieldName, valueClassName, showControlOnSide, containerClassName, ellipsifyTextCharacters } = props;
  const classNameValue = valueClassName === undefined ? "read-only-field" : valueClassName;
  const cutoff = (ellipsifyTextCharacters || 0) - 3;

  return (
    <div className={`${showControlOnSide ? "flexBox" : ""} ${containerClassName ? containerClassName : ""}`}>
      <Label id={`${fieldName}-read-only`} className={classNameValue} title={value}>
        {value ? (
          <>
            {ellipsifyTextCharacters && value.length > ellipsifyTextCharacters
              ? `${value.substring(0, cutoff)}...`
              : value}
          </>
        ) : (
          <>-</>
        )}
      </Label>
    </div>
  );
};

export default ReadOnlyText;
