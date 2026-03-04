import { IFieldConfig } from "../../types/IFieldConfig";
import { IFormConfig } from "../../types/IFormConfig";

/** Simple text field with no rules */
export const simpleTextFieldConfigs: Record<string, IFieldConfig> = {
  name: {
    type: "Textbox",
    required: true,
    label: "Name",
  },
  description: {
    type: "Textbox",
    required: false,
    label: "Description",
  },
};

/** Fields with a single rule: when status="Active", priority becomes required */
export const singleDependencyConfigs: Record<string, IFieldConfig> = {
  status: {
    type: "Dropdown",
    required: true,
    label: "Status",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    rules: [
      {
        id: "status-active",
        when: { field: "status", operator: "equals", value: "Active" },
        then: { fields: { priority: { required: true } } },
        else: { fields: { priority: { required: false, hidden: true } } },
      },
    ],
  },
  priority: {
    type: "Dropdown",
    required: false,
    label: "Priority",
    options: [
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" },
    ],
  },
};

/** Fields with AND rule: notes required only when status=Active AND type=Bug */
export const comboDependencyConfigs: Record<string, IFieldConfig> = {
  status: {
    type: "Dropdown",
    required: true,
    label: "Status",
    options: [
      { value: "Active", label: "Active" },
      { value: "Closed", label: "Closed" },
    ],
  },
  type: {
    type: "Dropdown",
    required: true,
    label: "Type",
    options: [
      { value: "Bug", label: "Bug" },
      { value: "Feature", label: "Feature" },
    ],
  },
  notes: {
    type: "Textbox",
    required: false,
    label: "Notes",
    rules: [
      {
        id: "combo-active-bug",
        when: {
          operator: "and",
          conditions: [
            { field: "status", operator: "equals", value: "Active" },
            { field: "type", operator: "equals", value: "Bug" },
          ],
        },
        then: { required: true },
        else: { required: false },
      },
    ],
  },
};

/** Fields with dropdown filtering via rules */
export const dropdownDependencyConfigs: Record<string, IFieldConfig> = {
  country: {
    type: "Dropdown",
    required: true,
    label: "Country",
    options: [
      { value: "US", label: "US" },
      { value: "CA", label: "CA" },
    ],
    rules: [
      {
        id: "country-us",
        when: { field: "country", operator: "equals", value: "US" },
        then: {
          fields: {
            region: {
              options: [
                { value: "East", label: "East" },
                { value: "West", label: "West" },
                { value: "Central", label: "Central" },
              ],
            },
          },
        },
      },
      {
        id: "country-ca",
        when: { field: "country", operator: "equals", value: "CA" },
        then: {
          fields: {
            region: {
              options: [
                { value: "Ontario", label: "Ontario" },
                { value: "Quebec", label: "Quebec" },
                { value: "BC", label: "BC" },
              ],
            },
          },
        },
      },
    ],
  },
  region: {
    type: "Dropdown",
    required: true,
    label: "Region",
    options: [],
  },
};

/** Fields with order rules */
export const orderDependencyConfigs: Record<string, IFieldConfig> = {
  type: {
    type: "Dropdown",
    required: true,
    label: "Type",
    options: [
      { value: "Bug", label: "Bug" },
      { value: "Feature", label: "Feature" },
    ],
    rules: [
      {
        id: "order-bug",
        when: { field: "type", operator: "equals", value: "Bug" },
        then: { fieldOrder: ["type", "severity", "steps", "description"] },
      },
      {
        id: "order-feature",
        when: { field: "type", operator: "equals", value: "Feature" },
        then: { fieldOrder: ["type", "description", "priority"] },
      },
    ],
  },
  severity: {
    type: "Dropdown",
    required: false,
    label: "Severity",
    options: [
      { value: "Critical", label: "Critical" },
      { value: "Major", label: "Major" },
      { value: "Minor", label: "Minor" },
    ],
  },
  steps: { type: "Textbox", required: false, label: "Steps to Reproduce" },
  description: { type: "Textbox", required: false, label: "Description" },
  priority: {
    type: "Dropdown",
    required: false,
    label: "Priority",
    options: [
      { value: "High", label: "High" },
      { value: "Low", label: "Low" },
    ],
  },
};

/** Fields with hidden and readonly attributes */
export const hiddenReadonlyConfigs: Record<string, IFieldConfig> = {
  id: { type: "Textbox", required: false, readOnly: true, label: "ID" },
  secret: { type: "Textbox", required: false, hidden: true, label: "Secret" },
  name: { type: "Textbox", required: true, label: "Name" },
};

/** Fields with computed values */
export const valueFunctionConfigs: Record<string, IFieldConfig> = {
  createdDate: {
    type: "DateControl",
    required: false,
    readOnly: true,
    computedValue: "$fn.setDate()",
    computeOnCreateOnly: true,
    label: "Created Date",
  },
  modifiedDate: {
    type: "DateControl",
    required: false,
    readOnly: true,
    computedValue: "$fn.setDate()",
    label: "Modified Date",
  },
  name: {
    type: "Textbox",
    required: true,
    label: "Name",
  },
};

