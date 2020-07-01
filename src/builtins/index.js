const numbers = require("./numbers");
const aggregates = require("./aggregates");
const arrays = require("./arrays");
const jwt = require("./jwt");
const strings = require("./strings");
const regex = require("./regex");
const types = require("./types");
const conversions = require("./conversions");

module.exports = {
  ...numbers,
  ...aggregates,
  ...arrays,
  ...jwt,
  ...strings,
  ...regex,
  ...types,
  ...conversions,
};
