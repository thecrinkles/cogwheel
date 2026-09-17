# Hierarchical machines

Cogwheel does not support hierarchical machines out of the box, but the API leaves enough freedom to build a simple (unoptimised) version: the outer machine keeps the current state of the inner machine in its context, and an action feeds every event through the inner machine. The complete example is in [tests/examples/hierarchical.test.ts](../tests/examples/hierarchical.test.ts).

1. Create an action that runs the event through an inner machine and stores the result in the context.

```js
function nestedTransition(states, init) {
  return function ({ state, event, assign }) {
    const inner = machine({ states, init: state.context.current || init });
    inner.send(event);
    assign({ current: inner.current });
  };
}
```

2. Create an action that transitions the outer machine once the inner machine reaches a certain state.

```js
function nestedExit(exit, type) {
  return function ({ state, send }) {
    if (state.context.current === exit) send({ type });
  };
}
```

3. Define the states of the inner machine.

```js
const inner = {
  walk: { START: 'blink' },
  blink: { FINISH: 'stop' },
  stop: {},
};
```

4. Define the outer machine. Every event of the inner machine needs a self-transition on the outer state, so the `_entry` actions run again and feed the event through.

```js
const outer = machine({
  init: 'red',
  context: { current: 'walk' },
  states: {
    green: {
      GO: { target: 'red', guard: ({ context }) => context.current === 'stop' },
      START: 'green',
      FINISH: 'green',
      _entry: [nestedTransition(inner, 'walk'), nestedExit('stop', 'GO')],
    },
    red: { GO: 'green' },
  },
});
```

## [Next: front-end framework implementation](./front-end-frameworks.md)
