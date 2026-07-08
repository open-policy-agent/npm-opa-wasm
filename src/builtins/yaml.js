const yaml = require("yaml");

function parse(str) {
  if (typeof str !== "string") {
    return { ok: false, result: undefined };
  }

  const doc = yaml.parseDocument(str, { logLevel: "silent" });
  if (doc.errors.length > 0 || doc.warnings.length > 0) {
    return { ok: false, result: undefined };
  }

  return { ok: true, result: doc.toJS() };
}

module.exports = {
  // is_valid is expected to return nothing if input is invalid otherwise
  // true/false for it being valid YAML.
  "yaml.is_valid": (str) => typeof str === "string" ? parse(str).ok : undefined,
  "yaml.marshal": (data) => yaml.stringify(data),
  "yaml.unmarshal": (str) => parse(str).result,
};
