// Copyright 2018 The OPA Authors.  All rights reserved.
// Use of this source code is governed by an Apache2
// license that can be found in the LICENSE file.
const builtIns = require("./builtins/index");

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
 * @param {any | ArrayBuffer} value data as `object`, literal primitive or ArrayBuffer (last is assumed to be a well-formed stringified JSON)
 * @returns {number}
 */
function _loadJSON(wasmInstance, memory, value) {
  if (value === undefined) {
    return 0;
  }

  let valueBuf;
  if (value instanceof ArrayBuffer) {
    valueBuf = new Uint8Array(value);
  } else {
    const valueAsText = JSON.stringify(value);
    valueBuf = new TextEncoder().encode(valueAsText);
  }

  const valueBufLen = valueBuf.byteLength;
  const rawAddr = wasmInstance.exports.opa_malloc(valueBufLen);
  const memoryBuffer = new Uint8Array(memory.buffer);
  memoryBuffer.set(valueBuf, rawAddr);

  const parsedAddr = wasmInstance.exports.opa_json_parse(rawAddr, valueBufLen);

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

  let idx = addr;

  while (buf[idx] !== 0) {
    idx++;
  }

  const utf8View = new Uint8Array(memory.buffer, addr, idx - addr);
  const jsonAsText = new TextDecoder().decode(utf8View);

  return JSON.parse(jsonAsText);
}

const builtinFuncs = builtIns;

/**
 * _builtinCall dispatches the built-in function. The built-in function
 * arguments are loaded from Wasm and back in using JSON serialization.
 * @param {WebAssembly.Instance} wasmInstance
 * @param {WebAssembly.Memory} memory
 * @param {{ [builtinId: number]: string }} builtins
 * @param {{ [builtinName: string]: Function }} customBuiltins
 * @param {string} builtin_id
 */
function _builtinCall(
  wasmInstance,
  memory,
  builtins,
  customBuiltins,
  builtinId,
) {
  const builtInName = builtins[builtinId];
  const impl = builtinFuncs[builtInName] || customBuiltins[builtInName];

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

  for (let i = 5; i < argArray.length; i++) {
    const jsArg = _dumpJSON(wasmInstance, memory, argArray[i]);
    args.push(jsArg);
  }

  const result = impl(...args);

  return _loadJSON(wasmInstance, memory, result);
}

/**
 * _importObject builds the WebAssembly.Imports
 * @param {Object} env
 * @param {WebAssembly.Memory} memory
 * @param {{ [builtinName: string]: Function }} customBuiltins
 * @returns {WebAssembly.Imports}
 */
function _importObject(env, memory, customBuiltins) {
  const addr2string = stringDecoder(memory);

  return {
    env: {
      memory,
      opa_abort: function (addr) {
        throw addr2string(addr);
      },
      opa_println: function (addr) {
        console.log(addr2string(addr));
      },
      opa_builtin0: function (builtinId, _ctx) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
        );
      },
      opa_builtin1: function (builtinId, _ctx, arg1) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
          builtinId,
          arg1,
        );
      },
      opa_builtin2: function (builtinId, _ctx, arg1, arg2) {
        return _builtinCall(
          env.instance,
          memory,
          env.builtins,
          customBuiltins,
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
          customBuiltins,
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
          customBuiltins,
          builtinId,
          arg1,
          arg2,
          arg3,
          arg4,
        );
      },
    },
  };
}

/**
 * _preparePolicy checks the ABI version and loads the built-in functions
 * @param {Object} env
 * @param {WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance} wasm
 * @param {WebAssembly.Memory} memory
 * @returns { policy: WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance, minorVersion: number }}
 */
