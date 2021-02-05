const { loadPolicy } = require('../src/opa.js');
const { readFileSync, readdirSync } = require('fs');

let files = [];
const path = process.env.OPA_CASES;
if (path === undefined) {
  describe('opa nodejs cases', () => {
    test.todo('not found, set OPA_CASES env var');
  });
} else {
  files = readdirSync(path);
}
let numFiles = 0;
var testCases = [];

files.forEach(file => {
  if (file.endsWith('.json')) {
    numFiles++;
    const testFile = JSON.parse(readFileSync(path + "/" + file));
    if (Array.isArray(testFile.cases)) {
      testFile.cases.forEach(testCase => {
        testCase.note = `${file}: ${testCase.note}`;
        if (testCase.note === '018_builtins.json: custom built-in' ||
            testCase.note === '018_builtins.json: impure built-in' ||
            testCase.note === '019_call_indirect_optimization.json: memoization') {
          testCase.skip = 'skipping tests with custom builtins';
        }
        testCases.push(testCase);
      });
    }
  }
});

testCases.forEach(tc => {
  const {
    wasm,
    input,
    data,
    note,
    want_defined,
    want_result,
    want_error,
    skip_reason,
    skip
  } = tc;
  describe(note, () => {
    if (skip) {
      test.skip(`skip ${note}: ${skip_reason}`, () => {});
      return;
    }

    if (want_error) {
      if('errors', async() => {
        const policy = await loadPolicy(Buffer.from(wasm, 'base64'));
        policy.setData(data);
        expect(() => policy.evaluate(input)).toThrow(want_error);
      });
      return;
    }

    it('has the desired result', async () => {
      const policy = await loadPolicy(Buffer.from(wasm, 'base64'));
      policy.setData(data || {});
      const result = policy.evaluate(input);
      if (want_defined !== undefined) {
        if (want_defined) {
          expect(result.length).toBeGreaterThan(0);
        } else {
          expect(result.length).toBe(0);
        }
      }
      if (want_result !== undefined) {
        expect(result.length).toEqual(want_result.length);
        expect(result).toEqual(expect.arrayContaining(want_result));
      }
    });
  });
});
