// Copyright 2020 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

import {promises as fs} from 'fs';
// @ts-ignore
import {loadPolicy} from '@open-policy-agent/opa-wasm';

(async function readPolicy() {
    const policyWasm = await fs.readFile('policy.wasm');
    const policy = await loadPolicy(policyWasm);

    // Use console parameters for the input, do quick
    // validation by json parsing. Not efficient.. but
    // will raise an error
    const input1 = {
        method: "GET",
        path: ["health"]
    };
    // Evaluate the policy and log the result
    const result1 = policy.evaluate(input1);
    console.log("Does whole world has access? " + result1[0].result)

    const input2 = {
        method: "GET",
        path: ["admins", "1", "status"],
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE2MDYzMjM1NjA1NzEsImZpcnN0TmFtZSI6Ik5lbyIsImxhc3ROYW1lIjoiQW5kZXJzb24iLCJyb2xlcyI6WyJtbWJfYWRtaW4iXSwiaWF0IjoxNjEzNzQ0NzkyLCJleHAiOjE2MTM3NDQ5MTIsImF1ZCI6ImFwcC5leGFtcGxlLmNvbSIsImlzcyI6InNzby5leGFtcGxlLmNvbSJ9.Ci23NShSU4RwaVHPWWRt-viTRPsgtkYnkwrUe5X7u-o"
    };
    // Evaluate the policy and log the result
    const result2 = policy.evaluate(input2);
    console.log("Admin access granted? " + result2[0].result)

    const input3 = {
        method: "GET",
        path: ["admins", "1", "status"],
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE2MDYzMjM1NjA1NzEsImZpcnN0TmFtZSI6Ik5lbyIsImxhc3ROYW1lIjoiQW5kZXJzb24iLCJyb2xlcyI6WyJjbGllbnRfaHIiXSwiaWF0IjoxNjEzNzQ0NzkyLCJleHAiOjE2MTM3NDQ5MTIsImF1ZCI6ImFwcC5leGFtcGxlLmNvbSIsImlzcyI6InNzby5leGFtcGxlLmNvbSJ9.WnTFZ91-ChLD7AEx4ObsWhyrYbR7X4WFDCrEK-Qbj10"
    };
    // Evaluate the policy and log the result
    const result3 = policy.evaluate(input3);
    console.log("Client HR access granted? " + result3[0].result)

    const input4 = {
        method: "GET",
        path: ["clients", "1", "status"],
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE2MDYzMjM1NjA1NzEsImZpcnN0TmFtZSI6Ik5lbyIsImxhc3ROYW1lIjoiQW5kZXJzb24iLCJyb2xlcyI6WyJjbGllbnRfaHIiXSwiaWF0IjoxNjEzNzQ0NzkyLCJleHAiOjE2MTM3NDQ5MTIsImF1ZCI6ImFwcC5leGFtcGxlLmNvbSIsImlzcyI6InNzby5leGFtcGxlLmNvbSJ9.WnTFZ91-ChLD7AEx4ObsWhyrYbR7X4WFDCrEK-Qbj10"
    };
    // Evaluate the policy and log the result
    const result4 = policy.evaluate(input4);
    console.log("Client HR access granted? " + result4[0].result)

})().catch(err => {
    console.log("ERROR: ", err);
    process.exit(1);
});
