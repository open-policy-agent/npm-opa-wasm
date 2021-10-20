package example.one

default myRule = false
default myOtherRule = false

myRule {
    input.someProp == "thisValue"
}

myOtherRule {
    input.anotherProp == "thatValue"
}

myCompositeRule {
    myRule
    myOtherRule
}