/** Fields with validations */
export const validationConfigs: Record<string, IFieldConfig> = {
  email: {
    type: "Textbox",
    required: true,
    label: "Email",
    validate: [{ name: "email" }],
  },
  phone: {
    type: "Textbox",
    required: false,
    label: "Phone",
    validate: [{ name: "phone" }],
  },
  website: {
    type: "Textbox",
    required: false,
    label: "Website",
    validate: [{ name: "url" }],
  },
};

/** Fields with confirmInput flag */
export const confirmInputConfigs: Record<string, IFieldConfig> = {
  trigger: {
    type: "Dropdown",
    required: true,
    label: "Trigger",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
    rules: [
      {
        when: { field: "trigger", operator: "equals", value: "Yes" },
        then: { fields: { confirmed: { } } },
      },
    ],
  },
  confirmed: {
    type: "Textbox",
    required: false,
    confirmInput: true,
    label: "Confirmed Field",
  },
};

/** Fields with component swap rule */
export const componentSwapConfigs: Record<string, IFieldConfig> = {
  mode: {
    type: "Dropdown",
    required: true,
    label: "Mode",
    options: [
      { value: "simple", label: "Simple" },
      { value: "advanced", label: "Advanced" },
    ],
    rules: [
      {
        when: { field: "mode", operator: "equals", value: "simple" },
        then: { fields: { detail: { component: "Textbox" } } },
        else: { fields: { detail: { component: "PopOutEditor" } } },
      },
    ],
  },
  detail: { type: "Textbox", required: false, label: "Detail" },
};

/** Circular dependency configs (for cycle detection tests) */
export const circularDependencyConfigs: Record<string, IFieldConfig> = {
  fieldA: {
    type: "Dropdown",
    required: false,
    label: "Field A",
    options: [{ value: "x", label: "X" }],
    rules: [
      {
        when: { field: "fieldA", operator: "equals", value: "x" },
        then: { fields: { fieldB: { required: true } } },
      },
    ],
  },
  fieldB: {
    type: "Dropdown",
    required: false,
    label: "Field B",
    options: [{ value: "y", label: "Y" }],
    rules: [
      {
        when: { field: "fieldB", operator: "equals", value: "y" },
        then: { fields: { fieldA: { required: true } } },
      },
    ],
  },
};

/** All fields readonly scenario */
export const allReadonlyConfigs: Record<string, IFieldConfig> = {
  name: { type: "Textbox", required: true, label: "Name" },
  status: {
    type: "Dropdown",
    required: false,
    label: "Status",
    options: [
      { value: "Open", label: "Open" },
      { value: "Closed", label: "Closed" },
    ],
  },
};

/** DynamicFragment configs */
export const fragmentConfigs: Record<string, IFieldConfig> = {
  fragment: { type: "DynamicFragment", label: "Fragment" },
  name: { type: "Textbox", required: true, label: "Name" },
};

/** Multiselect configs */
export const multiselectConfigs: Record<string, IFieldConfig> = {
  tags: {
    type: "Multiselect",
    required: false,
    label: "Tags",
    options: [
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "design", label: "Design" },
    ],
  },
};

/** Default value configs */
export const defaultValueConfigs: Record<string, IFieldConfig> = {
  status: {
    type: "Dropdown",
    required: true,
    label: "Status",
    defaultValue: "Open",
    options: [
      { value: "Open", label: "Open" },
      { value: "Closed", label: "Closed" },
    ],
  },
  name: { type: "Textbox", required: true, label: "Name" },
};

/** Full IFormConfig v2 example */
export const sampleFormConfig: IFormConfig = {
  version: 2,
  fields: singleDependencyConfigs,
  fieldOrder: ["status", "priority"],
  settings: {
    manualSave: false,
    expandCutoffCount: 12,
  },
};

/** IFormConfig with wizard */
export const wizardFormConfig: IFormConfig = {
  version: 2,
  fields: {
    name: { type: "Textbox", required: true, label: "Name" },
    email: { type: "Textbox", required: true, label: "Email", validate: [{ name: "email" }] },
    role: {
      type: "Dropdown",
      required: true,
      label: "Role",
      options: [
        { value: "admin", label: "Admin" },
        { value: "user", label: "User" },
      ],
    },
    permissions: {
      type: "Multiselect",
      required: false,
      label: "Permissions",
      options: [
        { value: "read", label: "Read" },
        { value: "write", label: "Write" },
        { value: "admin", label: "Admin" },
      ],
    },
  },
  fieldOrder: ["name", "email", "role", "permissions"],
  wizard: {
    steps: [
      { id: "basics", title: "Basic Info", fields: ["name", "email"] },
      { id: "access", title: "Access", fields: ["role", "permissions"] },
    ],
    linearNavigation: true,
    validateOnStepChange: true,
  },
};
