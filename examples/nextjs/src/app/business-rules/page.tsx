"use client";

import { Container, Typography, Paper, Alert } from "@mui/material";
import { HookInlineForm } from "@bghcore/dynamic-forms-core";
import FieldRegistrar from "@/components/FieldRegistrar";

const fieldConfigs = {
  type: {
    component: "Dropdown",
    label: "Issue Type",
    required: true,
    dropdownOptions: [
      { key: "bug", text: "Bug Report" },
      { key: "feature", text: "Feature Request" },
      { key: "question", text: "Question" },
    ],
    // When type changes, other fields react
    dependencies: {
      bug: {
        severity: { hidden: false, required: true },
        stepsToReproduce: { hidden: false, required: true },
        description: { component: "Textarea" },
      },
      feature: {
        severity: { hidden: true },
        stepsToReproduce: { hidden: true },
        description: { component: "Textarea" },
      },
      question: {
        severity: { hidden: true },
        stepsToReproduce: { hidden: true },
        description: { component: "Textbox" },
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
  stepsToReproduce: {
    component: "Textarea",
    label: "Steps to Reproduce",
    hidden: true,
  },
  description: {
    component: "Textbox",
    label: "Description",
    required: true,
  },
  priority: {
    component: "Dropdown",
    label: "Priority",
    dropdownOptions: [
      { key: "high", text: "High" },
      { key: "medium", text: "Medium" },
      { key: "low", text: "Low" },
    ],
  },
  assignee: {
    component: "Textbox",
    label: "Assignee",
  },
};

const defaultValues = {
  type: "",
  severity: "",
  stepsToReproduce: "",
  description: "",
  priority: "",
  assignee: "",
};

export default function BusinessRulesForm() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Business Rules</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Try changing &quot;Issue Type&quot; — watch how Severity, Steps to Reproduce,
        and Description react. Bug shows all fields, Feature hides severity/steps,
        Question switches Description to a single-line input.
      </Alert>
      <Paper sx={{ p: 3 }}>
        <FieldRegistrar>
          <HookInlineForm
            configName="businessRulesForm"
            programName="example"
            fieldConfigs={fieldConfigs}
            defaultValues={defaultValues}
            isManualSave={true}
            saveData={async (data) => {
              alert("Saved!\n\n" + JSON.stringify(data, null, 2));
              return data;
            }}
          />
        </FieldRegistrar>
      </Paper>
    </Container>
  );
}
