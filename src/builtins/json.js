function isValidJSON(str) {
  if (typeof str !== "string") {
    return false;
  }
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    if (err instanceof SyntaxError) {
      return false;
    }
    throw err;
  }
}

module.exports = {
  "json.is_valid": isValidJSON,
};
