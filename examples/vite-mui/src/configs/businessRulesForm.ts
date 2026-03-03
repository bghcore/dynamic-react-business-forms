import { Dictionary } from "@bghcore/dynamic-forms-core";
import type { IFieldConfig } from "@bghcore/dynamic-forms-core";

export const businessRulesConfig: Dictionary<IFieldConfig> = {
  type: {
    component: "Dropdown",
    label: "Issue Type",
    required: true,
    dropdownOptions: [
      { key: "bug", text: "Bug Report" },
      { key: "feature", text: "Feature Request" },
      { key: "question", text: "Question" },
    ],
    dependencies: {
      bug: {
        severity: { hidden: false, required: true },
        steps: { hidden: false, required: true },
      },
      feature: {
        severity: { hidden: true },
        steps: { hidden: true },
      },
      question: {
        severity: { hidden: true },
        steps: { hidden: true },
      },
    },
  },
  severity: {
    component: "Dropdown",
    label: "Severity",
    hidden: true,
    dropdownOptions: [
      { key: "critical", text: "Critical" },
      { key: "major", text: "Major" },
      { key: "minor", text: "Minor" },
    ],
  },
  steps: { component: "Textarea", label: "Steps to Reproduce", hidden: true },
  description: { component: "Textbox", label: "Description", required: true },
  priority: {
    component: "Dropdown",
    label: "Priority",
    dropdownOptions: [
      { key: "high", text: "High" },
      { key: "medium", text: "Medium" },
      { key: "low", text: "Low" },
    ],
  },
};

export const businessRulesDefaults = { type: "", severity: "", steps: "", description: "", priority: "" };
