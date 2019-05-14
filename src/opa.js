// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

function stringDecoder(mem) {
    return function(addr) {
        const i8 = new Int8Array(mem.buffer);
        const start = addr;
        var s = "";
        while (i8[addr] != 0) {
            s += String.fromCharCode(i8[addr++]);
        }
        return s;
    }
}

async function load_policy(policy_wasm, memory, ) {
    const addr2string = stringDecoder(memory);
    return await WebAssembly.instantiate(policy_wasm, {
        env: {
            memory: memory,
            opa_abort: function(addr) {
                throw addr2string(addr);
            },
        },
    });
}

class LoadedPolicy {
    constructor(policy, memory) {
        this.mem = memory

        // Depending on how the wasm was instantiated "policy" might be a
        // WebAssembly Instance or be a wrapper around the Module and
        // Instance. We only care about the Instance.
        this.policy = policy.instance ? policy.instance : policy
    }

    eval_bool(input) {
        const addr = this.policy.exports.opa_malloc(input.length);
        const buf = new Uint8Array(this.mem.buffer);
    
        for(let i = 0; i < input.length; i++) {
            buf[addr+i] = input.charCodeAt(i);
        }
    
        const returnCode = this.policy.exports.eval(addr, input.length);
    
        return Boolean(returnCode);
    }
}

module.exports = class Rego {
    async load_policy(wasm) {
        const memory = new WebAssembly.Memory({initial: 5});
        const policy = await load_policy(wasm, memory)
        return new LoadedPolicy(policy, memory)
    }
};
