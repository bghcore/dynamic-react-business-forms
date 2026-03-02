import { IEntityData } from "../utils";
import { HookInlineFormConstants } from "../constants";

export type ValidationFunction = (value: unknown, entityData?: IEntityData) => string | undefined;

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

const defaultValidations: Record<string, ValidationFunction> = {
  EmailValidation: emailValidation,
  PhoneNumberValidation: phoneNumberValidation,
  YearValidation: yearValidation,
  Max150KbValidation: createMaxKbValidation(150),
  Max32KbValidation: createMaxKbValidation(32),
  isValidUrl,
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
