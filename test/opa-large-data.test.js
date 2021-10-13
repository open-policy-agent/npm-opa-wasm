const { EOL } = require("os");
const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { loadPolicy } = require("../src/opa.js");

describe("setData stress tests", () => {
  const baseDataRaw = readFileSync(
    "test/fixtures/data-stress/base-data.json",
    "utf-8",
  );
  const baseData = JSON.parse(baseDataRaw);

  let data;

  const multiplyFactor = 50000;
  data = multiplyData(baseData, multiplyFactor);
  const dataSize = multiplyFactor / 1000;

  beforeAll(() => {
    try {
      execFileSync("opa", [
        "build",
        `test/fixtures/data-stress`,
        "-o",
        `test/fixtures/data-stress/bundle.tar.gz`,
        "-t",
        "wasm",
        "-e",
        "example",
        "-e",
        "example/one",
      ]);

      execFileSync("tar", [
        "-xzf",
        `test/fixtures/data-stress/bundle.tar.gz`,
        "-C",
        `test/fixtures/data-stress/`,
        `/policy.wasm`,
      ]);
    } catch (err) {
      console.error("Error creating test binary, check that opa is in path");
      throw err;
    }
  });

  it(`setData of size ~${dataSize}Mb`, async () => {
    const policyWasm = readFileSync("test/fixtures/data-stress/policy.wasm");
    const policy = await loadPolicy(policyWasm, 32000);

    const start = Date.now();

    policy.setData(data);
    data = null;

    const end = Date.now();
    console.log(`setData of ~${dataSize}Mb took ${end - start}ms`);

    if (globalThis.gc) {
      globalThis.gc();
    }
    dumpMemoryUsage(`memory status AFTER setData ~${dataSize}Mb`);
  });
});

function multiplyData(input, count) {
  const result = {};
  for (let i = 0, l = count; i < l; i++) {
    result[`static${i}`] = input.static;
  }
  return result;
}

function dumpMemoryUsage(note) {
  process.stdout.write(`Memory dump: ${note}${EOL}`);
  for (const [key, value] of Object.entries(process.memoryUsage())) {
    process.stdout.write(`\t${key}: ${value / 1000000} MB${EOL}`);
  }
  process.stdout.write(EOL);
}
