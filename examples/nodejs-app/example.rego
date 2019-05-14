package example

allow {
    input.method = "get"
    input.path = "/trades"
}

allow {
    input.method = "post"
    input.path = "/trades"
    input.role = "admin"
}