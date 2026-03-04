import { IEntityData } from "../utils";
import { IWizardStep } from "../types/IWizardConfig";
import { IRuntimeFieldState } from "../types/IRuntimeFieldState";
import { evaluateCondition } from "./ConditionEvaluator";

export function getVisibleSteps(
  steps: IWizardStep[],
  entityData: IEntityData
): IWizardStep[] {
  return steps.filter(step => {
    if (!step.visibleWhen) return true;
    return evaluateCondition(step.visibleWhen, entityData);
  });
}

export function getStepFields(
  step: IWizardStep,
  fieldStates?: Record<string, IRuntimeFieldState>
): string[] {
  if (!fieldStates) return step.fields;
  return step.fields.filter(fieldName => {
    const state = fieldStates[fieldName];
    return !state?.hidden;
  });
}

export function getStepFieldOrder(
  steps: IWizardStep[],
  entityData: IEntityData
): string[] {
  const visibleSteps = getVisibleSteps(steps, entityData);
  return visibleSteps.flatMap(step => step.fields);
}

export function validateStepFields(
  step: IWizardStep,
  errors: Record<string, unknown>
): string[] {
  return step.fields.filter(fieldName => fieldName in errors);
}

export function isStepValid(
  step: IWizardStep,
  errors: Record<string, unknown>
): boolean {
  return validateStepFields(step, errors).length === 0;
}

export function getStepIndex(
  steps: IWizardStep[],
  stepId: string
): number {
  return steps.findIndex(s => s.id === stepId);
}
