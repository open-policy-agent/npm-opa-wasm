import * as fs from "fs";
import { loadPolicy } from "@open-policy-agent/opa-wasm";

const iterations = 100000;

const inputs = [
  {
    someProp: "thisValue",
    anotherProp: "thatValue",
    anyProp: "aValue",
    ourProp: "inTheMiddleOfTheStreet",
  },
  {
    someProp: "",
    anotherProp: "thatValue",
    anyProp: "aValue",
    ourProp: "inTheMiddleOfTheStreet",
  },
  {
    someProp: "thisValue",
    anotherProp: "",
    anyProp: "aValue",
    ourProp: "inTheMiddleOfTheStreet",
  },
  {
    someProp: "thisValue",
    anotherProp: "thatValue",
    anyProp: "",
    ourProp: "inTheMiddleOfTheStreet",
  },
  {
    someProp: "thisValue",
    anotherProp: "thatValue",
    anyProp: "aValue",
    ourProp: "",
  },
  { someProp: "thisValue", anotherProp: "thatValue" },
  { anyProp: "aValue", ourProp: "inTheMiddleOfTheStreet" },
  { someProp: "thisValue", ourProp: "inTheMiddleOfTheStreet" },
  { anotherProp: "thatValue", anyProp: "aValue" },
  {},
];

(async function readPolicy() {
  const policy = await loadPolicy(fs.readFileSync("./policy.wasm"));

  console.log(`Running multi entrypoint demo suite`);
  console.log(
    `Iterations: ${iterations} iterations of ${inputs.length} inputs for ${iterations *
      inputs.length} total evals per entrypoint`,
  );

  // Run the default entrypoint first
  console.time(`default entrypoint`);
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const input of inputs) {
      policy.evaluate(input);
    }
  }
  console.timeEnd(`default entrypoint`);

  // Run the example one entrypoint, string access
  console.time(`example/one entrypoint (via string)`);
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const input of inputs) {
      policy.evaluate(input, "example/one");
    }
  }
  console.timeEnd(`example/one entrypoint (via string)`);

  // Run the example one entrypoint, number access
  const exampleOneEntrypoint = policy.entrypoints["example/one"];
  console.time(`example/one entrypoint (via number "${exampleOneEntrypoint}")`);
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const input of inputs) {
      policy.evaluate(input, exampleOneEntrypoint);
    }
  }
  console.timeEnd(
    `example/one entrypoint (via number "${exampleOneEntrypoint}")`,
  );

  // Run the example two coolRule entrypoint, number access
  console.time(`example/two/coolRule entrypoint (via string)`);
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const input of inputs) {
      policy.evaluate(input, "example/two/coolRule");
    }
  }
  console.timeEnd(`example/two/coolRule entrypoint (via string)`);

  // Run the example two coolRule entrypoint, number access
  const coolRuleEntrypoint = policy.entrypoints["example/two/coolRule"];
  console.time(
    `example/two/coolRule entrypoint (via number "${coolRuleEntrypoint}")`,
  );
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const input of inputs) {
      policy.evaluate(input, coolRuleEntrypoint);
    }
  }
  console.timeEnd(
    `example/two/coolRule entrypoint (via number "${coolRuleEntrypoint}")`,
  );

  console.log(`Evaluate policy from default entrypoint`);
  console.dir(policy.evaluate(inputs[0]), { depth: 3 });

  console.log(`Evaluate policy from example/one entrypoint`);
  console.dir(policy.evaluate(inputs[1], "example/one"));

  console.log(`Evaluate policy from example/two/coolRule entrypoint`);
  console.dir(policy.evaluate(inputs[2], "example/two/coolRule"));

  console.log(`Evaluate policy from example/two entrypoint`);
  console.dir(policy.evaluate(inputs[3], "example/two"));
})().catch((err) => {
  console.log("ERROR: ", err);
  process.exit(1);
});
