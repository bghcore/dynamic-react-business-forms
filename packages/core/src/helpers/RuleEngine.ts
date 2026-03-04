import { IFieldConfig } from "../types/IFieldConfig";
import { IRule } from "../types/IRule";
import { IFieldEffect } from "../types/IFieldEffect";
import { IRuntimeFieldState, IRuntimeFormState } from "../types/IRuntimeFieldState";
import { IEntityData } from "../utils";
import { evaluateCondition, extractConditionDependencies } from "./ConditionEvaluator";
import { extractExpressionDependencies } from "./ExpressionEngine";

/**
 * Builds the dependency graph from field configs.
 * Returns adjacency lists: for each field, which other fields depend on it.
 */
export function buildDependencyGraph(
  fields: Record<string, IFieldConfig>
): Record<string, Set<string>> {
  const graph: Record<string, Set<string>> = {};
  const fieldNames = Object.keys(fields);

  for (const name of fieldNames) {
    graph[name] = new Set();
  }

  for (const [fieldName, config] of Object.entries(fields)) {
    if (config.rules) {
      for (const rule of config.rules) {
        // Fields referenced in the when condition
        const condDeps = extractConditionDependencies(rule.when);
        for (const dep of condDeps) {
          if (dep in graph) {
            graph[dep].add(fieldName);
          }
        }

        // Fields referenced in cross-field effects
        collectEffectTargets(rule.then, fieldName, graph);
        if (rule.else) {
          collectEffectTargets(rule.else, fieldName, graph);
        }
      }
    }

    // Computed value dependencies
    if (config.computedValue) {
      const exprDeps = extractExpressionDependencies(config.computedValue);
      for (const dep of exprDeps) {
        if (dep in graph) {
          graph[dep].add(fieldName);
        }
      }
    }
  }

  return graph;
}

function collectEffectTargets(
  effect: IFieldEffect,
  ownerField: string,
  graph: Record<string, Set<string>>
): void {
  if (effect.fields) {
    for (const targetField of Object.keys(effect.fields)) {
      if (targetField in graph) {
        // The field that owns this rule's condition depends on condition fields;
        // the target field is AFFECTED by the owner field's rule
        graph[ownerField]?.add(targetField);
      }
    }
  }
}

/**
 * Topological sort of field names using Kahn's algorithm.
 * Returns fields in dependency order. Detects cycles.
 */
export function topologicalSort(
  graph: Record<string, Set<string>>
): { sorted: string[]; hasCycle: boolean; cycleFields: string[] } {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  const fields = Object.keys(graph);

  for (const f of fields) {
    inDegree[f] = 0;
    adjacency[f] = [...graph[f]];
  }

  for (const f of fields) {
    for (const dep of adjacency[f]) {
      if (dep in inDegree) {
        inDegree[dep]++;
      }
    }
  }

  const queue: string[] = [];
  for (const f of fields) {
    if (inDegree[f] === 0) queue.push(f);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency[current]) {
      if (neighbor in inDegree) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      }
    }
  }

  const hasCycle = sorted.length < fields.length;
  const cycleFields = hasCycle ? fields.filter(f => !sorted.includes(f)) : [];
  return { sorted, hasCycle, cycleFields };
}

/**
 * Builds the default runtime field state from static field configs.
 */
export function buildDefaultFieldStates(
  fields: Record<string, IFieldConfig>,
  areAllFieldsReadonly?: boolean
): Record<string, IRuntimeFieldState> {
  const states: Record<string, IRuntimeFieldState> = {};
  const graph = buildDependencyGraph(fields);

  for (const [fieldName, config] of Object.entries(fields)) {
    states[fieldName] = {
      type: config.type,
      required: config.required,
      hidden: config.hidden || config.type === "DynamicFragment",
      readOnly: areAllFieldsReadonly ? true : config.readOnly,
      validate: config.validate,
      computedValue: config.computedValue,
      confirmInput: config.confirmInput,
      options: config.options,
      defaultValue: config.defaultValue,
      computeOnCreateOnly: config.computeOnCreateOnly,
      dependentFields: [...(graph[fieldName] ?? [])],
      dependsOnFields: [],
    };
  }

  // Wire up reverse dependencies
  for (const [fieldName, state] of Object.entries(states)) {
    for (const dep of state.dependentFields ?? []) {
      if (states[dep]) {
        states[dep].dependsOnFields = states[dep].dependsOnFields ?? [];
        states[dep].dependsOnFields!.push(fieldName);
      }
    }
  }

  return states;
}

/**
 * Evaluates all rules for all fields against current values.
 * Returns the full runtime form state.
 */
export function evaluateAllRules(
  fields: Record<string, IFieldConfig>,
  values: IEntityData,
  areAllFieldsReadonly?: boolean
): IRuntimeFormState {
  const fieldStates = buildDefaultFieldStates(fields, areAllFieldsReadonly);
  const fieldOrder = Object.keys(fields);

  // Apply rules in topological order for correct dependency resolution
  const graph = buildDependencyGraph(fields);
  const { sorted } = topologicalSort(graph);
  const evalOrder = sorted.length > 0 ? sorted : fieldOrder;

  let currentOrder = [...fieldOrder];

  for (const fieldName of evalOrder) {
    const config = fields[fieldName];
    if (!config?.rules) continue;

    const ruleResults = evaluateFieldRules(config.rules, values);

    // Apply self-effects
    applyEffectToState(fieldStates, fieldName, ruleResults.selfEffect);

    // Apply cross-field effects
    for (const [targetField, effect] of Object.entries(ruleResults.crossEffects)) {
      if (fieldStates[targetField]) {
        applyEffectToState(fieldStates, targetField, effect);
      }
    }

    // Apply field order changes
    if (ruleResults.fieldOrder) {
      currentOrder = ruleResults.fieldOrder;
    }
  }

  return { fieldStates, fieldOrder: currentOrder };
}

