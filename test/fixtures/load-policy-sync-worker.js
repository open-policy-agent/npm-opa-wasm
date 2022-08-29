(async () => {
  importScripts("/dist/opa-wasm-browser.js");

  const wasm = await fetch("/test/fixtures/multiple-entrypoints/policy.wasm")
    .then((r) => r.blob())
    .then((b) => b.arrayBuffer());

  const policy = opa.loadPolicySync(wasm);
  this.postMessage(policy.evaluate({}, "example/one"));
})();
