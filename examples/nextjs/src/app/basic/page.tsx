"use client";

import { Container, Typography, Paper, Box } from "@mui/material";
import { HookInlineForm } from "@bghcore/dynamic-forms-core";
import FieldRegistrar from "@/components/FieldRegistrar";

const fieldConfigs = {
  name: {
    component: "Textbox",
    label: "Full Name",
    required: true,
  },
  email: {
    component: "Textbox",
    label: "Email Address",
    required: true,
    validations: ["EmailValidation"],
  },
  department: {
    component: "Dropdown",
    label: "Department",
    required: true,
    dropdownOptions: [
      { key: "engineering", text: "Engineering" },
      { key: "design", text: "Design" },
      { key: "marketing", text: "Marketing" },
      { key: "sales", text: "Sales" },
    ],
  },
  newsletter: {
    component: "Toggle",
    label: "Subscribe to Newsletter",
  },
  notes: {
    component: "Textarea",
    label: "Additional Notes",
  },
};

const defaultValues = {
  name: "",
  email: "",
  department: "",
  newsletter: false,
  notes: "",
};

export default function BasicForm() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Basic Form</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Simple form with text inputs, a dropdown, toggle, and textarea.
        Name and email are required. Email uses built-in EmailValidation.
      </Typography>
      <Paper sx={{ p: 3 }}>
        <FieldRegistrar>
          <HookInlineForm
            configName="basicForm"
            programName="example"
            fieldConfigs={fieldConfigs}
            defaultValues={defaultValues}
            isManualSave={true}
            saveData={async (data) => {
              alert("Form saved!\n\n" + JSON.stringify(data, null, 2));
              return data;
            }}
          />
        </FieldRegistrar>
      </Paper>
    </Container>
  );
}
