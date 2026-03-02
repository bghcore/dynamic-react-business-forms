import { IEntityData, SubEntityType } from "../utils";

export type ValueFunction = (context: {
  fieldName: string;
  fieldValue?: SubEntityType;
  parentEntity?: IEntityData;
  currentUserUpn?: string;
}) => SubEntityType;

const defaultValueFunctions: Record<string, ValueFunction> = {
  setDate: () => new Date(),
  setDateIfNull: ({ fieldValue }) => fieldValue ? fieldValue : new Date(),
  setLoggedInUser: ({ currentUserUpn }) => currentUserUpn ? { Upn: currentUserUpn } : undefined,
  inheritFromParent: ({ fieldName, parentEntity }) => parentEntity ? parentEntity[fieldName] as SubEntityType : undefined,
};

let valueFunctionRegistry: Record<string, ValueFunction> = { ...defaultValueFunctions };

export function registerValueFunctions(custom: Record<string, ValueFunction>): void {
  valueFunctionRegistry = { ...valueFunctionRegistry, ...custom };
}

export function getValueFunction(name: string): ValueFunction | undefined {
  return valueFunctionRegistry[name];
}

export function executeValueFunction(
  fieldName: string,
  valueFunction: string,
  fieldValue?: SubEntityType,
  parentEntity?: IEntityData,
  currentUserUpn?: string
): SubEntityType {
  const fn = valueFunctionRegistry[valueFunction];
  if (fn) {
    return fn({ fieldName, fieldValue, parentEntity, currentUserUpn });
  }
  return undefined;
}
