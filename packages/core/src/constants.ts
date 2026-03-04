export const FIELD_PARENT_PREFIX = "Parent.";

/** Component type constants */
export const ComponentTypes = {
  Textbox: "Textbox",
  Dropdown: "Dropdown",
  Toggle: "Toggle",
  Number: "Number",
  MultiSelect: "Multiselect",
  DateControl: "DateControl",
  Slider: "Slider",
  Fragment: "DynamicFragment",
  SimpleDropdown: "SimpleDropdown",
  MultiSelectSearch: "MultiSelectSearch",
  PopOutEditor: "PopOutEditor",
  RichText: "RichText",
  Textarea: "Textarea",
  DocumentLinks: "DocumentLinks",
  StatusDropdown: "StatusDropdown",
  ReadOnly: "ReadOnly",
  ReadOnlyArray: "ReadOnlyArray",
  ReadOnlyDateTime: "ReadOnlyDateTime",
  ReadOnlyCumulativeNumber: "ReadOnlyCumulativeNumber",
  ReadOnlyRichText: "ReadOnlyRichText",
  ReadOnlyWithButton: "ReadOnlyWithButton",
  ChoiceSet: "ChoiceSet",
  FieldArray: "FieldArray",
} as const;

/** Form-level constants */
export const FormConstants = {
  defaultExpandCutoffCount: 12,
  loadingShimmerCount: 12,
  loadingFieldShimmerHeight: 32,
  na: "n/a",
  panelActionKeys: {
    cancel: "Cancel",
    close: "Close",
    create: "Create",
    update: "Update",
  },
  urlRegex: /(http(s?)):\/\//i,
  errorColor: "#a4262c",
} as const;

