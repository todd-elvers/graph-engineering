import { Exception, List, Option, Task, TaskEither, These } from ".";

namespace Right {
  export const values = [1, 2, 3] as const;
  export const tasks = List.map(TaskEither.right)(values);
}

namespace Left {
  export const values = List.map(Exception.from)([4, 5, 6]);
  export const tasks = List.map(TaskEither.left)(values);
}

describe("Task", () => {
  describe("fromTaskEithers", () => {
    test("returns `Option.none` when given `[]`", async () =>
      expect(await Task.fromTaskEithers([])()).toEqual(Option.none));

    test("returns only `Right`s", async () =>
      expect(await Task.fromTaskEithers(Right.tasks)()).toEqual(
        Option.some(These.right(Right.values))
      ));

    test("returns only `Left`s", async () =>
      expect(await Task.fromTaskEithers(Left.tasks)()).toEqual(
        Option.some(These.left(Left.values))
      ));

    test("returns `Right`s and `Left`s", async () =>
      expect(
        await Task.fromTaskEithers([...Right.tasks, ...Left.tasks])()
      ).toEqual(Option.some(These.both(Left.values, Right.values))));
  });
});
