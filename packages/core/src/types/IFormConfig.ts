import { IFieldConfig } from "./IFieldConfig";
import { IWizardConfig } from "./IWizardConfig";

/**
 * Top-level form configuration (v2 schema).
 *
 * Wraps all field definitions, ordering, wizard config, and form-level settings
 * into a single versioned object. This replaces the loose Dictionary<IFieldConfig> pattern.
 */
export interface IFormConfig {
  /** Schema version. Must be 2. */
  version: 2;
  /** Field definitions keyed by field name. */
  fields: Record<string, IFieldConfig>;
  /** Default field display order. If omitted, uses Object.keys(fields) order. */
  fieldOrder?: string[];
  /** Multi-step wizard configuration. */
  wizard?: IWizardConfig;
  /** Form-level settings. */
  settings?: IFormSettings;
}

/** Form-level settings */
export interface IFormSettings {
  /** Whether the form is in manual save mode (no auto-save on field change). */
  manualSave?: boolean;
  /** Timeout in ms for each save attempt. */
  saveTimeoutMs?: number;
  /** Maximum save retry attempts. */
  maxSaveRetries?: number;
  /** Number of visible fields before collapse. */
  expandCutoffCount?: number;
  /** Max height in px when collapsed. */
  collapsedMaxHeight?: number;
  /** Enable field filter/search input. */
  enableFilter?: boolean;
}
