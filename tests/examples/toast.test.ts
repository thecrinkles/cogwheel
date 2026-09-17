import { test, expect } from "vitest";
import { machine } from "../../src";
import { CwEvent, CwState, CwAction } from "../../src";
import { delay } from "../helpers";

type Context = { label: string };
type ToastEvent = CwEvent & { label?: string };

const visibleAction: CwAction<Context, ToastEvent> = ({
  state,
  event,
  assign,
  send,
}) => {
  assign({ ...state.context, label: event.label || "" });
  send({ type: "CLOSED" }, 10);
};

const config: Record<string, CwState<Context, ToastEvent>> = {
  visible: {
    CLOSED: "invisible",
    OPENED: "visible",
    _entry: [visibleAction],
  },
  invisible: { OPENED: "visible" },
};

test("Toast - open toast", () => {
  const service = machine({
    init: "invisible",
    states: config,
  });
  expect(service.current).toBe("invisible");
  service.send({ type: "OPENED", label: "message" });
  expect(service.current).toBe("visible");
  expect(service.context.label).toBe("message");
});

test("Toast - auto close-toast", async () => {
  const service = machine({
    init: "invisible",
    states: config,
  });
  expect(service.current).toBe("invisible");
  service.send({ type: "OPENED", label: "message" });
  expect(service.current).toBe("visible");
  await delay(50);
  expect(service.current).toBe("invisible");
});

test("Toast - manual close-toast", () => {
  const service = machine({ init: "invisible", states: config });
  expect(service.current).toBe("invisible");
  service.send({ type: "OPENED", label: "message" });
  expect(service.current).toBe("visible");
  service.send({ type: "CLOSED" });
  expect(service.current).toBe("invisible");
});
