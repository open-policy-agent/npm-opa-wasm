package custom_builtins

zero_arg = x if {
  x = custom.zeroArgBuiltin()
}

one_arg = x if {
    x = custom.oneArgBuiltin(input.args[0])
}

two_arg = x if {
    x = custom.twoArgBuiltin(input.args[0], input.args[1])
}

three_arg = x if {
    x = custom.threeArgBuiltin(input.args[0], input.args[1], input.args[2])
}

four_arg = x if {
    x = custom.fourArgBuiltin(input.args[0], input.args[1], input.args[2], input.args[3])
}

valid_json if {
    json.is_valid("{}")
}
