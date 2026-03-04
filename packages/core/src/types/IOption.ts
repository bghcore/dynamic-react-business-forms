/** Dropdown/select option */
export interface IOption {
  /** The option value (used for selection state) */
  value: string | number;
  /** Display label shown to the user */
  label: string;
  /** Whether this option is disabled (visible but not selectable) */
  disabled?: boolean;
  /** Grouping label for option groups (e.g., select optgroup) */
  group?: string;
  /** Icon identifier for rendering alongside the label */
  icon?: string;
  /** Color indicator (e.g., for status badges) */
  color?: string;
}
