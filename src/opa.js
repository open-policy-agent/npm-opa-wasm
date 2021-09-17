// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.
const builtIns = require("./builtins/index");
const utf8 = require("utf8");

/**
 * @param {WebAssembly.Memory} mem
 */
function stringDecoder(mem) {
  return function (addr) {
    const i8 = new Int8Array(mem.buffer);
    let s = "";
    while (i8[addr] !== 0) {
      s += String.fromCharCode(i8[addr++]);
    }
    return s;
  };
}

/**
 * Stringifies and loads an object into OPA's Memory
 * @param {WebAssembly.Instance} wasmInstance
 * @param {WebAssembly.Memory} memory
 * @param {any} value
 * @returns {number}
 */
function _loadJSON(wasmInstance, memory, value) {
  if (value === undefined) {
    return 0;
  }

  const str = utf8.encode(JSON.stringify(value));
  const rawAddr = wasmInstance.exports.opa_malloc(str.length);
  const buf = new Uint8Array(memory.buffer);

  for (let i = 0; i < str.length; i++) {
    buf[rawAddr + i] = str.charCodeAt(i);
  }

  const parsedAddr = wasmInstance.exports.opa_json_parse(rawAddr, str.length);

  if (parsedAddr === 0) {
    throw "failed to parse json value";
  }
  return parsedAddr;
}

/**
 * Dumps and parses a JSON object from OPA's Memory
 * @param {WebAssembly.Instance} wasmInstance
 * @param {WebAssembly.Memory} memory
 * @param {number} addr
 * @returns {object}
 */
function _dumpJSON(wasmInstance, memory, addr) {
  const rawAddr = wasmInstance.exports.opa_json_dump(addr);
  return _dumpJSONRaw(memory, rawAddr);
}

/**
 * Parses a JSON object from wasm instance's memory
 * @param {WebAssembly.Memory} memory
 * @param {number} addr
 * @returns {object}
 */
function _dumpJSONRaw(memory, addr) {
  const buf = new Uint8Array(memory.buffer);

  let s = "";
  let idx = addr;

  while (buf[idx] !== 0) {
    s += String.fromCharCode(buf[idx++]);
  }

  return JSON.parse(utf8.decode(s));
}

const builtinFuncs = builtIns;

/**
 * _builtinCall dispatches the built-in function. The built-in function
 * arguments are loaded from Wasm and back in using JSON serialization.
 * @param {WebAssembly.Instance} wasmInstance
 * @param {WebAssembly.Memory} memory
 * @param {{ [builtinId: number]: string }} builtins
 * @param {string} builtin_id
 */
function _builtinCall(wasmInstance, memory, builtins, builtinId) {
  const builtInName = builtins[builtinId];
  const impl = builtinFuncs[builtInName];

  if (impl === undefined) {
    throw {
      message: "not implemented: built-in function " +
        builtinId +
        ": " +
        builtins[builtinId],
    };
  }

  const argArray = Array.prototype.slice.apply(arguments);
  const args = [];

  for (let i = 4; i < argArray.length; i++) {
    const jsArg = _dumpJSON(wasmInstance, memory, argArray[i]);
    args.push(jsArg);
  }

  const result = impl(...args);

  return _loadJSON(wasmInstance, memory, result);
}

/**
 * _loadPolicy can take in either an ArrayBuffer or WebAssembly.Module
 * as its first argument, and a WebAssembly.Memory for the second parameter.
 * It will return a Promise, depending on the input type the promise
 * resolves to both a compiled WebAssembly.Module and its first WebAssembly.Instance
 * or to the WebAssemblyInstance.
 * @param {BufferSource | WebAssembly.Module} policyWasm
 * @param {WebAssembly.Memory} memory
 * @returns {Promise<{ policy: WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance, minorVersion: number }>}
 */
async function _loadPolicy(policyWasm, memory) {
  const addr2string = stringDecoder(memory);

  const env = {};

  const wasm = await WebAssembly.instantiate(policyWasm, {
    env: {
      memory,
      opa_abort: function (addr) {
        throw addr2string(addr);
      },
      opa_println: function (addr) {
        console.log(addr2string(addr));
      },
      opa_builtin0: function (builtinId, _ctx) {
        return _builtinCall(env.instance, memory, env.builtins, builtinId);
      },
      opa_builtin1: function (builtinId, _ctx, arg1) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          builtinId,
          arg1,
        );
      },
      opa_builtin2: function (builtinId, _ctx, arg1, arg2) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          builtinId,
          arg1,
          arg2,
        );
      },
      opa_builtin3: function (builtinId, _ctx, arg1, arg2, arg3) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          builtinId,
          arg1,
          arg2,
          arg3,
        );
      },
      opa_builtin4: function (builtinId, _ctx, arg1, arg2, arg3, arg4) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          builtinId,
          arg1,
          arg2,
          arg3,
          arg4,
        );
      },
    },
  });

  const abiVersionGlobal = wasm.instance.exports.opa_wasm_abi_version;
  if (abiVersionGlobal !== undefined) {
    const abiVersion = abiVersionGlobal.value;
    if (abiVersion !== 1) {
      throw `unsupported ABI version ${abiVersion}`;
    }
  } else {
    console.error("opa_wasm_abi_version undefined"); // logs to stderr
  }

  const abiMinorVersionGlobal =
    wasm.instance.exports.opa_wasm_abi_minor_version;
  let abiMinorVersion;
  if (abiMinorVersionGlobal !== undefined) {
    abiMinorVersion = abiMinorVersionGlobal.value;
  } else {
    console.error("opa_wasm_abi_minor_version undefined");
  }

  env.instance = wasm.instance ? wasm.instance : wasm;

  const builtins = _dumpJSON(
    env.instance,
    memory,
    env.instance.exports.builtins(),
  );

  /** @type {typeof builtIns} */
  env.builtins = {};

  for (const key of Object.keys(builtins)) {
    env.builtins[builtins[key]] = key;
  }

  return { policy: wasm, minorVersion: abiMinorVersion };
}

