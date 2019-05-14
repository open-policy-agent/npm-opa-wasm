# Simple opa-wasm node application

1. Build the WebAssembly binary for the example policy:

```bash
opa build -d example.rego 'data.example.allow = true'
```

2. Run the example Node JS code that invokes the Wasm binary:

```bash
node app.js '{"method": "get", "path": "/trades"}'
```

```bash
node app.js '{"method": "post", "path": "/trades"}'
```

```bash
node app.js '{"method": "post", "path": "/trades", "role": "admin"}'
```
