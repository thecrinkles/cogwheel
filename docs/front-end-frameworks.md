# Front-end framework implementation

Cogwheel is framework agnostic. `service.listen` fires after every transition, which is all a framework binding needs.

## React hook example

```js
import { machine } from 'cogwheel';
import { useEffect, useReducer, useRef } from 'react';

export default function useMachine(config) {
  const [, rerender] = useReducer((c) => c + 1, 0);
  const service = useRef(machine(config));

  useEffect(() => service.current.listen(rerender), []);

  return service.current;
}
```

## Svelte store example

```ts
import { machine, type CwEvent, type CwMachineConfig, type CwMachineState } from 'cogwheel';
import { readable, type Readable } from 'svelte/store';

export type MachineStore<C extends object, E extends CwEvent> = {
  state: Readable<CwMachineState<C>>;
  send: (event: E, delay?: number) => boolean;
};

export function machineStore<C extends object, E extends CwEvent>(
  config: CwMachineConfig<C, E>,
): MachineStore<C, E> {
  const service = machine(config);
  const { current, id, context } = service;
  const state = readable<CwMachineState<C>>({ current, id, context }, (set) =>
    service.listen(({ state }) => set(state)),
  );

  return { state, send: service.send };
}
```

## [Next: state machine examples](./examples.md)
