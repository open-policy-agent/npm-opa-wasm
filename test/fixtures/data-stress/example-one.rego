package example.one

default myRule := false
default myOtherRule := false

myRule if {
    input.someProp == "thisValue"
}

myOtherRule if {
    input.anotherProp == "thatValue"
}

myCompositeRule if {
    myRule
    myOtherRule
}