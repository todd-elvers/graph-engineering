import { pipe, Record } from "@grapheng/prelude";
import {
  graphql,
  GraphQLFieldResolver,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  printType
} from "graphql";
import gql from "graphql-tag";

import * as BasicRounder from "./basic-rounder";
import {
  NumberRelationshipFunctions,
  RatioTableWithNumbersOrRelationshipFunctions,
  RatioTableWithOnlyRelationshipFunctions,
  StringsToNumbers,
  StringsToNumbersOrNull
} from "./types";

export const extractResolvers = (
  object: GraphQLObjectType | GraphQLInputObjectType
): { readonly [fieldName: string]: GraphQLFieldResolver<any, any> } =>
  Object.entries(object.getFields()).reduce(
    (previous, [name, field]) => ({ ...previous, [name]: field.resolve }),
    {}
  );

export function expectSimpleObjectType(
  graphQLObjectType: GraphQLObjectType,
  value: any,
  queryString: string
): jest.Matchers<Promise<any>> {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        arbitraryRootField: {
          type: graphQLObjectType,
          resolve: () => value
        }
      }
    })
  });

  return expect(
    graphql(schema, `{ arbitraryRootField ${queryString} }`).then(response => {
      // tslint:disable-next-line:no-if-statement
      if (response.errors) throw new Error(response.errors[0].message);
      else return response.data && response.data.arbitraryRootField;
    })
  );
}

export const createRawTypeAndTypesDefs = <
  T extends GraphQLObjectType | GraphQLInputObjectType
>(
  type: T
) => ({
  typeDefs: gql`
    ${printType(type)}
  `,
  rawType: type
});

export const createGraphQLObjectTypeExports = <T extends GraphQLObjectType>(
  type: T
) => ({
  resolvers: extractResolvers(type),
  ...createRawTypeAndTypesDefs(type)
});

export const createSimpleUnitTypeExports = (obj: {
  readonly inputType: GraphQLInputObjectType;
  readonly outputType: GraphQLObjectType;
}) => ({
  inputType: createGraphQLInputObjectTypeExports(obj.inputType),
  outputType: createGraphQLObjectTypeExports(obj.outputType)
});

export const createGraphQLInputObjectTypeExports = <
  T extends GraphQLInputObjectType
>(
  type: T
) => createRawTypeAndTypesDefs(type);

export const makeNumberTableAsFunctions = <
  T extends RatioTableWithNumbersOrRelationshipFunctions<T>
>(
  table: T
): RatioTableWithOnlyRelationshipFunctions<T> =>
  pipe(
    table,
    Record.map(value =>
      typeof value === "number"
        ? {
            toBaseUnit: (num: number) => num * value,
            fromBaseUnit: (num: number) => num / value
          }
        : value
    ) as any
  );

export const explodeTypeFromBaseUnit = <
  T extends RatioTableWithOnlyRelationshipFunctions<T>
>(
  baseRatioTable: T,
  val: number
): StringsToNumbers<T> =>
  pipe(
    baseRatioTable,
    Record.map<NumberRelationshipFunctions, any>(value =>
      value.fromBaseUnit(val)
    ) as any
  );

export const makeFieldsFromSimpleTable = (
  table: RatioTableWithOnlyRelationshipFunctions
) =>
  pipe(
    table,
    Record.map(unitFunctions => ({
      type: new GraphQLNonNull(GraphQLFloat),
      args: { round: { type: BasicRounder.RoundingInputType } },
      resolve: (
        source: Partial<StringsToNumbersOrNull>,
        args: { readonly round: BasicRounder.RoundingArgs }
      ) =>
        pipe(
          squashToBaseUnit(table, source),
          unitFunctions.fromBaseUnit,
          num => BasicRounder.round(num, args.round)
        )
    }))
  );

export const squashToBaseUnit = (
  table: RatioTableWithOnlyRelationshipFunctions,
  source: Partial<StringsToNumbersOrNull>
): number =>
  pipe(
    source,
    Record.reduceWithIndex(
      0,
      (unit, previous, value) => previous + table[unit].toBaseUnit(value || 0)
    )
  );

export type NumberObj<T> = { [K in keyof T]: number };

export type PartialWithNulls<T> = { [P in keyof T]?: T[P] | null };

export const makeInputConverter = <T>(
  relationships: RatioTableWithOnlyRelationshipFunctions<T>
) => (source: Partial<StringsToNumbersOrNull<T>>): StringsToNumbers<T> =>
  pipe(
    squashToBaseUnit(relationships, source),
    val => explodeTypeFromBaseUnit(relationships, val)
  );
