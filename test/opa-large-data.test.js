import { EOL } from "os";
import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { loadPolicy } from "../src/opa.js";
import util from "util";

describe("setData stress tests", () => {
  const baseDataRaw = readFileSync(
    "test/fixtures/data-stress/base-data.json",
    "utf-8",
  );
  const baseData = JSON.parse(baseDataRaw);

  let data;
  let dataBuf;

  const multiplyFactor = 50;
  data = multiplyData(baseData, multiplyFactor * 1000);
  dataBuf = new util.TextEncoder().encode(JSON.stringify(data)).buffer;
  data = null;
  const dataSize = dataBuf.byteLength / 1000000;

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

    policy.setData(dataBuf);
    dataBuf = null;

    const end = Date.now();
    console.log(`setData of ~${dataSize}Mb took ${end - start}ms`);

    if (global.gc) {
      console.log("done");
      global.gc();
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
