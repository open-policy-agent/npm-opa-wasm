const { loadPolicy } = require("../src/opa.js");
const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");

describe("multiple entrypoints", () => {
  let policy = null;

  beforeAll(async () => {
    try {
      execFileSync("opa", [
        "build",
        `${__dirname}/fixtures/multiple-entrypoints`,
        "-o",
        `${__dirname}/fixtures/multiple-entrypoints/bundle.tar.gz`,
        "-t",
        "wasm",
        "-e",
        "example",
        "-e",
        "example/one",
        "-e",
        "example/two",
      ]);

      execFileSync("tar", [
        "-xzf",
        `${__dirname}/fixtures/multiple-entrypoints/bundle.tar.gz`,
        "-C",
        `${__dirname}/fixtures/multiple-entrypoints/`,
        `/policy.wasm`,
      ]);
    } catch (err) {
      console.error("Error creating test binary, check that opa is in path");
      throw err;
    }

    policy = await loadPolicy(
      readFileSync(`${__dirname}/fixtures/multiple-entrypoints/policy.wasm`),
    );
  });

  it("should run with default entrypoint", () => {
    const result = policy.evaluate();

    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: {
        one: expect.any(Object),
        two: expect.any(Object),
      },
    });
  });

  it("should run with numbered entrypoint specified", () => {
    const entrypointId = policy.entrypoints["example/one"];
    const result = policy.evaluate({}, entrypointId);

    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: {
        myRule: false,
        myOtherRule: false,
      },
    });
  });

  it("should run with named entrypoint specified", () => {
    const result = policy.evaluate({}, "example/one");

    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: {
        myRule: false,
        myOtherRule: false,
      },
    });
  });

  it("should run with second entrypoint specified", () => {
    const result = policy.evaluate({}, "example/two");

    expect(result.length).not.toBe(0);
    expect(result[0]).toMatchObject({
      result: {
        ourRule: false,
        theirRule: false,
      },
    });
  });

  it("should not run with entrypoint as object", () => {
    expect(() => {
      policy.evaluate({}, {});
    }).toThrow(
      "entrypoint value is an invalid type, must be either string or number",
    );
  });

  it("should not run if entrypoint string does not exist", () => {
    expect(() => {
      policy.evaluate({}, "not/a/real/entrypoint");
    }).toThrow(
      "entrypoint not/a/real/entrypoint is not valid in this instance",
    );
  });
});
