const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { loadPolicy } = require("../src/opa.js");
const util = require("util");

describe("package support", () => {
  const fixturesFolder = "test/fixtures/package";

  const packageName = "a.b.c"

  let policy;

  beforeAll(async () => {
    const bundlePath = `${fixturesFolder}/bundle.tar.gz`;

    execFileSync("opa", [
      "build",
      fixturesFolder,
      "-o",
      bundlePath,
      "-t",
      "wasm",
      "-e",
      `${packageName}/allow`,
    ]);

    execFileSync("tar", [
      "-xzf",
      bundlePath,
      "-C",
      `${fixturesFolder}/`,
      "/policy.wasm",
    ]);

    const policyWasm = readFileSync(`${fixturesFolder}/policy.wasm`);
    const opts = { initial: 5, maximum: 10 };
    policy = await loadPolicy(policyWasm, opts);
  });


  it("should handle packaged data", () => {
    policy.setData({});

    //  positive check
    let result = policy.evaluate({ "alpha": "yoyo", "beta": "yoyo"});
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });

    //  negative check
    result = policy.evaluate({ "alpha": "yoyo", "beta": "theremin"});
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: false });
  });
});
