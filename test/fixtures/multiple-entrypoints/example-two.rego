package example.two

default theirRule := false
default ourRule := false

theirRule if {
    input.anyProp == "aValue"
}

ourRule if {
    input.ourProp == "inTheMiddleOfTheStreet"
}

coolRule if {
    theirRule
    ourRule
}