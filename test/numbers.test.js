const { plus, minus } = require("../src/builtins");

describe("numbers", () => {
  describe("plus", () => {
    it("should add two numbers", () => {
      expect(plus(1, 2)).toEqual(3);
    });
  });
  describe("minus", () => {
    it("should minus two numbers", () => {
      expect(minus(2, 1)).toEqual(1);
    });
  });
});
