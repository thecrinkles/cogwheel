# Actions

Actions are functions that run as part of a transition. They can be attached to a transition (`actions`), to entering a state (`_entry`) or to leaving a state (`_exit`). Use them for side-effects (start a request, log) or to change the machine through `send` and `assign`.

Every action receives a single argument:

```ts
import { machine, type CwAction } from 'cogwheel';

type Context = { count: number };
type CounterEvent = { type: 'INC'; by?: number } | { type: 'RESET' };

const log: CwAction<Context, CounterEvent> = ({ state, event, send, assign }) => {
  state; // { current, id, context }: a snapshot of the machine
  event; // the event that triggered the transition
  send; // send(event, delay?): trigger the next transition
  assign; // assign(context): replace the context
};
```

> `_entry` and `_exit` are reserved keys of a state and cannot be used as event names.

```ts
const states = {
  green: {
    CHANGE: { target: 'red', actions: [log] },
  },
  red: {
    RESET: 'green',
    _entry: [log],
    _exit: [log, log],
  },
} as const;
```

Multiple actions run in their defined order. On a transition the order is: guard, `_exit` of the current state, `actions` of the transition, state change, `_entry` of the new state, listeners. The `_entry` actions of the initial state run when the machine is created, with the event `{ type: '__init__' }`.

## send

`send(event, delay?)` triggers a new transition from inside an action. With a delay in milliseconds the transition is scheduled. Only one delayed transition is pending at a time; any new `send` cancels it, which makes a debounce a small machine:

```ts
const debounce = machine({
  init: 'idle',
  states: {
    idle: { CHANGED: 'debouncing' },
    debouncing: {
      CHANGED: 'debouncing',
      GO: 'executing',
      _entry: [({ send }) => send({ type: 'GO' }, 300)],
    },
    executing: { FINISHED: 'idle' },
  },
});
```

Every `CHANGED` re-enters `debouncing`, which cancels the pending `GO` and schedules a new one. Without a delay the transition runs synchronously, before the remaining actions in the list.

## assign

`assign(context)` replaces the context of the machine. The context is deep-frozen, so build a new object instead of mutating the existing one.

```ts
const increment: CwAction<Context, CounterEvent> = ({ state, event, assign }) => {
  if (event.type === 'INC') assign({ count: state.context.count + (event.by ?? 1) });
};

const counter = machine({
  init: 'idle',
  context: { count: 0 },
  states: {
    idle: { INC: { target: 'idle', actions: [increment] } },
  },
});

counter.send({ type: 'INC', by: 2 });
counter.context.count; // 2
```

## Listeners

Listeners receive the same argument as actions and run after every successful transition, after the `_entry` actions. A machine can have multiple listeners.

```ts
const remove = counter.listen(({ state, event }) => {
  console.log(state.current, event.type);
});

remove(); // unsubscribe to avoid memory leaks
```

## [Next: Hierarchical machines](./hierarchical-machines.md)
