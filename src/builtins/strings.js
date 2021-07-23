const vsprintf = require('sprintf-js').vsprintf

sprintf = (s, values) => vsprintf(s, values);

module.exports = { sprintf };
