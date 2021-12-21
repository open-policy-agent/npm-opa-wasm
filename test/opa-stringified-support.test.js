import { readFileSync } from "fs";
import { execFileSync } from "child_process";
import { loadPolicy } from "../src/opa.js";
import util from "util";

describe("stringified data/input support", () => {
  const fixturesFolder = "test/fixtures/stringified-support";
  const dataRaw = readFileSync(
    `${fixturesFolder}/stringified-support-data.json`,
    "utf-8",
  );
  const data = JSON.parse(dataRaw);

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
      "stringified/support",
      "-e",
      "stringified/support/plainInputBoolean",
      "-e",
      "stringified/support/plainInputNumber",
      "-e",
      "stringified/support/plainInputString",
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

  it("should accept stringified data", () => {
    policy.setData(new util.TextEncoder().encode(dataRaw).buffer);

    //  positive check
    let result = policy.evaluate({ secret: "secret" });
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: { hasPermission: true } });

    //  negative check
    result = policy.evaluate({ secret: "wrong" });
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: { hasPermission: false } });
  });

  it("should accept stringified input - object", () => {
    policy.setData(data);

    //  positive check
    let result = policy.evaluate(
      new util.TextEncoder().encode(
        JSON.stringify({ permissions: ["view:account-billing"] }),
      ).buffer,
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: { hasPermission: true } });

    //  negative check
    result = policy.evaluate(JSON.stringify({ secret: "wrong" }));
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: { hasPermission: false } });
  });

  it("should accept stringified input - plain boolean", () => {
    //  positive check
    let result = policy.evaluate(true, "stringified/support/plainInputBoolean");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });

    //  negative check
    result = policy.evaluate(false, "stringified/support/plainInputBoolean");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: false });
  });

  it("should accept stringified input - plain number", () => {
    //  positive check
    let result = policy.evaluate(5, "stringified/support/plainInputNumber");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });

    //  negative check
    result = policy.evaluate(6, "stringified/support/plainInputNumber");
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: false });
  });

  it("should accept stringified input - plain string", () => {
    //  positive check
    let result = policy.evaluate(
      "test",
      "stringified/support/plainInputString",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: true });

    //  negative check
    result = policy.evaluate(
      "invalid",
      "stringified/support/plainInputString",
    );
    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({ result: false });
  });
});
