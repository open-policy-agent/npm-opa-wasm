// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

const fs = require('fs');
const Rego = require("@open-policy-agent/opa-wasm")

// Read the policy wasm file
const policy_wasm = fs.readFileSync('policy.wasm')

// Initialize the Rego object and load the wasm program
const rego = new Rego()
rego.load_policy(policy_wasm).then(policy => {

    // Use console parameters for the input, do quick
    // validation by json parsing. Not efficient.. but
    // will raise an error 
    const input = JSON.stringify(JSON.parse(process.argv[2]))

    const allow = policy.eval_bool(input)

    if (allow) {
        console.log("Decision: ALLOW");
    } else {
        console.log("Decision: DENY");
    }

}, error => {
    console.log("ERROR: " + error)
})
