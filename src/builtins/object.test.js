const object = require('./object');

const testCases = { "object.remove": [
    {
        note:     "base",
        object:   {"a": 1, "b": {"c": 3}},
        keys:     new Set(["a"]),
        expected: {"b": {"c": 3}},
    },
    {
        note:     "multiple keys set",
        object:   {"a": 1, "b": {"c": 3}, "d": 4},
        keys:     new Set(["d", "b"]),
        expected: {"a": 1},
    },
    {
        note:     "multiple keys array",
        object:   {"a": 1, "b": {"c": 3}, "d": 4},
        keys:     ["d", "b"],
        expected: {"a": 1},
    },
    {
        note:     "multiple keys object",
        object:   {"a": 1, "b": {"c": 3}, "d": 4},
        keys:     {"d": "", "b": 1},
        expected: {"a": 1},
    },
    {
        note:     "multiple keys object nested",
        object:   {"a": {"b": {"c": 2}}, "x": 123},
        keys:     {"a": {"b": {"foo": "bar"}}},
        expected: {"x": 123},
    },
    {
        note:     "empty object",
        object:   {},
        keys:     new Set(["a", "b"]),
        expected: {},
    },
    {
        note:     "empty keys set",
        object:   {"a": 1, "b": {"c": 3}},
        keys:     new Set(),
        expected: {"a": 1, "b": {"c": 3}},
    },
    {
        note:     "empty keys array",
        object:   {"a": 1, "b": {"c": 3}},
        keys:     [],
        expected: {"a": 1, "b": {"c": 3}},
    },
    {
        note:     "empty keys obj",
        object:   {"a": 1, "b": {"c": 3}},
        keys:     {},
        expected: {"a": 1, "b": {"c": 3}},
    },
    {
        note:     "key doesnt exist",
        object:   {"a": 1, "b": {"c": 3}},
        keys:     new Set(["z"]),
        expected: {"a": 1, "b": {"c": 3}},
    },
    {
        note:     "error invalid object param type set",
        object:   new Set(["a"]),
        keys:     new Set(["a"]),
        expected: new Error("object.remove: invalid argument(s)"),
    },
    // {
    //     note:     "error invalid object param type bool",
    //     object:   false,
    //     keys:     new Set("a"),
    //     expected: new Error("object.remove: invalid argument(s)"),
    // },
    {
        note:     "error invalid object param type array input",
        object:   ["a"],
        keys:     new Set(["a"]),
        expected: new Error("object.remove: operand 1 must be object but got array"),
    },
    {
        note:     "error invalid object param type bool input",
        object:   false,
        keys:     new Set(["a"]),
        expected: new Error("object.remove: operand 1 must be object but got boolean"),
    },
    {
        note:     "error invalid object param type number input",
        object:   123,
        keys:     new Set(["a"]),
        expected: new Error("object.remove: operand 1 must be object but got number"),
    },
    {
        note:     "error invalid object param type string input",
        object:   "foo",
        keys:     new Set(["a"]),
        expected: new Error("object.remove: operand 1 must be object but got string"),
    },
    {
        note:     "error invalid object param type nil input",
        object:   null,
        keys:     new Set(["a"]),
        expected: new Error("object.remove: operand 1 must be object but got var"),
    },
    // {
    //     note:     "error invalid key param type string",
    //     object:   {"a": 1},
    //     keys:     "a",
    //     expected: new Error("object.remove: invalid argument(s)"),
    // },
    // {
    //     note:     "error invalid key param type boolean",
    //     object:   {"a": 1},
    //     keys:     false,
    //     expected: new Error("object.remove: invalid argument(s)"),
    // },
    {
        note:     "error invalid key param type string input",
        object:   {"a": 1},
        keys:     "foo",
        expected: new Error("object.remove: operand 2 must be one of {object, string, array} but got string"),
    },
    {
        note:     "error invalid key param type boolean input",
        object:   {"a": 1},
        keys:     true,
        expected: new Error("object.remove: operand 2 must be one of {object, string, array} but got boolean"),
    },
    {
        note:     "error invalid key param type number input",
        object:   {"a": 1},
        keys:     22,
        expected: new Error("object.remove: operand 2 must be one of {object, string, array} but got number"),
    },
    {
        note:     "error invalid key param type nil input",
        object:   {"a": 1},
        keys:     null,
        expected: new Error("object.remove: operand 2 must be one of {object, string, array} but got var"),
    },
]};

for(const [subject, cases] of Object.entries(testCases)) {
    describe(`object.${subject}`, () => {
        cases.forEach(c => {
            test(c.note, () => {
                const test = () => object[subject](c.object, c.keys);
                if(c.expected instanceof Error) {
                    expect(test).toThrow(c.expected);
                } else {
                    expect(test()).toEqual(c.expected);
                }
            });
        });
    });
}