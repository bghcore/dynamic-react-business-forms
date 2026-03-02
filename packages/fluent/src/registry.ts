import { ComponentTypes, Dictionary } from "@brhanso/dynamic-forms-core";
import HookTextbox from "./fields/HookTextbox";
import HookNumber from "./fields/HookNumber";
import HookToggle from "./fields/HookToggle";
import HookDropdown from "./fields/HookDropdown";
import HookMultiSelect from "./fields/HookMultiSelect";
import HookDateControl from "./fields/HookDateControl";
import HookSlider from "./fields/HookSlider";
import HookFragment from "./fields/HookFragment";
import HookSimpleDropdown from "./fields/HookSimpleDropdown";
import HookMultiSelectSearch from "./fields/HookMultiSelectSearch";
import HookPopOutEditor from "./fields/HookPopOutEditor";
import HookDocumentLinks from "./fields/HookDocumentLinks";
import HookStatusDropdown from "./fields/HookStatusDropdown";
import HookReadOnly from "./fields/readonly/HookReadOnly";
import HookReadOnlyArray from "./fields/readonly/HookReadOnlyArray";
import HookReadOnlyDateTime from "./fields/readonly/HookReadOnlyDateTime";
import HookReadOnlyCumulativeNumber from "./fields/readonly/HookReadOnlyCumulativeNumber";
import HookReadOnlyRichText from "./fields/readonly/HookReadOnlyRichText";
import HookReadOnlyWithButton from "./fields/readonly/HookReadOnlyWithButton";
import React from "react";

/** Creates the default Fluent UI field registry for use with InjectedHookFieldProvider */
export function createFluentFieldRegistry(): Dictionary<JSX.Element> {
  return {
    [ComponentTypes.Textbox]: React.createElement(HookTextbox),
    [ComponentTypes.Number]: React.createElement(HookNumber),
    [ComponentTypes.Toggle]: React.createElement(HookToggle),
    [ComponentTypes.Dropdown]: React.createElement(HookDropdown),
    [ComponentTypes.MultiSelect]: React.createElement(HookMultiSelect),
    [ComponentTypes.DateControl]: React.createElement(HookDateControl),
    [ComponentTypes.Slider]: React.createElement(HookSlider),
    [ComponentTypes.Fragment]: React.createElement(HookFragment),
    [ComponentTypes.SimpleDropdown]: React.createElement(HookSimpleDropdown),
    [ComponentTypes.MultiSelectSearch]: React.createElement(HookMultiSelectSearch),
    [ComponentTypes.Textarea]: React.createElement(HookPopOutEditor),
    [ComponentTypes.DocumentLinks]: React.createElement(HookDocumentLinks),
    [ComponentTypes.StatusDropdown]: React.createElement(HookStatusDropdown),
    [ComponentTypes.ReadOnly]: React.createElement(HookReadOnly),
    [ComponentTypes.ReadOnlyArray]: React.createElement(HookReadOnlyArray),
    [ComponentTypes.ReadOnlyDateTime]: React.createElement(HookReadOnlyDateTime),
    [ComponentTypes.ReadOnlyCumulativeNumber]: React.createElement(HookReadOnlyCumulativeNumber),
    [ComponentTypes.ReadOnlyRichText]: React.createElement(HookReadOnlyRichText),
    [ComponentTypes.ReadOnlyWithButton]: React.createElement(HookReadOnlyWithButton),
  };
}
