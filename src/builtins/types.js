// Types
is_number = (x) => !isNaN(x);
is_string = (x) => typeof x == "string";
is_boolean = (x) => typeof x == "boolean";
is_array = (x) => Array.isArray(x);
is_set = (x) => x instanceof Set;
is_object = (x) => typeof x == "object";
is_null = (x) => x === null;
type_name = (x) => typeof x;

module.exports = {
  is_number,
  is_string,
  is_boolean,
  is_array,
  is_set,
  is_object,
  is_null,
  type_name,
};
