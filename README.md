**Work in Progress -- Contributions welcome!!**

# Open Policy Agent WebAssemby NPM Module

This is the source for the
[@open-policy-agent/opa-wasm](https://www.npmjs.com/package/@open-policy-agent/opa-wasm)
NPM module which is a small SDK for using WebAssembly (wasm) compiled
[Open Policy Agent](https://www.openpolicyagent.org/) Rego policies.

# Getting Started

## Install the module

```
npm install @open-policy-agent/opa-wasm
```

## Usage

There are only a couple of steps required to start evaluating the policy.

### Import the module

```javascript
const { loadPolicy } = require("@open-policy-agent/opa-wasm");
```

### Load the policy

```javascript
loadPolicy(policyWasm);
```

The `loadPolicy` function returns a Promise with the loaded policy. Typically
this means loading it in an `async` function like:

```javascript
const policy = await loadPolicy(policyWasm);
```

Or something like:

```javascript
loadPolicy(policyWasm).then((policy) => {
  // evaluate or save the policy
}, (error) => {
  console.error("Failed to load policy: " + error);
});
```

The `policyWasm` needs to be either the raw byte array of the compiled policy
Wasm file, or a WebAssembly module.

For example:

```javascript
const fs = require("fs");

const policyWasm = fs.readFileSync("policy.wasm");
```

Alternatively the bytes can be pulled in remotely from a `fetch` or in some
cases (like CloudFlare Workers) the Wasm binary can be loaded directly into the
javascript context through external APIs.

### Evaluate the Policy

The loaded policy object returned from `loadPolicy()` has a couple of important
APIs for policy evaluation:

`setData(data)` -- Provide an external `data` document for policy evaluation.

- `data` MUST be a serializable object or `ArrayBuffer`, which assumed to be a
  well-formed stringified JSON

`evaluate(input)` -- Evaluates the policy using any loaded data and the supplied
`input` document.

- `input` parameter MAY be an `object`, primitive literal or `ArrayBuffer`,
  which assumed to be a well-formed stringified JSON

> `ArrayBuffer` supported in the APIs above as a performance optimisation
> feature, given that either network or file system provided contents can easily
> be represented as `ArrayBuffer` in a very performant way.

Example:

```javascript
input = '{"path": "/", "role": "admin"}';

loadPolicy(policyWasm).then((policy) => {
  resultSet = policy.evaluate(input);
  if (resultSet == null) {
    console.error("evaluation error");
  } else if (resultSet.length == 0) {
    console.log("undefined");
  } else {
    console.log("allowed = " + resultSet[0].result);
  }
}).catch((error) => {
  console.error("Failed to load policy: ", error);
});
```

> For any `opa build` created WASM binaries the result set, when defined, will
> contain a `result` key with the value of the compiled entrypoint. See
> [https://www.openpolicyagent.org/docs/latest/wasm/](https://www.openpolicyagent.org/docs/latest/wasm/)
> for more details.

### Writing the policy

See
[https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/](https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/)

### Compiling the policy

Either use the
[Compile REST API](https://www.openpolicyagent.org/docs/latest/rest-api/#compile-api)
or `opa build` CLI tool.

For example, with OPA v0.20.5+:

```bash
opa build -t wasm -e example/allow example.rego
```

Which is compiling the `example.rego` policy file with the result set to
`data.example.allow`. The result will be an OPA bundle with the `policy.wasm`
binary included. See [./examples](./examples) for a more comprehensive example.

See `opa build --help` for more details.

## Development

### Lint and Format checks

This project is using Deno's
[lint](https://deno.land/manual@v1.14.0/tools/linter) and
[formatter](https://deno.land/manual@v1.14.0/tools/formatter) tools in CI. With
`deno`
[installed locally](https://deno.land/manual@v1.14.0/getting_started/installation),
the same checks can be invoked using `npm`:

- `npm run lint`
- `npm run fmt` -- this will fix the formatting
- `npm run fmt:check` -- this happens in CI

All of these operate on git-tracked files, so make sure you've committed the
code you'd like to see checked. Alternatively, you can invoke
`deno lint my_new_file.js` directly, too.

### Build

The published package provides four different entrypoints for consumption:

1. A CommonJS module for consumption with older versions of Node or those using
   `require()`:
   ```js
   const { loadPolicy } = require("@open-policy-agent/opa-wasm");
   ```
1. An ESM module for consumption with newer versions of Node:
   ```js
   import { loadPolicy } from "@open-policy-agent/opa-wasm";
   ```
1. An ESM module for consumption in modern browsers (this will contain all
   dependencies already bundled and can be used standalone).
   ```html
   <script type="module">
   import opa from 'https://unpkg.com/@open-policy-agent/opa-wasm@latest/dist/opa-wasm-browser.esm.js';
   opa.loadPolicy(...);
   </script>
   ```
1. A script for consumption in all browsers (this will export an `opa` global
   variable).
   ```js
   <script src="https://unpkg.com/@open-policy-agent/opa-wasm@latest/dist/opa-wasm-browser.js"></script>
   <script>
   opa.loadPolicy(...);
   </script>
   ```

The browser builds are generated in the `./build.sh` script and use
[`esbuild`][esbuild]. All exports are defined in the `exports` field in the
package.json file. More detials on how these work are described in the
[Conditional Exports][conditional-exports] documentation.

For TypeScript projects we also generate an opa.d.ts declaration file that will
give correct typings and is also defined under the `types` field in the
package.json.

[esbuild]: https://esbuild.github.io/
[conditional-exports]: https://nodejs.org/api/packages.html#conditional-exports
