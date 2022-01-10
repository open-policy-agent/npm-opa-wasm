import opa from "https://unpkg.com/@open-policy-agent/opa-wasm@1.6.0/dist/opa-wasm-browser.esm.js";

const file = await Deno.readFile("test.wasm");
const policy = await opa.loadPolicy(file.buffer.slice(0, file.length));
const input = { "foo": "bar" };

const result = policy.evaluate(input);

if (!result[0]?.result) {
  Deno.exit(1);
}
