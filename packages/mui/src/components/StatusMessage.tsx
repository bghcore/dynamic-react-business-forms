import { FormStrings } from "@bghcore/dynamic-forms-core";
import { CircularProgress } from "@mui/material";
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
          <span className="error-icon" style={{ color: "#d32f2f", fontSize: "16px" }}>&#9888;</span>
          <span className="error-message" id={id} role="alert">
            {error.message || "Error"}
          </span>
        </>
      ) : savePending ? (
        <>
          <span className="warning-icon" style={{ color: "#ed6c02", fontSize: "16px" }}>&#9888;</span>
          <span className="warning-message" id={id} role="alert">
            {FormStrings.autoSavePending} ({errorCount} {FormStrings.remaining})
          </span>
        </>
      ) : saving ? (
        <>
          <CircularProgress size={16} />
          <span className="save-message" id={id} role="alert">
            {FormStrings.saving}
          </span>
        </>
      ) : null}
    </div>
  );
};
