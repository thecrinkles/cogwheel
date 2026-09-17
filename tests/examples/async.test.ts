import { test, expect, beforeEach } from "vitest";
import { machine } from "../../src";
import { CwAction, CwMachine, CwState, CwEvent } from "../../src";
import { delay } from "../helpers";

type Context = { label: string };
type AppEvent = CwEvent;
let service: CwMachine<Context, AppEvent>;

const pendingEntryAction: CwAction<Context, CwEvent> = async ({
  send,
  assign,
}) => {
  await delay(50);
  assign({ label: "test" });
  send({ type: "FINISHED" });
};

const config: Record<string, CwState<Context, AppEvent>> = {
  init: { STARTED: "pending" },
  pending: {
    FINISHED: "success",
    FAILED: "invalid",
    _entry: [pendingEntryAction],
  },
  success: {},
  invalid: {},
};

beforeEach(() => {
  service = machine<Context>({
    init: "init",
    states: config,
    context: { label: "" },
  });
});

test("async actions", async () => {
  expect(service.current).toBe("init");
  service.send({ type: "STARTED" });
  expect(service.current).toBe("pending");
  expect(service.context.label).toBe("");
  await delay(50);
  expect(service.current).toBe("success");
  expect(service.context.label).toBe("test");
});
