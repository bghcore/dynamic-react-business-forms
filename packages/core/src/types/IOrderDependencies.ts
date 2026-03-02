export interface OrderDependencyMap {
  [key: string]: OrderDependencies;
}

export type OrderDependencies = string[] | OrderDependencyMap;
