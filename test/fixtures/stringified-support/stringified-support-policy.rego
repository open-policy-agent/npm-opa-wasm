package stringified.support

default hasPermission = false
default plainInputBoolean = false
default plainInputNumber = false
default plainInputString = false

hasPermission {
    input.secret == data.secret
}

hasPermission {
    input.permissions[_] == data.roles["1"].permissions[_].id
}

plainInputBoolean {
    input = true
}

plainInputNumber {
    input = 5
}

plainInputString {
    input = "test"
}