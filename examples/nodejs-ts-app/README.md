# Simple opa-wasm node typescript application

The application is in [app.ts](./app.ts) and shows loading a `*.wasm` file,
initializing the policy, and evaluating it with input.

## Install dependencies

```bash
npm install
```

## Build the WebAssembly binary for the example policy

There is an example policy included with the example, see
[example.rego](./example.rego)

> Requires OPA v0.20.5+

```bash
npm run build
```

Note to Windows users using a PowerShell terminal: the way that PowerShell escapes characters is different from Bash. See [this](https://github.com/open-policy-agent/opa/issues/3953) for more information. In order to run this example in Windows, use double quotes when using the opa comand to build:

```
opa build -t wasm -e "example/hello" ./example.rego && tar xzf ./bundle.tar.gz /policy.wasm
```

The build script in the scripts section in package.json should be modified to use (escaped) double quotes:

```json
"build": "opa build -t wasm -e \"example/hello\" ./example.rego && tar xzf ./bundle.tar.gz /policy.wasm",
```

## Run the example Node JS code that invokes the Wasm binary:

```bash
npm run -- '{\"message\": \"world\"}'
```

```bash
npm run -- '{\"message\": \"not-world\"}'
```
