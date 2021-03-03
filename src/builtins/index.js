const numbers = require("./numbers");
const aggregates = require("./aggregates");
const arrays = require("./arrays");
const strings = require("./strings");
const regex = require("./regex");
const types = require("./types");
const conversions = require("./conversions");
const jwt = require("./jwt");

module.exports = {
  ...numbers,
  ...aggregates,
  ...arrays,
  ...strings,
  ...regex,
  ...types,
  ...conversions,
  ...jwt,
};