/**
 * LoadedPolicy is a wrapper around a WebAssembly.Instance and WebAssembly.Memory
 * for a compiled Rego policy. There are helpers to run the wasm instance and
 * handle the output from the policy wasm.
 */
class LoadedPolicy {
  /**
   * Loads and initializes a compiled Rego policy.
   * @param {WebAssembly.WebAssemblyInstantiatedSource} policy
   * @param {WebAssembly.Memory} memory
   */
  constructor(policy, memory, minorVersion) {
    this.minorVersion = minorVersion;
    this.mem = memory;

    // Depending on how the wasm was instantiated "policy" might be a
    // WebAssembly Instance or be a wrapper around the Module and
    // Instance. We only care about the Instance.
    this.wasmInstance = policy.instance ? policy.instance : policy;

    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, {});
    this.baseHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get();
    this.dataHeapPtr = this.baseHeapPtr;
    this.entrypoints = _dumpJSON(
      this.wasmInstance,
      this.mem,
      this.wasmInstance.exports.entrypoints(),
    );
  }

  /**
   * Evaluates the loaded policy with the given input and
   * return the result set. This should be re-used for multiple evaluations
   * of the same policy with different inputs.
   *
   * To call a non-default entrypoint in your WASM specify it as the second
   * param. A list of entrypoints can be accessed with the `this.entrypoints`
   * property.
   * @param {object} input
   * @param {number | string} entrypoint ID or name of the entrypoint to call (optional)
   */
  evaluate(input, entrypoint = 0) {
    // determine entrypoint ID
    if (typeof entrypoint === "number") {
      // used as-is
    } else if (typeof entrypoint === "string") {
      if (Object.prototype.hasOwnProperty.call(this.entrypoints, entrypoint)) {
        entrypoint = this.entrypoints[entrypoint];
      } else {
        throw `entrypoint ${entrypoint} is not valid in this instance`;
      }
    } else {
      throw `entrypoint value is an invalid type, must be either string or number`;
    }

    // ABI 1.2 fastpath
    if (this.minorVersion >= 2) {
      // write input into memory, adjust heap pointer
      let inputLen = 0;
      let inputAddr = 0;
      if (input) {
        const inp = JSON.stringify(input);
        const buf = new Uint8Array(this.mem.buffer);
        inputAddr = this.dataHeapPtr;
        inputLen = inp.length;

        for (let i = 0; i < inputLen; i++) {
          buf[inputAddr + i] = inp.charCodeAt(i);
        }
        this.dataHeapPtr = inputAddr + inputLen;
      }

      const ret = this.wasmInstance.exports.opa_eval(
        0,
        entrypoint,
        this.dataAddr,
        inputAddr,
        inputLen,
        this.dataHeapPtr,
        0,
      );
      return _dumpJSONRaw(this.mem, ret);
    }

    // Reset the heap pointer before each evaluation
    this.wasmInstance.exports.opa_heap_ptr_set(this.dataHeapPtr);

    // Load the input data
    const inputAddr = _loadJSON(this.wasmInstance, this.mem, input);

    // Setup the evaluation context
    const ctxAddr = this.wasmInstance.exports.opa_eval_ctx_new();
    this.wasmInstance.exports.opa_eval_ctx_set_input(ctxAddr, inputAddr);
    this.wasmInstance.exports.opa_eval_ctx_set_data(ctxAddr, this.dataAddr);
    this.wasmInstance.exports.opa_eval_ctx_set_entrypoint(ctxAddr, entrypoint);

    // Actually evaluate the policy
    this.wasmInstance.exports.eval(ctxAddr);

    // Retrieve the result
    const resultAddr = this.wasmInstance.exports.opa_eval_ctx_get_result(
      ctxAddr,
    );
    return _dumpJSON(this.wasmInstance, this.mem, resultAddr);
  }

  /**
   * evalBool will evaluate the policy and return a boolean answer
   * depending on the return code from the policy evaluation.
   * @deprecated Use `evaluate` instead.
   * @param {object} input
   */
  evalBool(input) {
    const rs = this.evaluate(input);
    return rs && rs.length === 1 && rs[0] === true;
  }

  /**
   * Loads data for use in subsequent evaluations.
   * @param {object} data
   */
  setData(data) {
    this.wasmInstance.exports.opa_heap_ptr_set(this.baseHeapPtr);
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
    this.dataHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get();
  }
}

module.exports = {
  /**
   * Takes in either an ArrayBuffer or WebAssembly.Module
   * and will return a LoadedPolicy object which can be used to evaluate
   * the policy.
   *
   * To set custom memory size specify number of memory pages
   * as second param.
   * Defaults to 5 pages (320KB).
   * @param {BufferSource | WebAssembly.Module} regoWasm
   * @param {number} memorySize
   */
  async loadPolicy(regoWasm, memorySize = 5) {
    const memory = new WebAssembly.Memory({ initial: memorySize });
    const { policy, minorVersion } = await _loadPolicy(regoWasm, memory);
    return new LoadedPolicy(policy, memory, minorVersion);
  },
};
