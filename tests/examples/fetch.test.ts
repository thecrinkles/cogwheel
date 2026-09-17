import { test, expect, beforeEach } from "vitest";
import { machine } from "../../src";
import { CwAction, CwMachine, CwState, CwEvent } from "../../src";

type O = Record<string, unknown>;

type Context = { data: O | null; errors: O | null; valid: boolean };
type FetchEvent = CwEvent & { data?: unknown; errors?: unknown };
type ModifierEvent = CwEvent & { key: string; value: unknown };
type AppEvent = CwEvent | ModifierEvent | FetchEvent;

const successEntry: CwAction<Context, FetchEvent> = ({
  state,
  event,
  assign,
}) =>
  assign({
    ...state.context,
    data: event.data,
    errors: null,
    valid: true,
  } as Context);
const errorEntry: CwAction<Context, FetchEvent> = ({ state, event, assign }) =>
  assign({
    ...state.context,
    errors: event.errors,
    data: null,
    valid: false,
  } as Context);

const pendingEntry: CwAction<Context, FetchEvent> = ({ state, assign }) =>
  assign({ ...state.context, errors: null });

const invalidEntry: CwAction<Context, AppEvent> = ({
  state,
  event,
  assign,
}) => {
  const _e = event as ModifierEvent;
  assign({
    ...state.context,
    data: {
      ...state.context.data,
      [_e.key]: _e.value,
    },
    valid: false,
  });
};

const config: Record<string, CwState<Context, AppEvent>> = {
  idle: { STARTED: "pending" },
  pending: { FINISHED: "success", FAILED: "error", _entry: [pendingEntry] },
  success: { STARTED: "pending", MODIFIED: "invalid", _entry: [successEntry] },
  invalid: { MODIFIED: "invalid", _entry: [invalidEntry] },
  error: { STARTED: "pending", _entry: [errorEntry] },
};

let service: CwMachine<Context, AppEvent>;
const init: Context = { errors: null, data: null, valid: false };

beforeEach(() => {
  service = machine<Context>({
    init: "idle",
    states: config,
    context: init,
  });
});

test("fetch - success", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  expect(service.context).toEqual(init);
  service.send({ type: "FINISHED", data: { key: "test" } });
  expect(service.current).toBe("success");
  expect(service.context).toEqual({
    data: { key: "test" },
    errors: null,
    valid: true,
  });
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  expect(service.context).toEqual({
    data: { key: "test" },
    errors: null,
    valid: true,
  });
});

test("fetch - error", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  expect(service.context).toEqual(init);
  service.send({ type: "FAILED", errors: { key: "required" } });
  expect(service.current).toBe("error");
  expect(service.context).toEqual({
    errors: { key: "required" },
    data: null,
    valid: false,
  });
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  expect(service.context).toEqual({ errors: null, data: null, valid: false });
});

test("fetch - restart (not possible)", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
});

test("fetch - incorrect failed", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "STARTED" });
  service.send({ type: "FINISHED" });
  service.send({ type: "FAILED" });
  expect(service.current).toBe("success");
});

test("fetch - jump to success", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "FINISHED" });
  expect(service.current).toBe("idle");
});

test("fetch - invalidated & refetched", () => {
  expect(service.current).toBe("idle");
  service.send({ type: "STARTED" });
  service.send({ type: "FINISHED", data: { key: "test" } });
  service.send({ type: "MODIFIED", key: "key", value: "updated" });
  expect(service.current).toBe("invalid");
  expect(service.context).toEqual({
    errors: null,
    data: { key: "updated" },
    valid: false,
  });
});
