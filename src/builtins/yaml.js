const yaml = require("yaml");

// see: https://eemeli.org/yaml/v1/#errors
const errors = new Set([
  "YAMLReferenceError",
  "YAMLSemanticError",
  "YAMLSyntaxError",
  "YAMLWarning",
]);

function parse(str) {
  if (typeof str !== "string") {
    return { ok: false, result: undefined };
  }

  const YAML_SILENCE_WARNINGS_CACHED = global.YAML_SILENCE_WARNINGS;
  try {
    // see: https://eemeli.org/yaml/v1/#silencing-warnings
    global.YAML_SILENCE_WARNINGS = true;
    return { ok: true, result: yaml.parse(str) };
  } catch (err) {
    // Ignore parser errors.
    if (err && errors.has(err.name)) {
      return { ok: false, result: undefined };
    }
    throw err;
  } finally {
    global.YAML_SILENCE_WARNINGS = YAML_SILENCE_WARNINGS_CACHED;
  }
}

module.exports = {
  // is_valid is expected to return false if input is invalid; and true/false for it being valid YAML.
  "yaml.is_valid": (str) => typeof str === "string" && parse(str).ok,
  "yaml.marshal": (data) => yaml.stringify(data),
  "yaml.unmarshal": (str) => parse(str).result,
};
