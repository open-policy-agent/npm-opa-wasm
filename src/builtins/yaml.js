const yaml = require("yaml");

// see: https://eemeli.org/yaml/v1/#errors
const errors = new Set([
  "YAMLReferenceError",
  "YAMLSemanticError",
  "YAMLSyntaxError",
  "YAMLWarning",
]);

const unmarshal = function (str) {
  const YAML_SILENCE_WARNINGS_CACHED = global.YAML_SILENCE_WARNINGS;
  try {
    // see: https://eemeli.org/yaml/v1/#silencing-warnings
    global.YAML_SILENCE_WARNINGS = true;
    return yaml.parse(str);
  } catch (err) {
    // Ignore parser errors.
    if (err && errors.has(err.name)) {
      return false;
    }
    throw err;
  } finally {
    global.YAML_SILENCE_WARNINGS = YAML_SILENCE_WARNINGS_CACHED;
  }
};

module.exports = { "yaml.unmarshal": unmarshal };
