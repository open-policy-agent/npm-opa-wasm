# Multi-entrypoint OPA-WASM node demo script

This script demos loading a WASM OPA file and simulates 1,000,000 evaluations on
a few different entrypoints to demonstrate how entrypoints can be used.

## Install dependencies

```bash
npm install
```

## Build the WebAssembly binary for the example policies

There are two example policies located in the ./policies directory, these are
compiled into a WASM. Look in the package.json to see how the entrypoints are
defined.

> Tested with OPA v0.27.1

```bash
npm run build
```

## Run the example Node JS code that invokes the Wasm binary:

```bash
npm start
```

Sample Output

```
Running multi entrypoint demo suite
Iterations: 100000 iterations of 10 inputs for 1000000 total evals per entrypoint
default entrypoint: 7.988s
example/one entrypoint (via string): 5.118s
example/one entrypoint (via number "1"): 5.057s
example/two/coolRule entrypoint (via string): 2.939s
example/two/coolRule entrypoint (via number "3"): 2.895s
Evaluate policy from default entrypoint
[
  {
    result: {
      two: { ourRule: true, coolRule: true, theirRule: true },
      one: { myOtherRule: true, myRule: true, myCompositeRule: true }
    }
  }
]
Evaluate policy from example/one entrypoint
[ { result: { myOtherRule: true, myRule: false } } ]
Evaluate policy from example/two/coolRule entrypoint
[ { result: true } ]
Evaluate policy from example/two entrypoint
[ { result: { ourRule: true, theirRule: false } } ]
```
