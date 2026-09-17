# Guards

A transition can be guarded. The guard receives the machine state (`{ current, id, context }`) and returns a boolean. The transition only fires when it returns `true`; otherwise nothing happens and `send` returns `false`. Guards are the place to make decisions based on the context.

```ts
import { machine, type CwGuard } from 'cogwheel';

type Context = { allowed: boolean };

const isAllowed: CwGuard<Context> = ({ context }) => context.allowed;

const service = machine({
  init: 'start',
  context: { allowed: false },
  states: {
    start: { CHANGE: { target: 'end', guard: isAllowed } },
    end: {},
  },
});

service.send({ type: 'CHANGE' }); // false, still in 'start'
```

Guards run before any action, so the `_exit` actions of the current state do not run when a guard rejects.

## [Next: actions](./actions.md)
