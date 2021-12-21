function isValidJSON(str) {
  if (typeof str !== "string") {
    return;
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

export default {
  "json.is_valid": isValidJSON,
};
