import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { FieldWrapper } from "../../components/HookFieldWrapper";
import { FormProvider, useForm } from "react-hook-form";
import { DynamicForm } from "../../components/HookInlineForm";
import { RulesEngineProvider } from "../../providers/BusinessRulesProvider";
import { InjectedFieldProvider } from "../../providers/InjectedHookFieldProvider";

/** A minimal FormProvider wrapper for FieldWrapper tests */
const FormProviderWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("FieldWrapper render props", () => {
  it("renders the default label when no renderLabel prop is provided", () => {
    render(
      <FieldWrapper id="testField" label="Test Label" required={true}>
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();

    // The default required indicator should be present
    const requiredIndicator = screen.getByText("*");
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass("required-indicator");
  });

  it("renders custom renderLabel instead of the default label", () => {
    const customRenderLabel = vi.fn(
      (props: { id: string; labelId: string; label?: string; required?: boolean }) => (
        <div data-testid="custom-label">
          Custom: {props.label} {props.required ? "(required)" : ""}
        </div>
      )
    );

    render(
      <FieldWrapper
        id="testField"
        label="My Field"
        required={true}
        renderLabel={customRenderLabel}
      >
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    // Custom label should be rendered
    const customLabel = screen.getByTestId("custom-label");
    expect(customLabel).toBeInTheDocument();
    expect(customLabel).toHaveTextContent("Custom: My Field (required)");

    // renderLabel should have been called with proper props
    expect(customRenderLabel).toHaveBeenCalledWith({
      id: "testField",
      labelId: "testField_label",
      label: "My Field",
      required: true,
    });

    // Default label should NOT be rendered
    expect(screen.queryByClassName?.("field-label") ?? document.querySelector(".field-label")).toBeNull();
  });

  it("renders the default error display when no renderError prop is provided", () => {
    render(
      <FieldWrapper
        id="errorField"
        label="Error Field"
        error={{ type: "required", message: "This field is required" }}
      >
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    const errorMessage = screen.getByText("This field is required");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("error-message");
    expect(errorMessage).toHaveAttribute("role", "alert");
  });

  it("renders custom renderError instead of the default error display", () => {
    const customRenderError = vi.fn(
      (props: { id: string; error?: { type: string; message?: string }; errorCount?: number }) => (
        <div data-testid="custom-error">
          {props.error ? `Custom error: ${props.error.message}` : "No error"}
        </div>
      )
    );

    render(
      <FieldWrapper
        id="errorField"
        label="Error Field"
        error={{ type: "required", message: "Field is required" }}
        errorCount={2}
        renderError={customRenderError}
      >
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    // Custom error should be rendered
    const customError = screen.getByTestId("custom-error");
    expect(customError).toBeInTheDocument();
    expect(customError).toHaveTextContent("Custom error: Field is required");

    // renderError was called with proper props
    expect(customRenderError).toHaveBeenCalledWith({
      id: "errorField",
      error: { type: "required", message: "Field is required" },
      errorCount: 2,
    });

    // The default error-message span should NOT be present
    expect(document.querySelector(".error-message")).toBeNull();
  });

  it("renders custom renderStatus when provided (and no renderError)", () => {
    const customRenderStatus = vi.fn(
      (props: { id: string; saving?: boolean; savePending?: boolean; errorCount?: number; isManualSave?: boolean }) => (
        <div data-testid="custom-status">
          {props.saving ? "Saving..." : props.savePending ? "Pending..." : "Idle"}
        </div>
      )
    );

    render(
      <FieldWrapper
        id="statusField"
        label="Status Field"
        saving={true}
        renderStatus={customRenderStatus}
      >
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    const customStatus = screen.getByTestId("custom-status");
    expect(customStatus).toBeInTheDocument();
    expect(customStatus).toHaveTextContent("Saving...");

    // The default message div with save-spinner should NOT be present
    expect(document.querySelector(".save-spinner")).toBeNull();
  });

  it("falls back to default error+status display when neither renderError nor renderStatus provided", () => {
    render(
      <FieldWrapper
        id="savingField"
        label="Saving Field"
        saving={true}
      >
        <input data-testid="child-input" />
      </FieldWrapper>
    );

    // Default saving indicator should be rendered
    const spinner = document.querySelector(".save-spinner");
    expect(spinner).not.toBeNull();
  });
});

describe("DynamicForm formErrors", () => {
  /** Wraps DynamicForm with necessary providers */
  const renderWithProviders = (formErrors?: string[]) => {
    return render(
      <RulesEngineProvider>
        <InjectedFieldProvider>
          <DynamicForm
            configName="test"
            programName="testProgram"
            entityId="entity-1"
            entityType="TestEntity"
            fieldConfigs={{}}
            defaultValues={{}}
            formErrors={formErrors}
          />
        </InjectedFieldProvider>
      </RulesEngineProvider>
    );
  };

  it("displays error banner when formErrors has entries", () => {
    renderWithProviders(["Server error: invalid combination", "Cross-field validation failed"]);

    const errorBanner = document.querySelector(".form-errors");
    expect(errorBanner).not.toBeNull();
    expect(errorBanner).toHaveAttribute("role", "alert");

    expect(screen.getByText("Server error: invalid combination")).toBeInTheDocument();
    expect(screen.getByText("Cross-field validation failed")).toBeInTheDocument();

    // Should have two error items
    const errorItems = document.querySelectorAll(".form-error-item");
    expect(errorItems.length).toBe(2);
  });

  it("shows no banner when formErrors is an empty array", () => {
    renderWithProviders([]);

    const errorBanner = document.querySelector(".form-errors");
    expect(errorBanner).toBeNull();
  });

  it("shows no banner when formErrors is undefined", () => {
    renderWithProviders(undefined);

    const errorBanner = document.querySelector(".form-errors");
    expect(errorBanner).toBeNull();
  });
});
