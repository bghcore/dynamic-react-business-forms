import { IEntityData } from "../utils";
import { IValidationRule } from "../types/IValidationRule";
import { ICondition } from "../types/ICondition";
import { evaluateCondition } from "./ConditionEvaluator";

/**
 * Unified validator function signature.
 * Handles sync, async, and cross-field validation.
 *
 * @param value - The field's current value
 * @param params - Parameters from IValidationRule.params
 * @param context - Full form context (values, field name, abort signal)
 * @returns Error message string, undefined if valid, or a Promise for async
 */
export type ValidatorFn = (
  value: unknown,
  params: Record<string, unknown> | undefined,
  context: IValidationContext
) => string | undefined | Promise<string | undefined>;

export interface IValidationContext {
  fieldName: string;
  values: IEntityData;
  signal?: AbortSignal;
}

// --- Built-in validators ---

const required: ValidatorFn = (value) => {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return "This field is required";
  }
  return undefined;
};

const email: ValidatorFn = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? undefined : "Invalid email address";
};

const phone: ValidatorFn = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(value) ? undefined : "Invalid phone number";
};

const url: ValidatorFn = (value) => {
  if (!value || typeof value !== "string") return undefined;
  return /(http(s?)):\/\//i.test(value) ? undefined : "Invalid URL";
};

const year: ValidatorFn = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const y = parseInt(value, 10);
  if (isNaN(y) || y < 1900 || y > 2100) return "Invalid year";
  return undefined;
};

const noSpecialCharacters: ValidatorFn = (value) => {
  if (!value || typeof value !== "string") return undefined;
  return /[^a-zA-Z0-9\s\-_.]/.test(value) ? "Special characters are not allowed" : undefined;
};

const currency: ValidatorFn = (value) => {
  if (!value && value !== 0) return undefined;
  const str = typeof value === "string" ? value : String(value);
  return /^-?\d{1,}(\.\d{1,2})?$/.test(str) ? undefined : "Invalid currency format";
};

const uniqueInArray: ValidatorFn = (value) => {
  if (!value || !Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  for (const item of value) {
    const str = String(item);
    if (seen.has(str)) return `Duplicate value: ${str}`;
    seen.add(str);
  }
  return undefined;
};

const minLength: ValidatorFn = (value, params) => {
  if (!value || typeof value !== "string") return undefined;
  const min = Number(params?.min ?? 0);
  return value.length < min ? `Must be at least ${min} characters` : undefined;
};

const maxLength: ValidatorFn = (value, params) => {
  if (!value || typeof value !== "string") return undefined;
  const max = Number(params?.max ?? Infinity);
  return value.length > max ? `Must be at most ${max} characters` : undefined;
};

const numericRange: ValidatorFn = (value, params) => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "Must be a number";
  const min = Number(params?.min ?? -Infinity);
  const max = Number(params?.max ?? Infinity);
  if (num < min || num > max) return `Must be between ${min} and ${max}`;
  return undefined;
};

const pattern: ValidatorFn = (value, params) => {
  if (!value || typeof value !== "string") return undefined;
  const regex = params?.pattern;
  const message = (params?.message as string) ?? "Invalid format";
  if (!regex) return undefined;
  try {
    return new RegExp(regex as string).test(value) ? undefined : message;
  } catch {
    return undefined;
  }
};

const maxKb: ValidatorFn = (value, params) => {
  if (!value || typeof value !== "string") return undefined;
  const maxKbValue = Number(params?.maxKb ?? 150);
  const sizeKb = Math.ceil(new Blob([value]).size / 1000);
  return sizeKb > maxKbValue ? `Content exceeds maximum size of ${maxKbValue}KB` : undefined;
};

const requiredIf: ValidatorFn = (value, params, context) => {
  if (!params?.field || !params?.values) return undefined;
  const depValue = context.values[params.field as string];
  const allowedValues = params.values as string[];
  if (allowedValues.includes(String(depValue)) && (value == null || value === "")) {
    return "This field is required";
  }
  return undefined;
};

// --- Registry ---

const defaultValidators: Record<string, ValidatorFn> = {
  required,
  email,
  phone,
  url,
  year,
  noSpecialCharacters,
  currency,
  uniqueInArray,
  minLength,
  maxLength,
  numericRange,
  pattern,
  maxKb,
  requiredIf,
  // Legacy name aliases
  EmailValidation: email,
  PhoneNumberValidation: phone,
  YearValidation: year,
  isValidUrl: url,
  NoSpecialCharactersValidation: noSpecialCharacters,
  CurrencyValidation: currency,
  UniqueInArrayValidation: uniqueInArray,
  Max150KbValidation: (v, _p, c) => maxKb(v, { maxKb: 150 }, c),
  Max32KbValidation: (v, _p, c) => maxKb(v, { maxKb: 32 }, c),
};

let validatorRegistry: Record<string, ValidatorFn> = { ...defaultValidators };

/** Register custom validators (merge into registry) */
export function registerValidators(custom: Record<string, ValidatorFn>): void {
  validatorRegistry = { ...validatorRegistry, ...custom };
}

/** Get a validator by name */
export function getValidator(name: string): ValidatorFn | undefined {
  return validatorRegistry[name];
}

/** Get a copy of the full registry */
export function getValidatorRegistry(): Record<string, ValidatorFn> {
  return { ...validatorRegistry };
}

/** Reset registry to defaults (for testing) */
export function resetValidatorRegistry(): void {
  validatorRegistry = { ...defaultValidators };
}

/**
 * Run all validation rules for a field value.
 * Handles sync, async, and conditional validation.
 */
export async function runValidations(
  value: unknown,
  rules: IValidationRule[],
  context: IValidationContext
): Promise<string | undefined> {
  for (const rule of rules) {
    if (context.signal?.aborted) return undefined;

    // Check conditional validation
    if (rule.when) {
      if (!evaluateCondition(rule.when, context.values)) continue;
    }

    const validator = getValidator(rule.name);
    if (!validator) continue;

    const result = validator(value, rule.params, context);
    const message = result instanceof Promise ? await result : result;

    if (message) {
      return rule.message ?? message;
    }
  }
  return undefined;
}

/**
 * Run only sync validation rules (no await, fast fail).
 */
export function runSyncValidations(
  value: unknown,
  rules: IValidationRule[],
  context: IValidationContext
): string | undefined {
  for (const rule of rules) {
    if (rule.async) continue;

    if (rule.when) {
      if (!evaluateCondition(rule.when, context.values)) continue;
    }

    const validator = getValidator(rule.name);
    if (!validator) continue;

    const result = validator(value, rule.params, context);
    if (typeof result === "string") {
      return rule.message ?? result;
    }
  }
  return undefined;
}

// --- Factory helpers for common validators ---

export function createMinLengthRule(min: number, message?: string): IValidationRule {
  return { name: "minLength", params: { min }, message };
}

export function createMaxLengthRule(max: number, message?: string): IValidationRule {
  return { name: "maxLength", params: { max }, message };
}

export function createNumericRangeRule(min: number, max: number, message?: string): IValidationRule {
  return { name: "numericRange", params: { min, max }, message };
}

export function createPatternRule(pattern: string, message: string): IValidationRule {
  return { name: "pattern", params: { pattern, message } };
}

export function createRequiredIfRule(
  field: string,
  values: string[],
  message?: string
): IValidationRule {
  return { name: "requiredIf", params: { field, values }, message };
}
