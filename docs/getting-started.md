# Getting started

A state machine is created with the `machine` function. The result exposes the current state (`service.current`), the context (`service.context`) and a `send(event, delay?)` function to trigger transitions.

```ts
import { machine } from 'cogwheel';

const service = machine({
  init: 'green',
  states: {
    green: { CHANGE: 'yellow' },
    yellow: { CHANGE: 'red' },
    red: { CHANGE: 'green' },
  },
});

service.current; // 'green'
service.send({ type: 'CHANGE' });
service.current; // 'yellow'
service.send({ type: 'CHANGE' }, 3000); // transitions after 3 seconds
```

Events are objects with a `type` and any extra data you need. `send` returns `true` when the transition happened and `false` when the current state has no transition for the event or a [guard](./guards.md) rejected it. A delayed `send` always returns `true`. Only one delayed transition is pending at a time; any new `send` cancels it.

The returned machine is read-only. Writes to `service.current` or `service.context` are ignored at runtime and rejected by TypeScript. Use `send` and [actions](./actions.md) instead.

An invalid configuration throws when the machine is created: `invalid initial state` when `init` is not a state, `non-existing transition target` when a transition points to an unknown state.

## Stateless transitions

When the current state lives somewhere else, such as a database row or a request, `nextState(states, from, event, context?)` gives you the state that `from` moves to, or `undefined` when there is no transition. It does not keep a machine around.

```ts
import { nextState } from 'cogwheel';

nextState(states, 'green', { type: 'CHANGE' }); // 'yellow'
nextState(states, 'red', { type: 'UNKNOWN' }); // undefined
```

It only looks up the transition and runs its guard; no `_entry`, `_exit` or transition actions run. Pass the optional `context` when a guard needs it; it is passed as is, not copied or frozen.

## Context

The machine can carry a context, which makes it an 'extended finite state machine'. Provide the initial value with the `context` property of the configuration and read it via `service.context`. The context is deep-frozen; it changes through the `assign` function inside [actions](./actions.md). Actions, guards and listeners get the same object as `service.context`, so class instances and functions stay intact. Freezing doesn't reach inside a `Map`, `Set` or `Date`, so don't mutate those in place.

```ts
const counter = machine({
  init: 'idle',
  states: { idle: {} },
  context: { count: 0 },
});

counter.context.count; // 0
```

## TypeScript

Everything is inferred from the configuration. `service.current` is the union of the state names, `service.context` has the type of the initial context, and a typo in `init` or in a transition target is a compile error.

```ts
const typed = machine({
  init: 'green',
  states: {
    green: { CHANGE: 'yellow' },
    yellow: { CHANGE: 'gren' }, // error: 'gren' is not a state of this machine
  },
});

typed.current; // 'green' | 'yellow'
```

For a configuration declared with `as const`, `CwStatesOf` and `CwEventsOf` give its state names and event keys as unions.

```ts
import { machine, type CwStatesOf, type CwEventsOf } from 'cogwheel';

const config = {
  init: 'green',
  states: { green: { CHANGE: 'yellow' }, yellow: { CHANGE: 'green', RESET: 'green' } },
} as const;

type States = CwStatesOf<typeof config>; // 'green' | 'yellow'
type Events = CwEventsOf<typeof config>; // 'CHANGE' | 'RESET'
const light = machine(config);
```

Two things to know:

- A configuration declared in a separate `const` needs `as const`, otherwise TypeScript widens `'yellow'` to `string` before `machine` sees it.
- The event type is taken from your typed actions. Declare the events as a discriminated union and type the actions with `CwAction<Context, Event>`. The event keys in the configuration are then checked, `send` only accepts those events, and `event.type` narrows inside the action.

```ts
import { machine, type CwAction } from 'cogwheel';

type Context = { count: number };
type CounterEvent = { type: 'INC'; by?: number } | { type: 'RESET' };

const increment: CwAction<Context, CounterEvent> = ({ state, event, assign }) => {
  if (event.type === 'INC') assign({ count: state.context.count + (event.by ?? 1) });
};

const states = {
  idle: { INC: { target: 'counting', actions: [increment] } },
  counting: { INC: { target: 'counting', actions: [increment] }, RESET: 'idle' },
} as const;

const inferred = machine({ init: 'idle', context: { count: 0 }, states });

inferred.send({ type: 'INC', by: 2 });
inferred.current; // 'idle' | 'counting'
inferred.context.count; // number
inferred.send({ type: 'DEC' }); // error: not an event of this machine
```

All exported types:

| Type                                    | Describes                                                              |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `CwMachineConfig<C, E, S>`              | the argument of `machine`                                              |
| `CwMachine<C, E, S>`                    | the return value of `machine`                                          |
| `CwState<C, E, S>`                      | one entry of `states`                                                  |
| `CwTransition<C, E, S>`                 | the object form of a transition: `{ target, guard?, actions? }`        |
| `CwAction<C, E>`, `CwActionInput<C, E>` | an action and its argument                                             |
| `CwGuard<C>`                            | a guard                                                                |
| `CwMachineState<C>`                     | the `{ current, id, context }` snapshot given to actions and listeners |
| `CwEvent`                               | `{ type: string }`, the base of every event                            |

`C` is the context, `E` the event union and `S` the union of state names. `S` defaults to `string`; you only need it when annotating a configuration outside of `machine()`.

## [Next: guards](./guards.md)
