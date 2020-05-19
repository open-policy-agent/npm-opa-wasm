// Copyright 2020 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

import { promises as fs } from 'fs';
import { loadPolicy } from '@open-policy-agent/opa-wasm';

(async function readPolicy() {
    const policyWasm = await fs.readFile('policy.wasm');
    const policy = await loadPolicy(policyWasm);

    // Use console parameters for the input, do quick
    // validation by json parsing. Not efficient.. but
    // will raise an error
    const input = JSON.parse(process.argv[2]);
    // Provide a data document with a string value
    policy.setData({ world: "world" });

    // Evaluate the policy and log the result
    const result = policy.evaluate(input);
    console.log(JSON.stringify(result, null, 2))
})().catch(err => {
    console.log("ERROR: ", err);
    process.exit(1);
});
