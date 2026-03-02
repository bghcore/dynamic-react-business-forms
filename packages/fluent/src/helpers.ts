import { FieldError } from "react-hook-form";
import { IDropdownOption } from "@brhanso/dynamic-forms-core";
import { Icon, IDropdownOption as IFluentDropdownOption } from "@fluentui/react";
import React from "react";

export const FieldClassName = (className: string, error?: FieldError): string => {
  return error ? `${className} error` : className;
};

export const GetFieldDataTestId = (
  fieldName: string,
  programName?: string,
  entityType?: string,
  entityId?: string
): string => {
  return `${programName}-${entityType}-${entityId}-${fieldName}`;
};

export const onRenderDropdownItemWithIcon = (option: IFluentDropdownOption): JSX.Element => {
  return React.createElement(React.Fragment, null,
    option && React.createElement("div", { className: "dropdown-option" },
      option.data?.iconName && option.data?.iconTitle
        ? React.createElement(Icon, {
            className: "dropdown-icon",
            iconName: option.data.iconName,
            "aria-hidden": true,
            title: option.data.iconTitle,
            style: option.data.iconColor ? { color: option.data.iconColor } : undefined
          })
        : null,
      React.createElement("span", { title: option.title || option.text }, option.text)
    )
  );
};

export function formatDateTime(dateStr: string, options?: { hideTimestamp?: boolean }): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (options?.hideTimestamp) {
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Local strings for document links (replaces CPJStrings) */
export const DocumentLinksStrings = {
  link: "Link",
  addLink: "Add Link",
  addAnotherLink: "Add Another Link",
  deleteLink: "Delete Link",
  confirmDeleteLink: "Are you sure you want to delete",
  delete: "Delete",
  cancel: "Cancel",
  saveChanges: "Save Changes",
  save: "Save",
};