function _preparePolicy(env, wasm, memory) {
  env.instance = wasm.instance ? wasm.instance : wasm;

  // Note: On Node 10.x this value is a number on Node 12.x and up it is
  // an object with numberic `value` property.
  const abiVersionGlobal = env.instance.exports.opa_wasm_abi_version;
  if (abiVersionGlobal !== undefined) {
    const abiVersion = typeof abiVersionGlobal === "number"
      ? abiVersionGlobal
      : abiVersionGlobal.value;
    if (abiVersion !== 1) {
      throw `unsupported ABI version ${abiVersion}`;
    }
  } else {
    console.error("opa_wasm_abi_version undefined"); // logs to stderr
  }

  const abiMinorVersionGlobal = env.instance.exports.opa_wasm_abi_minor_version;
  let abiMinorVersion;
  if (abiMinorVersionGlobal !== undefined) {
    abiMinorVersion = typeof abiMinorVersionGlobal === "number"
      ? abiMinorVersionGlobal
      : abiMinorVersionGlobal.value;
  } else {
    console.error("opa_wasm_abi_minor_version undefined");
  }

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
 * _loadPolicy can take in either an ArrayBuffer or WebAssembly.Module
 * as its first argument, a WebAssembly.Memory for the second parameter,
 * and an object mapping string names to additional builtin functions for
 * the third parameter.
 * It will return a Promise, depending on the input type the promise
 * resolves to both a compiled WebAssembly.Module and its first WebAssembly.Instance
 * or to the WebAssemblyInstance.
 * @param {BufferSource | WebAssembly.Module} policyWasm
 * @param {WebAssembly.Memory} memory
 * @param {{ [builtinName: string]: Function }} customBuiltins
 * @returns {Promise<{ policy: WebAssembly.WebAssemblyInstantiatedSource | WebAssembly.Instance, minorVersion: number }>}
 */
async function _loadPolicy(policyWasm, memory, customBuiltins) {
  const env = {};

  const wasm = await WebAssembly.instantiate(
    policyWasm,
    _importObject(env, memory, customBuiltins),
  );

  return _preparePolicy(env, wasm, memory);
}

/**
 * _loadPolicySync can take in either an ArrayBuffer or WebAssembly.Module
 * as its first argument, a WebAssembly.Memory for the second parameter,
 * and an object mapping string names to additional builtin functions for
 * the third parameter.
 * It will return a compiled WebAssembly.Module and its first WebAssembly.Instance.
 * @param {BufferSource | WebAssembly.Module} policyWasm
 * @param {WebAssembly.Memory} memory
 * @param {{ [builtinName: string]: Function }} customBuiltins
 * @returns {Promise<{ policy: WebAssembly.Instance, minorVersion: number }>}
 */
function _loadPolicySync(policyWasm, memory, customBuiltins) {
  const env = {};

  if (
    policyWasm instanceof ArrayBuffer ||
    policyWasm.buffer instanceof ArrayBuffer
  ) {
    policyWasm = new WebAssembly.Module(policyWasm);
  }

  const wasm = new WebAssembly.Instance(
    policyWasm,
    _importObject(env, memory, customBuiltins),
  );

  return _preparePolicy(env, wasm, memory);
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
   * @param {any | ArrayBuffer} input input to be evaluated in form of `object`, literal primitive or ArrayBuffer (last is assumed to be a well-formed stringified JSON)
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
      let inputBuf = null;
      let inputLen = 0;
      let inputAddr = 0;
      if (input) {
        if (input instanceof ArrayBuffer) {
          inputBuf = new Uint8Array(input);
        } else {
          const inputAsText = JSON.stringify(input);
          inputBuf = new TextEncoder().encode(inputAsText);
        }

        inputAddr = this.dataHeapPtr;
        inputLen = inputBuf.byteLength;
        const delta = inputAddr + inputLen - this.mem.buffer.byteLength;
        if (delta > 0) {
          const pages = roundup(delta);
          this.mem.grow(pages);
        }
        const buf = new Uint8Array(this.mem.buffer);
        buf.set(inputBuf, this.dataHeapPtr);
      }

      // opa_eval will update the Instance heap pointer to the value below
      const heapPtr = this.dataHeapPtr + inputLen;

      const ret = this.wasmInstance.exports.opa_eval(
        0,
        entrypoint,
        this.dataAddr,
        inputAddr,
        inputLen,
        heapPtr,
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
   * @param {object | ArrayBuffer} data  data in form of `object` or ArrayBuffer (last is assumed to be a well-formed stringified JSON)
   */
  setData(data) {
    this.wasmInstance.exports.opa_heap_ptr_set(this.baseHeapPtr);
    this.dataAddr = _loadJSON(this.wasmInstance, this.mem, data);
    this.dataHeapPtr = this.wasmInstance.exports.opa_heap_ptr_get();
  }
}

function roundup(bytes) {
  const pageSize = 64 * 1024;
  return Math.ceil(bytes / pageSize);
}

module.exports = {
  /**
   * Takes in either an ArrayBuffer or WebAssembly.Module
   * and will return a Promise of a LoadedPolicy object which
   * can be used to evaluate the policy.
   *
   * To set custom memory size specify number of memory pages
   * as second param.
   * Defaults to 5 pages (320KB).
   * @param {BufferSource | WebAssembly.Module} regoWasm
   * @param {number | WebAssembly.MemoryDescriptor} memoryDescriptor For backwards-compatibility, a 'number' argument is taken to be the initial memory size.
   * @param {{ [builtinName: string]: Function }} customBuiltins A map from string names to builtin functions
   * @returns {Promise<LoadedPolicy>}
   */
  async loadPolicy(regoWasm, memoryDescriptor = {}, customBuiltins = {}) {
    // back-compat, second arg used to be a number: 'memorySize', with default of 5
    if (typeof memoryDescriptor === "number") {
      memoryDescriptor = { initial: memoryDescriptor };
    }
    memoryDescriptor.initial = memoryDescriptor.initial || 5;

    const memory = new WebAssembly.Memory(memoryDescriptor);
    const { policy, minorVersion } = await _loadPolicy(
      regoWasm,
      memory,
      customBuiltins,
    );
    return new LoadedPolicy(policy, memory, minorVersion);
  },

  /**
   * Takes in either an ArrayBuffer or WebAssembly.Module
   * and will return a LoadedPolicy object which can be
   * used to evaluate the policy.
   *
   * This cannot be used from the main thread in a browser.
   * You must use the `loadPolicy` function instead, or call
   * from a worker thread.
   *
   * To set custom memory size specify number of memory pages
   * as second param.
   * Defaults to 5 pages (320KB).
   * @param {BufferSource | WebAssembly.Module} regoWasm
   * @param {number | WebAssembly.MemoryDescriptor} memoryDescriptor For backwards-compatibility, a 'number' argument is taken to be the initial memory size.
   * @param {{ [builtinName: string]: Function }} customBuiltins A map from string names to builtin functions
   * @returns {LoadedPolicy}
   */
  loadPolicySync(regoWasm, memoryDescriptor = {}, customBuiltins = {}) {
    // back-compat, second arg used to be a number: 'memorySize', with default of 5
    if (typeof memoryDescriptor === "number") {
      memoryDescriptor = { initial: memoryDescriptor };
    }
    memoryDescriptor.initial = memoryDescriptor.initial || 5;

    const memory = new WebAssembly.Memory(memoryDescriptor);
    const { policy, minorVersion } = _loadPolicySync(
      regoWasm,
      memory,
      customBuiltins,
    );
    return new LoadedPolicy(policy, memory, minorVersion);
  },
  LoadedPolicy,
};
