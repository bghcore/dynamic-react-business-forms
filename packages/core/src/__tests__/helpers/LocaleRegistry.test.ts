import { describe, it, expect, beforeEach } from "vitest";
import {
  registerLocale,
  getLocaleString,
  resetLocale,
  getCurrentLocale,
} from "../../helpers/LocaleRegistry";
import { FormStrings } from "../../strings";

describe("LocaleRegistry", () => {
  beforeEach(() => {
    resetLocale();
  });

  describe("getLocaleString", () => {
    it("returns English default for all keys", () => {
      expect(getLocaleString("required")).toBe("Required");
      expect(getLocaleString("save")).toBe("Save");
      expect(getLocaleString("cancel")).toBe("Cancel");
      expect(getLocaleString("saving")).toBe("Saving...");
      expect(getLocaleString("na")).toBe("N/A");
    });

    it("returns function types correctly", () => {
      const saveChangesTo = getLocaleString("saveChangesTo");
      expect(typeof saveChangesTo).toBe("function");
      expect(saveChangesTo("My Form")).toBe("Do you want to save your changes to My Form?");
    });

    it("returns validation error messages", () => {
      expect(getLocaleString("invalidUrl")).toBe("Invalid URL");
      expect(getLocaleString("invalidEmail")).toBe("Invalid email address");
      expect(getLocaleString("noSpecialCharacters")).toBe("Special characters are not allowed");
    });

    it("returns function-based validation messages", () => {
      const contentExceeds = getLocaleString("contentExceedsMaxSize");
      expect(contentExceeds(150)).toBe("Content exceeds maximum size of 150KB");

      const mustBeAtLeast = getLocaleString("mustBeAtLeastChars");
      expect(mustBeAtLeast(3)).toBe("Must be at least 3 characters");

      const mustBeBetween = getLocaleString("mustBeBetween");
      expect(mustBeBetween(1, 100)).toBe("Must be between 1 and 100");
    });
  });

  describe("registerLocale", () => {
    it("overrides specific keys while preserving others", () => {
      registerLocale({ required: "Obligatoire", save: "Sauvegarder" });

      expect(getLocaleString("required")).toBe("Obligatoire");
      expect(getLocaleString("save")).toBe("Sauvegarder");
      // Non-overridden keys fall back to English
      expect(getLocaleString("cancel")).toBe("Cancel");
      expect(getLocaleString("saving")).toBe("Saving...");
    });

    it("can be called multiple times (merges)", () => {
      registerLocale({ required: "Obligatoire" });
      registerLocale({ save: "Sauvegarder" });

      expect(getLocaleString("required")).toBe("Obligatoire");
      expect(getLocaleString("save")).toBe("Sauvegarder");
    });

    it("later calls override earlier calls", () => {
      registerLocale({ required: "Obligatoire" });
      registerLocale({ required: "Erforderlich" });

      expect(getLocaleString("required")).toBe("Erforderlich");
    });

    it("can override function-based strings", () => {
      registerLocale({
        saveChangesTo: (title: string) => `Voulez-vous sauvegarder ${title}?`,
      });

      const fn = getLocaleString("saveChangesTo");
      expect(fn("Mon Formulaire")).toBe("Voulez-vous sauvegarder Mon Formulaire?");
    });
  });

  describe("resetLocale", () => {
    it("resets to English defaults", () => {
      registerLocale({ required: "Obligatoire", save: "Sauvegarder" });
      resetLocale();

      expect(getLocaleString("required")).toBe("Required");
      expect(getLocaleString("save")).toBe("Save");
    });
  });

  describe("getCurrentLocale", () => {
    it("returns a copy of the full locale", () => {
      const locale = getCurrentLocale();

      expect(locale.required).toBe("Required");
      expect(locale.save).toBe("Save");
      expect(typeof locale.saveChangesTo).toBe("function");
    });

    it("returns a copy, not the original (mutation-safe)", () => {
      const locale = getCurrentLocale();
      locale.required = "Modified";

      expect(getLocaleString("required")).toBe("Required");
    });
  });

  describe("FormStrings integration", () => {
    it("resolves through locale registry by default (English)", () => {
      expect(FormStrings.required).toBe("Required");
      expect(FormStrings.save).toBe("Save");
      expect(FormStrings.cancel).toBe("Cancel");
      expect(FormStrings.saving).toBe("Saving...");
    });

    it("reflects locale changes dynamically", () => {
      registerLocale({ required: "Pflichtfeld", save: "Speichern" });

      expect(FormStrings.required).toBe("Pflichtfeld");
      expect(FormStrings.save).toBe("Speichern");
      // Non-overridden
      expect(FormStrings.cancel).toBe("Cancel");
    });

    it("reflects reset back to English", () => {
      registerLocale({ required: "Obligatoire" });
      expect(FormStrings.required).toBe("Obligatoire");

      resetLocale();
      expect(FormStrings.required).toBe("Required");
    });

    it("saveChangesTo getter returns the locale function", () => {
      const fn = FormStrings.saveChangesTo;
      expect(typeof fn).toBe("function");
      expect(fn("Test")).toBe("Do you want to save your changes to Test?");
    });
  });
});
