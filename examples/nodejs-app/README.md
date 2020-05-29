# Simple opa-wasm node application

The application is in [app.js](./app.js) and shows loading a `*.wasm` file, initializing
the policy, and evaluating it with input.

## Install dependencies

This requires the `opa-wasm` package, see [package.json](./package.json) for details.

```bash
npm install
```

> The example uses a local path, in "real" use-cases use the standard NPM module.

## Build the WebAssembly binary for the example policy:

> The syntax shown below requires OPA v0.20.5+

There is an example policy included with the example, see [example.rego](./example.rego)

```bash
opa build -t wasm -e 'example/hello' ./example.rego
tar -xzf ./bundle.tar.gz /policy.wasm
```

This will create a bundle tarball with the WASM binary included, and then unpack just the `policy.wasm` from the bundle.

## Run the example Node JS code that invokes the WASM binary:

```bash
node app.js '{"message": "world"}'
```
Produces:
```
[
  {
    "result": true
  }
]
```


```bash
node app.js '{"message": "not-world"}'
```
Produces:
```
[
  {
    "result": false
  }
]
```
