contains = (s, search) => s.includes(search);
endswith = (s, search) => s.endsWith(search);
indexof = (s, search) => s.indexOf(search);
lower = (s) => s.toLowerCase();
replace = (s, searchValue, newValue) => s.replace(searchValue, newValue);
split = (s, delimiter) => s.split(delimiter);
sprintf = (s, values) => s.sprintf(values);
startswith = (s, search) => s.startsWith(search);
// substring: output is the portion of string from index start and having 
// a length of length. If length is less than zero, length is 
// the remainder of the string. If start is greater than the 
// length of the string, output is empty. It is invalid to pass 
// a negative offset to this function.
substring = (s, start, length) => {
  if(start < 0) {
    throw "negative offset";
  }
  if(length < 0) {
    length = undefined;
  }
  return s.substr(start, length);
}
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
