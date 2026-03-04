import { FormStrings } from "@bghcore/dynamic-forms-core";
import { Spinner } from "@fluentui/react-components";
import { ErrorCircleRegular, WarningRegular } from "@fluentui/react-icons";
import React from "react";
import { FieldError } from "react-hook-form";

interface IStatusMessageProps {
  id?: string;
  readonly error?: FieldError;
  readonly errorCount?: number;
  readonly savePending?: boolean;
  readonly saving?: boolean;
}

export const StatusMessage: React.FunctionComponent<IStatusMessageProps> = (props: IStatusMessageProps) => {
  const { id, error, errorCount, savePending, saving } = props;
  return (
    <div className="message">
      {error ? (
        <>
          <ErrorCircleRegular className="error-icon" />
          <span className="error-message" id={id} role="alert">
            {error.message || "Error"}
          </span>
        </>
      ) : savePending ? (
        <>
          <WarningRegular className="warning-icon" />
          <span className="warning-message" id={id} role="alert">
            {FormStrings.autoSavePending} ({errorCount} {FormStrings.remaining})
          </span>
        </>
      ) : saving ? (
        <>
          <Spinner size="tiny" />
          <span className="save-message" id={id} role="alert">
            {FormStrings.saving}
          </span>
        </>
      ) : null}
    </div>
  );
};
