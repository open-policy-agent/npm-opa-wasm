package example.two

import input

default theirRule = false
default ourRule = false

theirRule {
    input.anyProp == "aValue"
}

ourRule {
    input.ourProp == "inTheMiddleOfTheStreet"
}

coolRule {
    theirRule
    ourRule
}