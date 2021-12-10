const json = require("./json");
const strings = require("./strings");
const regex = require("./regex");
const yaml = require("./yaml");

module.exports = {
  ...json,
  ...strings,
  ...regex,
  ...yaml,
};
