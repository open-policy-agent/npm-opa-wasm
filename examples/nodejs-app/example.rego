package example

default hello = false

hello if {
    x := input.message
    x == data.world
}
