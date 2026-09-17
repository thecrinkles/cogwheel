import { test, expect } from "vitest";
import { machine } from "../../src";
import { CwMachineState, CwState, CwEvent, CwAction } from "../../src";

type O = Record<string, unknown>;
type Context = {
  values: O;
  errors: O;
};

type InitEvent = { type: string; values: O };
type ErrorEvent = { type: string; errors: O };
type ModifierEvent = { type: string; key: string; value: unknown };
type FormEvent = CwEvent | InitEvent | ModifierEvent | ErrorEvent;

function validator(ctx: Context) {
  if (ctx.values.key === "test") return {};
  return { key: "required" };
}

function isValid(s: CwMachineState<Context>) {
  const _res = validator(s.context);
  if (Object.keys(_res).length === 0) return true;
  return false;
}

const updateAction: CwAction<Context, FormEvent> = ({
  state,
  event,
  assign,
}) => {
  const _ctx = { ...state.context };
  const _e = event as ModifierEvent;
  _ctx.values[_e.key] = _e.value;
  _ctx.errors[_e.key] = "";
  assign(_ctx);
};

const initAction: CwAction<Context, FormEvent> = ({ event, assign }) => {
  assign({ values: (event as InitEvent).values, errors: {} });
};

const errorAction: CwAction<Context, FormEvent> = ({
  event,
  state,
  assign,
}) => {
  assign({
    ...state.context,
    errors: (event as ErrorEvent).errors,
  });
};

const validationAction: CwAction<Context, FormEvent> = ({ state, send }) => {
  if (isValid(state)) send({ type: "SUBMITTED" });
  else
    send({
      type: "REJECTED",
      errors: validator(state.context),
    } as ErrorEvent);
};

const config: Record<string, CwState<Context, FormEvent>> = {
  init: { LOADED: "ready" },
  ready: {
    CHANGED: "touched",
    _entry: [initAction],
  },
  touched: {
    CHANGED: "touched",
    SUBMITTED: "validating",
    _entry: [updateAction],
  },
  validating: {
    SUBMITTED: { target: "submitting", guard: isValid },
    REJECTED: { target: "invalid", guard: (ctx) => !isValid(ctx) },
    _entry: [validationAction],
  },
  invalid: {
    CHANGED: "touched",
    _entry: [errorAction],
  },
  submitting: { FINISHED: "ready" },
};

test("Form - happy flow", () => {
  const service = machine<Context, FormEvent>({ init: "init", states: config });
  expect(service.current).toBe("init");
  service.send({ type: "LOADED", values: { key: "" } });
  expect(service.current).toBe("ready");
  expect(service.context.values).toEqual({ key: "" });
  service.send({ type: "CHANGED", key: "key", value: "t" });
  expect(service.current).toBe("touched");
  expect(service.context.values).toEqual({ key: "t" });
  service.send({ type: "CHANGED", key: "key", value: "test" });
  expect(service.current).toBe("touched");
  expect(service.context.values).toEqual({ key: "test" });
  service.send({ type: "SUBMITTED" });
  expect(service.current).toBe("submitting");
  expect(service.context.values).toEqual({ key: "test" });
  service.send({ type: "FINISHED" });
  expect(service.current).toBe("ready");
});

test("Form - happy flow", () => {
  const service = machine<Context, FormEvent>({ init: "init", states: config });
  expect(service.current).toBe("init");
  service.send({ type: "LOADED", values: { key: "" } });
  expect(service.current).toBe("ready");
  expect(service.context.values).toEqual({ key: "" });
  service.send({ type: "CHANGED", key: "key", value: "t" });
  expect(service.current).toBe("touched");
  expect(service.context.values).toEqual({ key: "t" });
  service.send({ type: "CHANGED", key: "key", value: "" });
  expect(service.current).toBe("touched");
  expect(service.context.values).toEqual({ key: "" });
  service.send({ type: "SUBMITTED" });
  expect(service.current).toBe("invalid");
  expect(service.context.values).toEqual({ key: "" });
  expect(service.context.errors).toEqual({ key: "required" });
  service.send({ type: "CHANGED", key: "key", value: "t" });
  expect(service.current).toBe("touched");
  expect(service.context.values).toEqual({ key: "t" });
  expect(service.context.errors).toEqual({ key: "" });
});
