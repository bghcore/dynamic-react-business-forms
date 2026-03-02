/** Generic dropdown option (replaces @fluentui/react IDropdownOption in core) */
export interface IDropdownOption {
  key: string | number;
  text: string;
  disabled?: boolean;
  hidden?: boolean;
  selected?: boolean;
  title?: string;
  data?: unknown;
}
