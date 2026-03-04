import { IEntityData, SubEntityType } from "../utils";

/**
 * Value function signature (v2).
 * Used in computed value expressions via $fn.name() syntax.
 */
export type ValueFunction = (context: IValueFunctionContext) => SubEntityType;

export interface IValueFunctionContext {
  fieldName: string;
  fieldValue?: SubEntityType;
  values: IEntityData;
  parentEntity?: IEntityData;
  currentUserId?: string;
}

// --- Built-in value functions ---

const defaultValueFunctions: Record<string, ValueFunction> = {
  setDate: () => new Date(),
  setDateIfNull: ({ fieldValue }) => fieldValue ? fieldValue : new Date(),
  setLoggedInUser: ({ currentUserId }) => currentUserId ? { id: currentUserId } : undefined,
  inheritFromParent: ({ fieldName, values }) => {
    const parent = values?.Parent as IEntityData | undefined;
    return parent ? parent[fieldName] as SubEntityType : undefined;
  },
};

let valueFunctionRegistry: Record<string, ValueFunction> = { ...defaultValueFunctions };

/** Register custom value functions (merge into registry) */
export function registerValueFunctions(custom: Record<string, ValueFunction>): void {
  valueFunctionRegistry = { ...valueFunctionRegistry, ...custom };
}

/** Get a value function by name */
export function getValueFunction(name: string): ValueFunction | undefined {
  return valueFunctionRegistry[name];
}

/** Execute a named value function */
export function executeValueFunction(
  fieldName: string,
  functionName: string,
  values: IEntityData,
  fieldValue?: SubEntityType,
  parentEntity?: IEntityData,
  currentUserId?: string
): SubEntityType {
  const fn = valueFunctionRegistry[functionName];
  if (fn) {
    return fn({ fieldName, fieldValue, values, parentEntity, currentUserId });
  }
  return undefined;
}

/** Reset registry to defaults (for testing) */
export function resetValueFunctionRegistry(): void {
  valueFunctionRegistry = { ...defaultValueFunctions };
}
