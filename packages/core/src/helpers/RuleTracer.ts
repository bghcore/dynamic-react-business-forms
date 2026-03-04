import { IRuntimeFieldState } from "../types/IRuntimeFieldState";

export interface IRuleTraceEvent {
  timestamp: number;
  type: "evaluate" | "apply" | "revert" | "init";
  triggerField: string;
  triggerValue: unknown;
  affectedField: string;
  ruleId?: string;
  previousState?: Partial<IRuntimeFieldState>;
  newState?: Partial<IRuntimeFieldState>;
}

let traceEnabled = false;
let traceLog: IRuleTraceEvent[] = [];
let traceCallback: ((event: IRuleTraceEvent) => void) | null = null;

export function enableRuleTracing(callback?: (event: IRuleTraceEvent) => void): void {
  traceEnabled = true;
  traceLog = [];
  traceCallback = callback ?? null;
}

export function disableRuleTracing(): void {
  traceEnabled = false;
  traceCallback = null;
}

export function traceRuleEvent(event: Omit<IRuleTraceEvent, "timestamp">): void {
  if (!traceEnabled) return;
  const fullEvent = { ...event, timestamp: Date.now() };
  traceLog.push(fullEvent);
  traceCallback?.(fullEvent);
}

export function getRuleTraceLog(): IRuleTraceEvent[] {
  return [...traceLog];
}

export function clearRuleTraceLog(): void {
  traceLog = [];
}

export function isRuleTracingEnabled(): boolean {
  return traceEnabled;
}
