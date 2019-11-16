# Simple opa-wasm node application

The application is in [app.js](./app.js) and shows loading a `*.wasm` file, initializing
the policy, and evaluating it with input.

## Install dependencies

This requires the `opa-wasm` package, see [package.json](./package.json) for details.

```bash
npm install
```

## Build the WebAssembly binary for the example policy:

There is an example policy included with the example, see [example.rego](./example.rego)

```bash
opa build -d example.rego 'data.example = x'
```

## Run the example Node JS code that invokes the Wasm binary:

```bash
node app.js '{"message": "world"}'
```

```bash
node app.js '{"message": "not-world"}'
```
