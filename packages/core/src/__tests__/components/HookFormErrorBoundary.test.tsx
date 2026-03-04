import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormErrorBoundary } from "../../components/HookFormErrorBoundary";

// Component that throws on demand
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div data-testid="child">Child content</div>;
};

describe("FormErrorBoundary", () => {
  // Suppress React error boundary console.error noise during tests
  let originalConsoleError: typeof console.error;
  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
    return () => {
      console.error = originalConsoleError;
    };
  });

  it("renders children normally when no error occurs", () => {
    render(
      <FormErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </FormErrorBoundary>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("catches error and shows default fallback", () => {
    render(
      <FormErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong: Test error/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("catches error and shows custom fallback", () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <div data-testid="custom-fallback">
        <span>Custom: {error.message}</span>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <FormErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText("Custom: Test error")).toBeInTheDocument();
  });

  it("resetError re-renders children", () => {
    // Use a ref-based approach: first render throws, after reset it does not
    let shouldThrow = true;

    const ConditionalThrower = () => {
      if (shouldThrow) {
        throw new Error("Initial error");
      }
      return <div data-testid="recovered">Recovered content</div>;
    };

    const { rerender } = render(
      <FormErrorBoundary>
        <ConditionalThrower />
      </FormErrorBoundary>
    );

    // Should show error state
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong: Initial error/)).toBeInTheDocument();

    // Fix the underlying issue
    shouldThrow = false;

    // Click Retry to reset the error boundary
    fireEvent.click(screen.getByText("Retry"));

    // Should now render children successfully
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("onError callback called with error info", () => {
    const onErrorCallback = vi.fn();

    render(
      <FormErrorBoundary onError={onErrorCallback}>
        <ThrowingComponent shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(onErrorCallback).toHaveBeenCalledTimes(1);
    const [error, errorInfo] = onErrorCallback.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error");
    expect(errorInfo).toBeDefined();
    expect(errorInfo.componentStack).toBeDefined();
  });
});
