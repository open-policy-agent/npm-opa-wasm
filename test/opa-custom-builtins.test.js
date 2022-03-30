const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { loadPolicy } = require("../src/opa.js");

describe("custom builtins", () => {
  const fixturesFolder = "test/fixtures/custom-builtins";

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
      "--capabilities",
      `${fixturesFolder}/capabilities.json`,
      "-e",
      "custom_builtins/zero_arg",
      "-e",
      "custom_builtins/one_arg",
      "-e",
      "custom_builtins/two_arg",
      "-e",
      "custom_builtins/three_arg",
      "-e",
      "custom_builtins/four_arg",
      "-e",
      "custom_builtins/valid_json",
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
    policy = await loadPolicy(policyWasm, opts, {
      "custom.zeroArgBuiltin": () => `hello`,
      "custom.oneArgBuiltin": (arg0) => `hello ${arg0}`,
      "custom.twoArgBuiltin": (arg0, arg1) => `hello ${arg0}, ${arg1}`,
      "custom.threeArgBuiltin": (arg0, arg1, arg2) => (
        `hello ${arg0}, ${arg1}, ${arg2}`
      ),
      "custom.fourArgBuiltin": (arg0, arg1, arg2, arg3) => (
        `hello ${arg0}, ${arg1}, ${arg2}, ${arg3}`
      ),
      "json.is_valid": () => {
        throw new Error("should never happen");
      },
    });
  });

  it("should call a custom zero-arg builtin", () => {
    const result = policy.evaluate({}, "custom_builtins/zero_arg");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: "hello" });
  });

  it("should call a custom one-arg builtin", () => {
    const result = policy.evaluate(
      { args: ["arg0"] },
      "custom_builtins/one_arg",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: "hello arg0" });
  });

  it("should call a custom two-arg builtin", () => {
    const result = policy.evaluate(
      { args: ["arg0", "arg1"] },
      "custom_builtins/two_arg",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: "hello arg0, arg1",
    });
  });

  it("should call a custom three-arg builtin", () => {
    const result = policy.evaluate(
      { args: ["arg0", "arg1", "arg2"] },
      "custom_builtins/three_arg",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: "hello arg0, arg1, arg2",
    });
  });

  it("should call a custom four-arg builtin", () => {
    const result = policy.evaluate(
      { args: ["arg0", "arg1", "arg2", "arg3"] },
      "custom_builtins/four_arg",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: "hello arg0, arg1, arg2, arg3",
    });
  });

  it("should call a provided builtin over a custom builtin", () => {
    const result = policy.evaluate({}, "custom_builtins/valid_json");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });
  });
});
