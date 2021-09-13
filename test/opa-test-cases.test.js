const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { execFileSync, spawnSync } = require("child_process");
const { join } = require("path");
const { loadPolicy } = require("../src/opa.js");
const yaml = require("js-yaml");
const tmp = require("tmp");
const sort = require("smart-deep-sort");

// Known failures
const exceptions = {
  "sprintf/big_int": "bit ints are loosing precision",
  "sprintf/big_int/max_cert_serial_number":
    "lost precision, scientific format displayed",
  "strings/sprintf: float too big": '2e308 displayed as "Infinity"',
  "strings/sprintf: composite": "array is concatenated",
};

function walk(dir) {
  let results = [];
  readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    file = join(dir, d.name);
    if (d.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

function modulesToTempFiles(modules) {
  const ret = [];
  for (const mod of modules) {
    const tmpFile = tmp.fileSync();
    writeFileSync(tmpFile.fd, mod);
    ret.push(tmpFile.name);
  }
  return ret;
}

function compileToWasm(modules, query) {
  if (modules && modules.length < 1) {
    return {
      skip: `empty modules cases are not supported (got ${modules &&
        modules.length})`,
    };
  }

  // NOTE(sr) crude but effective
  let entrypoint;
  if (query === "data.generated.p = x") {
    entrypoint = "generated/p";
  } else if (query === "data.test.p = x") {
    entrypoint = "test/p";
  } else if (query === "data.decoded_object.p = x") {
    entrypoint = "decoded_object/p";
  } else {
    return { skip: `entrypoint ${query} not supported` };
  }

  const files = modulesToTempFiles(modules);
  const outFile = tmp.fileSync();
  const untarDir = tmp.dirSync();

  const res = spawnSync("opa", [
    "build",
    "-t",
    "wasm",
    "--capabilities",
    "capabilities.json",
    "-e",
    entrypoint,
    "-o",
    outFile.name,
    ...files,
  ]);
  if (res.error || res.status != 0) {
    return { skip: res.stdout };
  }
  execFileSync(
    "tar",
    ["xf", outFile.name, "-C", untarDir.name, "/policy.wasm"],
    { stdio: "ignore" },
  );
  return { wasm: join(untarDir.name, "policy.wasm") };
}

const path = process.env.OPA_TEST_CASES;
if (path === undefined) {
  describe("opa external test cases", () => {
    test.todo("not found, set OPA_TEST_CASES env var");
  });
}

for (const file of walk(path)) {
  describe(file, () => {
    const doc = yaml.load(readFileSync(file, "utf8"));
    cases:
    for (const tc of doc.cases) {
      const reason = exceptions[tc.note];
      if (reason) {
        test.todo(`${tc.note}: ${reason}`);
        continue cases;
      }
      if (tc.input_term) {
        let fail = false;
        try {
          JSON.parse(tc.input_term);
        } catch (_) {
          fail = true;
        }
        if (fail) {
          test.todo(`${tc.note}: input_term value format not supported`);
          continue cases;
        }
      }
      if (tc.want_result && tc.want_result.length > 1) {
        test.todo(
          `${tc.note}: more than one expected result not supported: ${tc
            .want_result && tc.want_result.length}`,
        );
        continue cases;
      }
      let expected = tc.want_result;

      const { wasm, skip } = compileToWasm(tc.modules, tc.query);
      if (skip) {
        test.todo(`${tc.note}: ${skip}`);
        continue cases;
      }

      it(tc.note, async () => {
        const buf = readFileSync(wasm);
        const policy = await loadPolicy(buf);
        if (tc.data) {
          policy.setData(tc.data);
        }
        let input = tc.input || tc.input_term;
        if (typeof input === "string") {
          input = JSON.parse(input);
        }

        if ((tc.want_error || tc.want_error_code) && !tc.strict_error) {
          expect(() => {
            policy.evaluate(input);
          }).toThrow();
          return;
        }

        let res;
        expect(() => {
          res = policy.evaluate(input);
        }).not.toThrow();

        if (expected) {
          expect(res).toHaveLength(expected.length);
          if (tc.sort_bindings) {
            res = { result: sort(res[0].result) };
            expected = { x: sort(expected[0].x) };
          }
          expect(res[0] && res[0].result).toEqual(expected[0] && expected[0].x);
        } else {
          expect(res).toHaveLength(0);
        }
      });
    }
  });
}
