var vsprintf = require('sprintf-js').vsprintf

contains = (s, search) => s.includes(search);
endswith = (s, search) => s.endsWith(search);
indexof = (s, search) => s.indexOf(search);
lower = (s) => s.toLowerCase();
replace = (s, searchValue, newValue) => s.replace(searchValue, newValue);
split = (s, delimiter) => s.split(delimiter);
sprintf = (s, values) => vsprintf(s, values);
startswith = (s, search) => s.startsWith(search);
substring = (s, start, length) => s.substr(start, length);
concat = (delimiter, arr) => arr.join(delimiter);

module.exports = {
  contains,
  endswith,
  indexof,
  lower,
  replace,
  split,
  sprintf,
  startswith,
  substring,
  concat,
};
