const regexSplit = (pattern: string, s: string) => s.split(RegExp(pattern));

export default { "regex.split": regexSplit };
