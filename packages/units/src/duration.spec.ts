import Duration, { relationships } from "./duration";
import {
  expectSimpleObjectType,
  getObjectKeysAsSelection
} from "./utils/helpers";

const allDurationFieldsSelection = getObjectKeysAsSelection(relationships);

describe("duration", () => {
  describe("a few basic use cases work as expected", () => {
    test("that 60 seconds makes the correct durations", () => {
      expectSimpleObjectType(
        Duration.outputType.rawType,
        { seconds: 60 },
        allDurationFieldsSelection
      ).resolves.toEqual({
        milliseconds: 60000,
        seconds: 60,
        minutes: 1,
        hours: 0.016666666666666666,
        days: 0.0006944444444444445,
        weeks: 0.0000992063492063492,
        months: 0.000022815891724904232,
        years: 0.000001901324310408686
      });
    });

    test("that combinations of measurements come up with the right totals", () => {
      expectSimpleObjectType(
        Duration.outputType.rawType,
        { seconds: 60, minutes: 3, milliseconds: 60000 },
        allDurationFieldsSelection
      ).resolves.toEqual({
        milliseconds: 300000,
        seconds: 300,
        minutes: 5,
        hours: 0.08333333333333333,
        days: 0.003472222222222222,
        weeks: 0.000496031746031746,
        months: 0.00011407945862452114,
        years: 0.000009506621552043427
      });
    });
  });
});