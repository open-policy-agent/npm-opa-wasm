// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

const fs = require('fs');
const Rego = require("@open-policy-agent/opa-wasm");

// Read the policy wasm file
const policy_wasm = fs.readFileSync('policy.wasm');

// Initialize the Rego object and load the wasm program
const rego = new Rego();

// Load the policy module asynchronously
rego.load_policy(policy_wasm).then(policy => {

    // Use console parameters for the input, do quick
    // validation by json parsing. Not efficient.. but
    // will raise an error
    const input = JSON.parse(process.argv[2]);
    // Provide a data document with a string value
    policy.set_data({world: "world"});

    // Evaluate the policy and log the result
    const result = policy.evaluate(input);
    console.log(JSON.stringify(result, null, 2))

}).catch(err => {
    console.log("ERROR: " + err)
});
