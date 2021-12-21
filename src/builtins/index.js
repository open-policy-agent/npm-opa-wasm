import json from "./json.js";
import strings from "./strings.js";
import regex from "./regex.js";
import yaml from "./yaml.js";

export default {
  ...json,
  ...strings,
  ...regex,
  ...yaml,
};
