package stringified.support

default hasPermission := false
default plainInputBoolean := false
default plainInputNumber := false
default plainInputString := false

hasPermission if {
    input.secret == data.secret
}

hasPermission if {
    input.permissions[_] == data.roles["1"].permissions[_].id
}

plainInputBoolean if {
    input = true
}

plainInputNumber if {
    input = 5
}

plainInputString if {
    input = "test"
}