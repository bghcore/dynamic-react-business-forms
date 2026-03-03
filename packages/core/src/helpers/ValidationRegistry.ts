import { IEntityData } from "../utils";
import { HookInlineFormConstants } from "../constants";

export type ValidationFunction = (value: unknown, entityData?: IEntityData) => string | undefined;

export type AsyncValidationFunction = (value: unknown, entityData?: IEntityData, signal?: AbortSignal) => Promise<string | undefined>;

const isValidUrl: ValidationFunction = (value) => {
  if (!value || typeof value !== "string") return undefined;
  return HookInlineFormConstants.urlRegex.test(value) ? undefined : "Invalid URL";
};

const emailValidation: ValidationFunction = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? undefined : "Invalid email address";
};

const phoneNumberValidation: ValidationFunction = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(value) ? undefined : "Invalid phone number";
};

const yearValidation: ValidationFunction = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const year = parseInt(value, 10);
  if (isNaN(year) || year < 1900 || year > 2100) return "Invalid year";
  return undefined;
};

const createMaxKbValidation = (maxKb: number): ValidationFunction => (value) => {
  if (!value || typeof value !== "string") return undefined;
  const sizeKb = Math.ceil(new Blob([value]).size / 1000);
  return sizeKb > maxKb ? `Content exceeds maximum size of ${maxKb}KB` : undefined;
};

// --- Extended validator factories ---

export const createMinLengthValidation = (min: number): ValidationFunction => (value) => {
  if (!value || typeof value !== "string") return undefined;
  return value.length < min ? `Must be at least ${min} characters` : undefined;
};

export const createMaxLengthValidation = (max: number): ValidationFunction => (value) => {
  if (!value || typeof value !== "string") return undefined;
  return value.length > max ? `Must be at most ${max} characters` : undefined;
};

export const createNumericRangeValidation = (min: number, max: number): ValidationFunction => (value) => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "Must be a number";
  if (num < min || num > max) return `Must be between ${min} and ${max}`;
  return undefined;
};

export const createPatternValidation = (regex: RegExp, message: string): ValidationFunction => (value) => {
  if (!value || typeof value !== "string") return undefined;
  return regex.test(value) ? undefined : message;
};

const noSpecialCharactersValidation: ValidationFunction = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const specialCharsRegex = /[^a-zA-Z0-9\s\-_.]/;
  return specialCharsRegex.test(value) ? "Special characters are not allowed" : undefined;
};

const currencyValidation: ValidationFunction = (value) => {
  if (!value && value !== 0) return undefined;
  const str = typeof value === "string" ? value : String(value);
  const currencyRegex = /^-?\d{1,}(\.\d{1,2})?$/;
  return currencyRegex.test(str) ? undefined : "Invalid currency format";
};

export const createRequiredIfValidation = (
  dependentFieldName: string,
  dependentFieldValues: string[]
): ValidationFunction => (value, entityData) => {
  if (!entityData) return undefined;
  const dependentValue = entityData[dependentFieldName];
  const isConditionMet = dependentFieldValues.includes(String(dependentValue));
  if (isConditionMet && (value == null || value === "")) {
    return "This field is required";
  }
  return undefined;
};

const uniqueInArrayValidation: ValidationFunction = (value) => {
  if (!value || !Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  for (const item of value) {
    const str = String(item);
    if (seen.has(str)) return `Duplicate value: ${str}`;
    seen.add(str);
  }
  return undefined;
};

const defaultValidations: Record<string, ValidationFunction> = {
  EmailValidation: emailValidation,
  PhoneNumberValidation: phoneNumberValidation,
  YearValidation: yearValidation,
  Max150KbValidation: createMaxKbValidation(150),
  Max32KbValidation: createMaxKbValidation(32),
  isValidUrl,
  NoSpecialCharactersValidation: noSpecialCharactersValidation,
  CurrencyValidation: currencyValidation,
  UniqueInArrayValidation: uniqueInArrayValidation,
};

let validationRegistry: Record<string, ValidationFunction> = { ...defaultValidations };

export function registerValidations(custom: Record<string, ValidationFunction>): void {
  validationRegistry = { ...validationRegistry, ...custom };
}

export function getValidation(name: string): ValidationFunction | undefined {
  return validationRegistry[name];
}

export function getValidationRegistry(): Record<string, ValidationFunction> {
  return { ...validationRegistry };
}

// --- Async validation registry ---

let asyncValidationRegistry: Record<string, AsyncValidationFunction> = {};

export function registerAsyncValidations(custom: Record<string, AsyncValidationFunction>): void {
  asyncValidationRegistry = { ...asyncValidationRegistry, ...custom };
}

export function getAsyncValidation(name: string): AsyncValidationFunction | undefined {
  return asyncValidationRegistry[name];
}

export function getAsyncValidationRegistry(): Record<string, AsyncValidationFunction> {
  return { ...asyncValidationRegistry };
}

// --- Cross-field validation registry ---

export type CrossFieldValidationFunction = (
  values: IEntityData,
  fieldName: string
) => string | undefined;

let crossFieldValidationRegistry: Record<string, CrossFieldValidationFunction> = {};

export function registerCrossFieldValidations(
  custom: Record<string, CrossFieldValidationFunction>
): void {
  crossFieldValidationRegistry = { ...crossFieldValidationRegistry, ...custom };
}

export function getCrossFieldValidation(
  name: string
): CrossFieldValidationFunction | undefined {
  return crossFieldValidationRegistry[name];
}
