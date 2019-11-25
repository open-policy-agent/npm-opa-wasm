// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.

function stringDecoder(mem) {
    return function(addr) {
        const i8 = new Int8Array(mem.buffer);
        let s = "";
        while (i8[addr] !== 0) {
            s += String.fromCharCode(i8[addr++]);
        }
        return s;
    }
}

function _loadJSON(wasmInstance, memory, value) {
    if (value === undefined) {
        throw "unable to load undefined value into memory"
    }

    const str = JSON.stringify(value);
    const rawAddr = wasmInstance.exports.opa_malloc(str.length);
    const buf = new Uint8Array(memory.buffer);

    for (let i = 0; i < str.length; i++) {
        buf[rawAddr + i] = str.charCodeAt(i);
    }

    const parsedAddr = wasmInstance.exports.opa_json_parse(rawAddr, str.length);

    if (parsedAddr === 0) {
        throw "failed to parse json value"
    }

    return parsedAddr;
}

function _dumpJSON(wasmInstance, memory, addr) {
    const rawAddr = wasmInstance.exports.opa_json_dump(addr);
    const buf = new Uint8Array(memory.buffer);

    let s = '';
    let idx = rawAddr;

    while (buf[idx] !== 0) {
        s += String.fromCharCode(buf[idx++]);
    }

    return JSON.parse(s);
}


function builtinPlus(a, b) {
    return a+b;
}

const builtinFuncs = {
    plus: builtinPlus,
}

// _builtinCall dispatches the built-in function. The built-in function
// arguments are loaded from Wasm and back in using JSOn serialization.
function _builtinCall(wasmInstance, memory, builtins, builtin_id) {

    const impl = builtinFuncs[builtins[builtin_id]];

    if (impl === undefined) {
        throw {message: "not implemented: built-in function " + builtin_id + ": " + builtins[builtin_id]}
    }

    var argArray = Array.prototype.slice.apply(arguments);
    let args = [];

    for (let i = 4; i < argArray.length; i++) {
        const jsArg = _dumpJSON(wasmInstance, memory, argArray[i]);
        args.push(jsArg);
    }

    const result = impl(...args);

    return _loadJSON(wasmInstance, memory, result);
}

// _load_policy can take in either an ArrayBuffer or WebAssembly.Module
// as its first argument, and a WebAssembly.Memory for the second parameter.
// It will return a Promise, depending on the input type the promise
// resolves to both a compiled WebAssembly.Module and its first WebAssembly.Instance
// or to the WebAssemblyInstance.
async function _load_policy(policy_wasm, memory) {

    const addr2string = stringDecoder(memory);

    let env = {};

    const wasm = await WebAssembly.instantiate(policy_wasm, {
        env: {
            memory: memory,
            opa_abort: function(addr) {
                throw addr2string(addr);
            },
            opa_builtin0: function(builtin_id, ctx) {
                return _builtinCall(env.instance, memory, env.builtins, builtin_id);
            },
            opa_builtin1: function(builtin_id, ctx, _1) {
                return _builtinCall(env.instance, memory, env.builtins, builtin_id, _1);
            },
            opa_builtin2: function(builtin_id, ctx, _1, _2) {
                return _builtinCall(env.instance, memory, env.builtins, builtin_id, _1, _2);
            },
            opa_builtin3: function(builtin_id, ctx, _1, _2, _3) {
                return _builtinCall(env.instance, memory, env.builtins, builtin_id, _1, _2, _3);
            },
            opa_builtin4: function(builtin_id, ctx, _1, _2, _3, _4) {
                return _builtinCall(env.instance, memory, env.builtins, builtin_id, _1, _2, _3, _4);
            },
        },
    });

    const builtins = _dumpJSON(wasm.instance, memory, wasm.instance.exports.builtins());

    env.instance = wasm.instance;
    env.builtins = {};

    for (var key of Object.keys(builtins)) {
        env.builtins[builtins[key]] = key
    }

    return wasm;
}

// LoadedPolicy is a wrapper around a WebAssembly.Instance and WebAssembly.Memory
// for a compiled Rego policy. There are helpers to run the wasm instance and
// handle the output from the policy wasm.
class LoadedPolicy {
    constructor(policy, memory) {
        this.mem = memory;

        // Depending on how the wasm was instantiated "policy" might be a
        // WebAssembly Instance or be a wrapper around the Module and
        // Instance. We only care about the Instance.
        this.wasmInstance = policy.instance ? policy.instance : policy;

        this.dataAddr = _loadJSON(this.wasmInstance, this.mem, {});
        this.baseHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get();
        this.baseHeapTop = this.wasmInstance.exports.opa_heap_top_get();
        this.dataHeapPtr = this.baseHeapPtr;
        this.dataHeapTop = this.baseHeapTop;
    }

    // evaluate will evaluate the loaded policy with the given input and
    // return the result set. This should be re-used for multiple evaluations
    // of the same policy with different inputs.
    evaluate(input) {
        // Reset the heap pointer before each evaluation
        this.wasmInstance.exports.opa_heap_ptr_set(this.dataHeapPtr);
        this.wasmInstance.exports.opa_heap_top_set(this.dataHeapTop);

        // Load the input data
        const inputAddr = _loadJSON(this.wasmInstance, this.mem, input);

        // Setup the evaluation context
        const ctxAddr = this.wasmInstance.exports.opa_eval_ctx_new();
        this.wasmInstance.exports.opa_eval_ctx_set_input(ctxAddr, inputAddr);
        this.wasmInstance.exports.opa_eval_ctx_set_data(ctxAddr, this.dataAddr);

        // Actually evaluate the policy
        this.wasmInstance.exports.eval(ctxAddr);

        // Retrieve the result
        const resultAddr = this.wasmInstance.exports.opa_eval_ctx_get_result(ctxAddr);
        return _dumpJSON(this.wasmInstance, this.mem, resultAddr)
    }

    // eval_bool will evaluate the policy and return a boolean answer
    // depending on the return code from the policy evaluation.
    // Deprecated: Use `evaluate` instead.
    eval_bool(input) {
        const rs = this.evaluate(input);
        return (rs && rs.length === 1 && rs[0] === true)
    }

    // set_data will load data for use in subsequent evaluations.
    set_data(data) {
        this.wasmInstance.exports.opa_heap_ptr_set(this.baseHeapPtr);
        this.wasmInstance.exports.opa_heap_top_set(this.baseHeapTop);
        this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
        this.dataHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get();
        this.dataHeapTop = this.wasmInstance.exports.opa_heap_top_get();
    }
}

module.exports = class Rego {

    // load_policy can take in either an ArrayBuffer or WebAssembly.Module
    // and will return a LoadedPolicy object which can be used to evaluate
    // the policy.
    async load_policy(wasm) {
        const memory = new WebAssembly.Memory({initial: 5});
        const policy = await _load_policy(wasm, memory);
        return new LoadedPolicy(policy, memory)
    }
};
