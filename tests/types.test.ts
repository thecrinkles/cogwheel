import { test, expect, expectTypeOf } from "vitest";
import { machine, type CwAction } from "../src";

// Type-level checks, verified by `pnpm typecheck`: expectTypeOf asserts exact
// types (no-op at runtime); the ts-expect-error lines assert rejections.
type Ctx = { count: number };
type Ev = { type: "INC"; by?: number } | { type: "RESET" };

// A discriminated event union narrows without casts
const inc: CwAction<Ctx, Ev> = ({ state, event, assign }) => {
  if (event.type === "INC")
    assign({ count: state.context.count + (event.by ?? 1) });
};

test("types - states, context and events are inferred from the config", () => {
  const service = machine({
    init: "idle",
    context: { count: 0 },
    states: {
      idle: { INC: { target: "counting", actions: [inc] } },
      counting: { INC: { target: "counting", actions: [inc] }, RESET: "idle" },
    },
  });

  expectTypeOf(service.current).toEqualTypeOf<"idle" | "counting">();
  expectTypeOf(service.context).toEqualTypeOf<Ctx>();
  expectTypeOf(service.send).parameter(0).toEqualTypeOf<Ev>();

  service.send({ type: "INC", by: 2 });
  expect(service.current).toBe("counting");
  expect(service.context.count).toBe(2);

  // @ts-expect-error not an event of this machine
  service.send({ type: "DEC" });
  // @ts-expect-error machine is read-only
  service.current = "idle";
});

test("types - config mistakes are compile errors", () => {
  // @ts-expect-error init must be a state
  expect(() => machine({ init: "nope", states: { a: {} } })).toThrow();
  // @ts-expect-error target must be a state
  expect(() => machine({ init: "a", states: { a: { GO: "b" } } })).toThrow();
  // @ts-expect-error event key must be one of the typed events
  machine({ init: "a", states: { a: { GOO: "a", _entry: [inc] } } });
});

test("types - pre-declared config keeps working with `as const`", () => {
  const states = { on: { TOGGLE: "off" }, off: { TOGGLE: "on" } } as const;
  const service = machine({ init: "on", states });
  expectTypeOf(service.current).toEqualTypeOf<"on" | "off">();
  expect(service.current).toBe("on");
});
