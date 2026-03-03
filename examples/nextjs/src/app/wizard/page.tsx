"use client";

import { useState } from "react";
import { Container, Typography, Paper, Button, Stack, Alert, Stepper, Step, StepLabel } from "@mui/material";
import { HookWizardForm, getVisibleSteps } from "@bghcore/dynamic-forms-core";
import type { IWizardStep } from "@bghcore/dynamic-forms-core";

const wizardConfig = {
  steps: [
    { id: "personal", title: "Personal Info", fields: ["firstName", "lastName", "email"] },
    { id: "employment", title: "Employment", fields: ["company", "role", "yearsExperience"] },
    { id: "preferences", title: "Preferences", fields: ["newsletter", "theme"] },
  ] as IWizardStep[],
  validateOnStepChange: false,
};

export default function WizardForm() {
  const [formValues] = useState({
    firstName: "", lastName: "", email: "",
    company: "", role: "", yearsExperience: "",
    newsletter: false, theme: "",
  });

  const visibleSteps = getVisibleSteps(wizardConfig.steps, formValues);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Wizard Form</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Multi-step form with Previous/Next navigation. All fields share a single
        react-hook-form context — cross-step business rules work automatically.
      </Alert>
      <Paper sx={{ p: 3 }}>
        <HookWizardForm
          wizardConfig={wizardConfig}
          entityData={formValues}
          renderStepContent={(fields) => (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Fields for this step: {fields.join(", ") || "none"}
            </Typography>
          )}
          renderStepHeader={({ step, stepIndex, totalSteps }) => (
            <Stepper activeStep={stepIndex} sx={{ mb: 3 }}>
              {visibleSteps.map((s) => (
                <Step key={s.id}>
                  <StepLabel>{s.title}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
          renderStepNavigation={({ goNext, goPrev, canGoNext, canGoPrev, currentStepIndex, steps }) => (
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={goPrev} disabled={!canGoPrev}>
                Previous
              </Button>
              {canGoNext ? (
                <Button variant="contained" onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" color="success" onClick={() => alert("Form submitted!")}>
                  Submit
                </Button>
              )}
            </Stack>
          )}
        />
      </Paper>
    </Container>
  );
}
