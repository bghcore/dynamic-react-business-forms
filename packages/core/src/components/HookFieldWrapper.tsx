import React from "react";
import { FieldError } from "react-hook-form";
import { HookInlineFormStrings } from "../strings";

interface IHookFieldWrapperProps {
  id?: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly error?: FieldError;
  readonly errorCount?: number;
  readonly savePending?: boolean;
  readonly saving?: boolean;
  readonly labelClassName?: string;
  readonly fieldClassName?: string;
  readonly showControlonSide?: boolean;
  readonly ariaLabel?: string;
  readonly ariaDescription?: string;
  readonly containerClassName?: string;
  readonly additionalInfo?: string;
  readonly additionalInfoIcon?: string;
  readonly additionalInfoComponent?: JSX.Element;
  isManualSave?: boolean;
}

export const HookFieldWrapper: React.FunctionComponent<React.PropsWithChildren<IHookFieldWrapperProps>> = (
  props: React.PropsWithChildren<IHookFieldWrapperProps>
) => {
  const {
    id,
    required,
    error,
    errorCount,
    savePending,
    saving,
    labelClassName,
    fieldClassName,
    showControlonSide,
    label,
    ariaLabel,
    ariaDescription,
    containerClassName,
    additionalInfo,
    additionalInfoComponent,
    isManualSave
  } = props;

  const labelId = `${id}_label`;
  const errorMessageId = `${id}_error`;
  const children = (Array.isArray(props.children) ? props.children : [props.children]) as React.ReactElement[];

  return (
    <div
      className={`form-field ${showControlonSide ? "flexBox" : ""} ${containerClassName || ""} ${
        saving ? "saving" : ""
      }`}
    >
      <div className={labelClassName || ""}>
        <label id={labelId} className="field-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
        {additionalInfoComponent}
        {!additionalInfoComponent && additionalInfo && (
          <span className="additional-info" title={additionalInfo}>
            &#9432;
          </span>
        )}
      </div>
      <div className={`flexBox-Direction-column field-container ${fieldClassName || ""}`}>
        {children.map((child, index) => {
          if (child && child.props) {
            const childProps: Record<string, unknown> = {
              "aria-labelledby": ariaLabel ? "" : labelId,
              "aria-label": ariaLabel || "",
              "aria-required": required,
              "aria-invalid": !!error,
              "aria-describedby": errorMessageId,
              key: index,
              className: child.props.className
            };

            if (!ariaDescription || (ariaDescription && error)) {
              delete childProps["aria-description"];
            } else {
              childProps["aria-description"] = ariaDescription;
            }

            return index === 0 ? React.cloneElement(child, childProps) : React.cloneElement(child, { key: index });
          } else {
            return <React.Fragment key={index} />;
          }
        })}
      </div>
      <div className="message">
        {error ? (
          <>
            <span className="error-icon" aria-hidden="true">&#10006;</span>
            <span className="error-message" id={id} role="alert">
              {error.message || "Error"}
            </span>
          </>
        ) : savePending ? (
          <>
            <span className="warning-icon" aria-hidden="true">&#9888;</span>
            <span className="warning-message" id={id} role="alert">
              {!isManualSave ? HookInlineFormStrings.autoSavePending : HookInlineFormStrings.savePending} (
              {`${errorCount} ${HookInlineFormStrings.remaining}`})
            </span>
          </>
        ) : saving ? (
          <>
            <span className="save-spinner" aria-hidden="true">&#8987;</span>
            <span className="save-message" id={id} role="alert">
              {HookInlineFormStrings.saving}
            </span>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
