re_match = (pattern, value) => RegExp(pattern).test(value);
regexSplit = (pattern, s) => s.split(RegExp(pattern));

module.exports = { "regex.split": regexSplit, re_match };
