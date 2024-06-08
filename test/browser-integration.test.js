const puppeteer = require("puppeteer");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

let server;
let browser;
let page;

beforeAll(async () => {
  generateFixtureBundle();

  server = await startStaticServer();
  const port = server.address().port;

  browser = await puppeteer.launch();
  page = await browser.newPage();
  await page.goto(`http://localhost:${port}/`);
});

afterAll(async () => {
  await browser.close();
  server.close();
});

test("esm script should expose working opa module", async () => {
  const result = await page.evaluate(async function () {
    // NOTE: Paths are evaluated relative to the project root.
    const { default: opa } = await import("/dist/opa-wasm-browser.esm.js");
    const wasm = await fetch("/test/fixtures/multiple-entrypoints/policy.wasm")
      .then((r) => r.blob())
      .then((b) => b.arrayBuffer());
    const policy = await opa.loadPolicy(wasm);
    return policy.evaluate({}, "example/one");
  });
  expect(result).toEqual([
    {
      result: { myOtherRule: false, myRule: false },
    },
  ]);
});

test("loadPolicy should allow for a response object that resolves to a fetched wasm module", async () => {
  const result = await page.evaluate(async function () {
    // NOTE: Paths are evaluated relative to the project root.
    const { default: opa } = await import("/dist/opa-wasm-browser.esm.js");
    const policy = await opa.loadPolicy(fetch("/test/fixtures/multiple-entrypoints/policy.wasm"));
    return policy.evaluate({}, "example/one");
  });
  expect(result).toEqual([
    {
      result: { myOtherRule: false, myRule: false },
    },
  ]);
});

test("default script should expose working opa global", async () => {
  // Load module into global scope.
  const script = fs.readFileSync(
    path.join(__dirname, "../dist/opa-wasm-browser.js"),
    "utf-8",
  );
  await page.evaluate(script);

  const result = await page.evaluate(async function () {
    // NOTE: Paths are evaluated relative to the project root.
    const wasm = await fetch("/test/fixtures/multiple-entrypoints/policy.wasm")
      .then((r) => r.blob())
      .then((b) => b.arrayBuffer());
    const policy = await opa.loadPolicy(wasm);
    return policy.evaluate({}, "example/one");
  });
  expect(result).toEqual([
    {
      result: { myOtherRule: false, myRule: false },
    },
  ]);
});

test("loadPolicySync can be used inside a worker thread", async () => {
  const result = await page.evaluate(function () {
    return new Promise((resolve, _) => {
      const worker = new Worker("/test/fixtures/load-policy-sync-worker.js");
      worker.onmessage = function (e) {
        resolve(e.data);
      };
    });
  });
  expect(result).toEqual([
    {
      result: { myOtherRule: false, myRule: false },
    },
  ]);
});

async function startStaticServer() {
  // Basic webserver to serve the test suite relative to the root.
  const server = http.createServer(function (req, res) {
    // Serve an empty HTML page at the root.
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end("<!doctype html />");
      return;
    }

    fs.readFile(path.join(__dirname, "..", req.url), function (err, data) {
      if (err) {
        console.error(err);
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      switch (path.extname(req.url)) {
        case ".js":
          res.setHeader("Content-Type", "text/javascript");
          break;
        case ".wasm":
          res.setHeader("Content-Type", "application/wasm");
          break;
      }
      res.writeHead(200);
      res.end(data);
    });
  });
  return await new Promise((resolve) => {
    server.listen(0, "localhost", function () {
      resolve(server);
    });
  });
}

function generateFixtureBundle() {
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
}
