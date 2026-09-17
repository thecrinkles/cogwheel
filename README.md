# Cogwheel - simple JavaScript state machines

![](https://github.com/thecrinkles/cogwheel/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/cogwheel.svg?style=flat)](https://www.npmjs.com/package/cogwheel)
[![NPM Downloads](https://img.shields.io/npm/dm/cogwheel.svg?style=flat)](https://www.npmjs.com/package/cogwheel)
[![Minified size](https://img.shields.io/bundlephobia/min/cogwheel?label=minified)](https://www.npmjs.com/package/cogwheel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple finite state machines that can be used for state/process management.

```ts
import { machine } from 'cogwheel';

const light = machine({
  init: 'green',
  states: {
    green: { CHANGE: 'yellow' },
    yellow: { CHANGE: 'red' },
    red: { CHANGE: 'green' },
  },
});

light.send({ type: 'CHANGE' });
light.current; // 'yellow', typed as 'green' | 'yellow' | 'red'
```

## Principles

Cogwheel is built around the following principles around state machines, and the library should be used as such:

- State transitions are synchronous & fire & forget by design;
- State transitions should not have side-effects, except for debugging purposes (e.g. console-log);
- The context should be serializable;
- All state & context mutations should be owned by the machine and its actions. This means as much (business) logic as possible should be included in the machine and its actions.

## Installation

```bash
npm install cogwheel
```

Cogwheel is published as an ES module with TypeScript types and has no dependencies. Node 20.19+ and 22.12+ can also `require()` it.

## [Getting started](./docs/getting-started.md)

## [Guards](./docs/guards.md)

## [Actions](./docs/actions.md)

## [Hierarchical machines](./docs/hierarchical-machines.md)

## [Front-end framework implementation](./docs/front-end-frameworks.md)

## [State machine examples](./docs/examples.md)

## Migration v4.x.x > v5.x.x

- The package is ESM-only.
- All exported types are prefixed with `Cw` and imported from `cogwheel` itself: `CwEvent`, `CwAction`, `CwActionInput`, `CwGuard`, `CwTransition`, `CwState`, `CwMachineConfig`, `CwMachineState`, `CwMachine`.
- `machine()` infers the state names from the config. A config declared in a separate `const` needs `as const`, otherwise its targets widen to `string`. See [getting started](./docs/getting-started.md#typescript).
- The returned machine is read-only in the types; at runtime writes were always ignored.
