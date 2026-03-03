import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enableRuleTracing,
  disableRuleTracing,
  traceRuleEvent,
  getRuleTraceLog,
  clearRuleTraceLog,
  isRuleTracingEnabled,
  IRuleTraceEvent,
} from "../../helpers/RuleTracer";

describe("RuleTracer", () => {
  beforeEach(() => {
    disableRuleTracing();
    clearRuleTraceLog();
  });

  describe("enableRuleTracing", () => {
    it("enables tracing", () => {
      expect(isRuleTracingEnabled()).toBe(false);
      enableRuleTracing();
      expect(isRuleTracingEnabled()).toBe(true);
    });

    it("clears existing log when enabled", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "fieldA",
        triggerValue: "val",
        affectedField: "fieldB",
      });
      expect(getRuleTraceLog()).toHaveLength(1);

      // Re-enabling should clear the log
      enableRuleTracing();
      expect(getRuleTraceLog()).toHaveLength(0);
    });
  });

  describe("disableRuleTracing", () => {
    it("stops tracing", () => {
      enableRuleTracing();
      expect(isRuleTracingEnabled()).toBe(true);

      disableRuleTracing();
      expect(isRuleTracingEnabled()).toBe(false);
    });

    it("stops events from being logged after disabling", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "fieldA",
        triggerValue: "val",
        affectedField: "fieldB",
      });
      expect(getRuleTraceLog()).toHaveLength(1);

      disableRuleTracing();
      traceRuleEvent({
        type: "revert",
        triggerField: "fieldC",
        triggerValue: "val2",
        affectedField: "fieldD",
      });
      // Should still have only 1 event (the one added before disabling)
      expect(getRuleTraceLog()).toHaveLength(1);
    });
  });

  describe("traceRuleEvent", () => {
    it("adds events to the log when tracing is enabled", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "status",
        triggerValue: "Active",
        affectedField: "assignee",
        newState: { required: true },
      });

      const log = getRuleTraceLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe("apply");
      expect(log[0].triggerField).toBe("status");
      expect(log[0].triggerValue).toBe("Active");
      expect(log[0].affectedField).toBe("assignee");
      expect(log[0].newState).toEqual({ required: true });
    });

    it("is a no-op when tracing is disabled", () => {
      // Tracing is disabled by default (from beforeEach)
      traceRuleEvent({
        type: "apply",
        triggerField: "a",
        triggerValue: "v",
        affectedField: "b",
      });

      expect(getRuleTraceLog()).toHaveLength(0);
    });

    it("adds a timestamp to each event", () => {
      enableRuleTracing();
      const beforeTime = Date.now();
      traceRuleEvent({
        type: "init",
        triggerField: "fieldA",
        triggerValue: null,
        affectedField: "fieldB",
      });
      const afterTime = Date.now();

      const log = getRuleTraceLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(log[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("records all event types correctly", () => {
      enableRuleTracing();
      const types: IRuleTraceEvent["type"][] = [
        "revert",
        "apply",
        "combo",
        "dropdown",
        "order",
        "init",
      ];

      types.forEach((type) => {
        traceRuleEvent({
          type,
          triggerField: "f",
          triggerValue: "v",
          affectedField: "a",
        });
      });

      const log = getRuleTraceLog();
      expect(log).toHaveLength(6);
      types.forEach((type, index) => {
        expect(log[index].type).toBe(type);
      });
    });

    it("preserves previousState and newState", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "trigger",
        triggerValue: "newVal",
        affectedField: "target",
        previousState: { hidden: false, required: false },
        newState: { hidden: true, required: true },
      });

      const event = getRuleTraceLog()[0];
      expect(event.previousState).toEqual({ hidden: false, required: false });
      expect(event.newState).toEqual({ hidden: true, required: true });
    });
  });

  describe("getRuleTraceLog", () => {
    it("returns all events in order", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "first",
        triggerValue: "1",
        affectedField: "a",
      });
      traceRuleEvent({
        type: "revert",
        triggerField: "second",
        triggerValue: "2",
        affectedField: "b",
      });
      traceRuleEvent({
        type: "combo",
        triggerField: "third",
        triggerValue: "3",
        affectedField: "c",
      });

      const log = getRuleTraceLog();
      expect(log).toHaveLength(3);
      expect(log[0].triggerField).toBe("first");
      expect(log[1].triggerField).toBe("second");
      expect(log[2].triggerField).toBe("third");
    });

    it("returns a copy of the log (not the internal array)", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });

      const log1 = getRuleTraceLog();
      const log2 = getRuleTraceLog();
      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });
  });

  describe("clearRuleTraceLog", () => {
    it("empties the log", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });
      traceRuleEvent({
        type: "revert",
        triggerField: "g",
        triggerValue: "w",
        affectedField: "b",
      });
      expect(getRuleTraceLog()).toHaveLength(2);

      clearRuleTraceLog();
      expect(getRuleTraceLog()).toHaveLength(0);
    });

    it("allows new events to be added after clearing", () => {
      enableRuleTracing();
      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });
      clearRuleTraceLog();
      traceRuleEvent({
        type: "order",
        triggerField: "g",
        triggerValue: "w",
        affectedField: "b",
      });

      const log = getRuleTraceLog();
      expect(log).toHaveLength(1);
      expect(log[0].type).toBe("order");
    });
  });

  describe("callback", () => {
    it("callback is called for each event when provided", () => {
      const callback = vi.fn();
      enableRuleTracing(callback);

      traceRuleEvent({
        type: "apply",
        triggerField: "fieldA",
        triggerValue: "val1",
        affectedField: "fieldB",
      });
      traceRuleEvent({
        type: "revert",
        triggerField: "fieldC",
        triggerValue: "val2",
        affectedField: "fieldD",
      });

      expect(callback).toHaveBeenCalledTimes(2);

      // Verify the callback received the full event (with timestamp)
      const firstCallArg = callback.mock.calls[0][0] as IRuleTraceEvent;
      expect(firstCallArg.type).toBe("apply");
      expect(firstCallArg.triggerField).toBe("fieldA");
      expect(firstCallArg.timestamp).toBeDefined();

      const secondCallArg = callback.mock.calls[1][0] as IRuleTraceEvent;
      expect(secondCallArg.type).toBe("revert");
      expect(secondCallArg.triggerField).toBe("fieldC");
    });

    it("callback is not called when tracing is disabled", () => {
      const callback = vi.fn();
      enableRuleTracing(callback);
      disableRuleTracing();

      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("callback is cleared when disableRuleTracing is called", () => {
      const callback = vi.fn();
      enableRuleTracing(callback);

      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });
      expect(callback).toHaveBeenCalledTimes(1);

      disableRuleTracing();
      // Re-enable without callback
      enableRuleTracing();

      traceRuleEvent({
        type: "apply",
        triggerField: "g",
        triggerValue: "w",
        affectedField: "b",
      });
      // Original callback should not have been called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("works without a callback", () => {
      enableRuleTracing(); // No callback

      traceRuleEvent({
        type: "apply",
        triggerField: "f",
        triggerValue: "v",
        affectedField: "a",
      });

      // Should still log the event
      expect(getRuleTraceLog()).toHaveLength(1);
    });
  });

  describe("isRuleTracingEnabled", () => {
    it("returns false by default", () => {
      expect(isRuleTracingEnabled()).toBe(false);
    });

    it("returns true after enabling", () => {
      enableRuleTracing();
      expect(isRuleTracingEnabled()).toBe(true);
    });

    it("returns false after disabling", () => {
      enableRuleTracing();
      disableRuleTracing();
      expect(isRuleTracingEnabled()).toBe(false);
    });
  });
});
