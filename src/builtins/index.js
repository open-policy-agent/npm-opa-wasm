const strings = require("./strings");
const regex = require("./regex");
const yaml = require("./yaml");

module.exports = {
  ...strings,
  ...regex,
  ...yaml,
};
