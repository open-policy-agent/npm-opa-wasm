const vsprintf = require("sprintf-js").vsprintf;

const sprintf = (s, values) => vsprintf(s, values);

module.exports = { sprintf };
