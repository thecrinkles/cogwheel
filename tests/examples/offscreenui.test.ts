/* eslint-disable @typescript-eslint/no-empty-object-type */
import { test, expect } from "vitest";
import { machine } from "../../src";
import { CwAction, CwEvent } from "../../src";
import { delay } from "../helpers";

const toggling: CwAction<{}, CwEvent> = ({ send }) => {
  send({ type: "TOGGLE" }, 10);
};

const config = {
  visible: { TOGGLE: "closing" },
  closing: {
    TOGGLE: "invisible",
    _entry: [toggling],
  },
  invisible: { TOGGLE: "opening" },
  opening: {
    TOGGLE: "visible",
    _entry: [toggling],
  },
} as const;

test("Offscreen UI - open", async () => {
  const service = machine({ init: "invisible", states: config });
  expect(service.current).toBe("invisible");
  service.send({ type: "TOGGLE" });
  expect(service.current).toBe("opening");
  await delay(10);
  expect(service.current).toBe("visible");
});

test("Offscreen UI - close", async () => {
  const service = machine({ init: "visible", states: config });
  expect(service.current).toBe("visible");
  service.send({ type: "TOGGLE" });
  expect(service.current).toBe("closing");
  await delay(10);
  expect(service.current).toBe("invisible");
});
