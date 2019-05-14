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

### Import the module and initialize a Rego object

```javascript
const Rego = require("@open-policy-agent/opa-wasm")

rego = new Rego()
```

### Load the policy

```javascript
rego.load_policy(policy_wasm)
```
The `load_policy` request returns a Promise with the loaded policy.
Typically this means loading it in an `async` function like:

```javascript
const policy = await rego.load_policy(policy_wasm)
```

Or something like:

```javascript
rego.load_policy(policy_wasm).then(policy => {
    // evaluate or save the policy
}, error => {
    console.error("Failed to load policy: " + error)
})
```

The `policy_wasm` needs to be either the raw byte array of
the compiled policy wasm file, or a web assembly module.

For example:

```javascript
const fs = require('fs');

const policy_wasm = fs.readFileSync('policy.wasm')
```

Alternatively the bytes can be pulled in remotely from a `fetch` or
in some cases (like CloudFlare Workers) the wasm is loaded directly into
the javascript context through external APIs.

### Evaluate the Policy

The loaded policy object returned from `load_policy()` has, as of now, only
one method for evaluating the policy: `eval_bool()`. This will evaluate the
policy and expects a boolean query result. The return value is a javascript
`Boolean`.

The `input` parameter must be a JSON string.

Example:

```javascript

input = '{"path": "/", "role": "admin"}'

rego.load_policy(policy_wasm).then(policy => {
    allowed = policy.eval_bool(input)
    console.log("allowed = " + allowed)
}, error => {
    console.error("Failed to load policy: " + error)
})
```

## Writing the policy

See [https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/](https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/)

## Compiling the policy

Either use the [Compile REST API](https://www.openpolicyagent.org/docs/latest/rest-api/#compile-api) or `opa build` CLI tool.

For example:

```bash
opa build -d example.rego 'data.example.allow = true'
```
Which is compiling the `example.rego` policy file with the query
`data.example.allow = true`. See [./examples](./examples) for a
more comprehensive example.

See `opa build --help` for more details.
