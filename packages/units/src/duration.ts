import { pipe, Record } from "@grapheng/prelude";
import {
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from "graphql";
import Moment from "moment-timezone";

import {
  createInputOutputTypeExports,
  makeFieldsFromSimpleTable,
  makeNumberTableAsFunctions,
  squashToBaseUnit
} from "./utils/helpers";
import { SimpleUnit } from "./utils/simple-unit-creator";
import { StringsToNumbers } from "./utils/types";

export const relationships = {
  milliseconds: 1,
  seconds: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asSeconds(),
    toBaseUnit: (seconds: number) =>
      Moment.duration(seconds, "seconds").asMilliseconds()
  },
  minutes: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asMinutes(),
    toBaseUnit: (minutes: number) =>
      Moment.duration(minutes, "minutes").asMilliseconds()
  },
  hours: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asHours(),
    toBaseUnit: (hours: number) =>
      Moment.duration(hours, "hours").asMilliseconds()
  },
  days: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asDays(),
    toBaseUnit: (days: number) => Moment.duration(days, "days").asMilliseconds()
  },
  weeks: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asWeeks(),
    toBaseUnit: (weeks: number) =>
      Moment.duration(weeks, "weeks").asMilliseconds()
  },
  months: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asMonths(),
    toBaseUnit: (months: number) =>
      Moment.duration(months, "months").asMilliseconds()
  },
  years: {
    fromBaseUnit: (millis: number) => Moment.duration(millis).asYears(),
    toBaseUnit: (years: number) =>
      Moment.duration(years, "years").asMilliseconds()
  }
};

const Duration: SimpleUnit = pipe(
  relationships,
  makeNumberTableAsFunctions,
  refinedTable => ({
    inputType: new GraphQLInputObjectType({
      name: `DurationInput`,
      fields: pipe(
        refinedTable,
        Record.map(() => ({ type: GraphQLFloat }))
      )
    }),
    outputType: new GraphQLObjectType({
      name: `DurationOutput`,
      fields: {
        ...makeFieldsFromSimpleTable(refinedTable),
        humanized: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: (source: Partial<StringsToNumbers>) =>
            pipe(
              squashToBaseUnit(refinedTable, source),
              baseUnit => Moment.duration(baseUnit).humanize()
            )
        }
      }
    }) as GraphQLObjectType
  }),
  createInputOutputTypeExports
);

export default Duration;