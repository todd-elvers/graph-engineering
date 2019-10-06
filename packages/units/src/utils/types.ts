export interface NumberRelationshipFunctions {
  readonly toBaseUnit: (num: number) => number;
  readonly fromBaseUnit: (num: number) => number;
}

export type AllRelationships<T> = { [K in keyof T]: number };

export interface StringsToNumbers {
  readonly [key: string]: number;
}

export interface RatioTableWithNumbersOrRelationshipFunctions {
  readonly [key: string]: number | NumberRelationshipFunctions;
}

export interface RatioTableWithOnlyRelationshipFunctions {
  readonly [key: string]: NumberRelationshipFunctions;
}
