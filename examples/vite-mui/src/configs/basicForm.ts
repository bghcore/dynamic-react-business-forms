import { Dictionary } from "@bghcore/dynamic-forms-core";
import type { IFieldConfig } from "@bghcore/dynamic-forms-core";

export const basicFormConfig: Dictionary<IFieldConfig> = {
  name: { component: "Textbox", label: "Full Name", required: true },
  email: { component: "Textbox", label: "Email", required: true, validations: ["EmailValidation"] },
  phone: { component: "Textbox", label: "Phone", validations: ["PhoneNumberValidation"] },
  department: {
    component: "Dropdown",
    label: "Department",
    required: true,
    dropdownOptions: [
      { key: "engineering", text: "Engineering" },
      { key: "design", text: "Design" },
      { key: "marketing", text: "Marketing" },
    ],
  },
  newsletter: { component: "Toggle", label: "Subscribe to Newsletter" },
};

export const basicDefaults = { name: "", email: "", phone: "", department: "", newsletter: false };
