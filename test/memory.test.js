const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const semver = require("semver");
const { loadPolicy } = require("../src/opa.js");

describe("growing memory", () => {
  const fixturesFolder = "test/fixtures/memory";

  // TODO(sr): split into helper function if we need this in other places
  const versionOutput = execFileSync("opa", ["version"], { encoding: "utf8" });
  const lines = versionOutput.split(/\r?\n/);
  const [_, version] = lines[0].split(" ");
  const sv = semver.coerce(version);
  if (!semver.satisfies(sv, ">=0.35.0")) {
    it.only("", () => {
      console.warn("memory tests unsupported for OPA < 0.35.0");
    });
  }

  let policyWasm;

  beforeAll(() => {
    const bundlePath = `${fixturesFolder}/bundle.tar.gz`;

    execFileSync("opa", [
      "build",
      fixturesFolder,
      "-o",
      bundlePath,
      "-t",
      "wasm",
      "-e",
      "test/allow",
    ]);

    execFileSync(
      "tar",
      ["-xzf", bundlePath, "-C", `${fixturesFolder}/`, "/policy.wasm"],
      { stdio: "ignore" },
    );

    policyWasm = readFileSync(`${fixturesFolder}/policy.wasm`);
  });

  it("input exceeds memory, host fails to grow it", async () => {
    const policy = await loadPolicy(policyWasm, { initial: 2, maximum: 3 });
    const input = "a".repeat(2 * 65536);

    // Note: In Node 10.x case is different
    expect(() => policy.evaluate(input)).toThrow(
      /WebAssembly\.Memory\.grow\(\): Maximum memory size exceeded/i,
    );
  });

  it("parsing input exceeds memory", async () => {
    const policy = await loadPolicy(policyWasm, { initial: 3, maximum: 4 });
    const input = "a".repeat(2 * 65536);
    expect(() => policy.evaluate(input)).toThrow("opa_malloc: failed");
  });

  it("large input, host and guest grow successfully", async () => {
    const policy = await loadPolicy(policyWasm, { initial: 2, maximum: 8 });
    const input = "a".repeat(2 * 65536);
    expect(() => policy.evaluate(input)).not.toThrow();
  });

  it("does not leak memory evaluating the same policy multiple times", async () => {
    const policy = await loadPolicy(policyWasm, { initial: 2, maximum: 8 });
    const input = "a".repeat(2 * 65536);

    for (const _ of new Array(16)) {
      expect(() => policy.evaluate(input)).not.toThrow();
    }
  });
});