/**
 * Evaluates rules for fields that are transitively affected by a changed field.
 * Returns only the changed field states (incremental update).
 */
export function evaluateAffectedFields(
  changedField: string,
  fields: Record<string, IFieldConfig>,
  values: IEntityData,
  currentState: IRuntimeFormState
): IRuntimeFormState {
  // Find all transitively affected fields
  const affected = getTransitivelyAffectedFields(changedField, currentState.fieldStates);
  if (affected.size === 0) {
    return currentState;
  }

  const updatedStates = { ...currentState.fieldStates };
  let updatedOrder = [...currentState.fieldOrder];

  // Re-evaluate affected fields
  for (const fieldName of affected) {
    const config = fields[fieldName];
    if (!config) continue;

    // Reset to defaults first
    updatedStates[fieldName] = {
      ...updatedStates[fieldName],
      type: config.type,
      required: config.required,
      hidden: config.hidden || config.type === "DynamicFragment",
      readOnly: config.readOnly,
      validate: config.validate,
      computedValue: config.computedValue,
      confirmInput: config.confirmInput,
      options: config.options,
    };
  }

  // Re-apply all rules that could affect the changed fields
  // (from ALL fields, not just the changed one)
  for (const [ownerField, config] of Object.entries(fields)) {
    if (!config.rules) continue;

    const ruleResults = evaluateFieldRules(config.rules, values);

    // Apply self-effects if this field is affected
    if (affected.has(ownerField) || ownerField === changedField) {
      applyEffectToState(updatedStates, ownerField, ruleResults.selfEffect);
    }

    // Apply cross-field effects to affected fields
    for (const [targetField, effect] of Object.entries(ruleResults.crossEffects)) {
      if (affected.has(targetField) && updatedStates[targetField]) {
        applyEffectToState(updatedStates, targetField, effect);
      }
    }

    if (ruleResults.fieldOrder) {
      updatedOrder = ruleResults.fieldOrder;
    }
  }

  return { fieldStates: updatedStates, fieldOrder: updatedOrder };
}

function getTransitivelyAffectedFields(
  changedField: string,
  fieldStates: Record<string, IRuntimeFieldState>
): Set<string> {
  const affected = new Set<string>();
  const queue = [changedField];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = fieldStates[current]?.dependentFields ?? [];
    for (const dep of deps) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }

  return affected;
}

interface IRuleEvalResult {
  selfEffect: IFieldEffect;
  crossEffects: Record<string, IFieldEffect>;
  fieldOrder?: string[];
}

/**
 * Evaluates an array of rules for a single field.
 * Resolves priority conflicts (higher priority wins).
 */
function evaluateFieldRules(rules: IRule[], values: IEntityData): IRuleEvalResult {
  // Sort by priority (higher first) for conflict resolution
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const selfEffect: IFieldEffect = {};
  const crossEffects: Record<string, IFieldEffect> = {};
  let fieldOrder: string[] | undefined;

  for (const rule of sorted) {
    const conditionMet = evaluateCondition(rule.when, values);
    const effect = conditionMet ? rule.then : rule.else;

    if (!effect) continue;

    // Merge self-effects (first write wins due to priority sort)
    mergeEffect(selfEffect, effect);

    // Merge cross-field effects
    if (effect.fields) {
      for (const [targetField, targetEffect] of Object.entries(effect.fields)) {
        if (!crossEffects[targetField]) {
          crossEffects[targetField] = {};
        }
        mergeEffect(crossEffects[targetField], targetEffect);
      }
    }

    // Field order (highest priority rule wins)
    if (effect.fieldOrder && !fieldOrder) {
      fieldOrder = effect.fieldOrder;
    }
  }

  return { selfEffect, crossEffects, fieldOrder };
}

/**
 * Merges an effect into a target effect (first-write-wins for each property).
 */
function mergeEffect(target: IFieldEffect, source: IFieldEffect): void {
  if (source.required !== undefined && target.required === undefined) {
    target.required = source.required;
  }
  if (source.hidden !== undefined && target.hidden === undefined) {
    target.hidden = source.hidden;
  }
  if (source.readOnly !== undefined && target.readOnly === undefined) {
    target.readOnly = source.readOnly;
  }
  if (source.component !== undefined && target.component === undefined) {
    target.component = source.component;
  }
  if (source.options !== undefined && target.options === undefined) {
    target.options = source.options;
  }
  if (source.validate !== undefined && target.validate === undefined) {
    target.validate = source.validate;
  }
  if (source.computedValue !== undefined && target.computedValue === undefined) {
    target.computedValue = source.computedValue;
  }
}

function applyEffectToState(
  states: Record<string, IRuntimeFieldState>,
  fieldName: string,
  effect: IFieldEffect
): void {
  const state = states[fieldName];
  if (!state) return;

  if (effect.required !== undefined) state.required = effect.required;
  if (effect.hidden !== undefined) state.hidden = effect.hidden;
  if (effect.readOnly !== undefined) state.readOnly = effect.readOnly;
  if (effect.component !== undefined) state.type = effect.component;
  if (effect.options !== undefined) state.options = effect.options;
  if (effect.validate !== undefined) state.validate = effect.validate;
  if (effect.computedValue !== undefined) state.computedValue = effect.computedValue;
}
