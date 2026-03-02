import { HookInlineFormStrings } from "@brhanso/dynamic-forms-core";
import { Icon, Spinner, SpinnerSize } from "@fluentui/react";
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
          <Icon className="error-icon" iconName="Error" />
          <span className="error-message" id={id} role="alert">
            {error.message || "Error"}
          </span>
        </>
      ) : savePending ? (
        <>
          <Icon className="warning-icon" iconName="Warning" />
          <span className="warning-message" id={id} role="alert">
            {HookInlineFormStrings.autoSavePending} ({errorCount} {HookInlineFormStrings.remaining})
          </span>
        </>
      ) : saving ? (
        <>
          <Spinner size={SpinnerSize.xSmall} />
          <span className="save-message" id={id} role="alert">
            {HookInlineFormStrings.saving}
          </span>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};
