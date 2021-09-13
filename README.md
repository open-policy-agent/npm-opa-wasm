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
loadPolicy(policyWasm)
```
The `loadPolicy` function returns a Promise with the loaded policy.
Typically this means loading it in an `async` function like:

```javascript
const policy = await loadPolicy(policyWasm)
```

Or something like:

```javascript
loadPolicy(policyWasm).then(policy => {
    // evaluate or save the policy
}, error => {
    console.error("Failed to load policy: " + error)
})
```

The `policyWasm` needs to be either the raw byte array of
the compiled policy Wasm file, or a WebAssembly module.

For example:

```javascript
const fs = require('fs');

const policyWasm = fs.readFileSync('policy.wasm');
```

Alternatively the bytes can be pulled in remotely from a `fetch` or in some
cases (like CloudFlare Workers) the Wasm binary can be loaded directly into the
javascript context through external APIs.

### Evaluate the Policy

The loaded policy object returned from `loadPolicy()` has a couple of important
APIs for policy evaluation:

`setData(obj)` -- Provide an external `data` document for policy evaluation. Requires a JSON serializable object.
`evaluate(input)` -- Evaluates the policy using any loaded data and the supplied `input` document.

The `input` parameter must be a JSON string.

Example:

```javascript

input = '{"path": "/", "role": "admin"}';

loadPolicy(policyWasm).then(policy => {
    resultSet = policy.evaluate(input);
    if (resultSet == null) {
        console.error("evaluation error")
    }
    if (resultSet.length == 0) {
        console.log("undefined")
    }
    console.log("allowed = " + allowed[0].result);
}).catch( error => {
    console.error("Failed to load policy: ", error);
})
```

> For any `opa build` created WASM binaries the result set, when defined, will
   contain a `result` key with the value of the compiled entrypoint. See
  [https://www.openpolicyagent.org/docs/latest/wasm/](https://www.openpolicyagent.org/docs/latest/wasm/)
  for more details.

### Writing the policy

See [https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/](https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/)

### Compiling the policy

Either use the [Compile REST API](https://www.openpolicyagent.org/docs/latest/rest-api/#compile-api) or `opa build` CLI tool.

For example, with OPA v0.20.5+:

```bash
opa build -t wasm -e 'example/allow' example.rego
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
