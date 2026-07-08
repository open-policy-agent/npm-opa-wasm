package yaml.support

fixture := `
---
openapi: "3.0.1"
info:
  title: test
paths:
  /path1:
    get:
      x-amazon-apigateway-integration:
        type: "mock"
        httpMethod: "GET"
x-amazon-apigateway-policy:
  Version: "2012-10-17"
  Statement:
    - Effect: Allow
      Principal:
        AWS: "*"
      Action:
        - 'execute-api:Invoke'
      Resource: '*'
`

canParseYAML if {
	resource := yaml.unmarshal(fixture)
	resource.info.title == "test"
}

hasSemanticError if {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L22
	yaml.unmarshal("a:\n\t1\nb:\n\t2\n")
}

hasSyntaxError if {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L49
	yaml.unmarshal("{ , }\n---\n{ 123,,, }\n")
}

hasReferenceError if {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L245
	yaml.unmarshal("{ , }\n---\n{ 123,,, }\n")
}

hasYAMLWarning if {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L224
	yaml.unmarshal("%FOO\n---bar\n")
}

canMarshalYAML contains x if {
	string := yaml.marshal(input)
	x := yaml.unmarshal(string)
}

isValidYAML if {
	yaml.is_valid(fixture) == true
	yaml.is_valid("foo: {") == false
	yaml.is_valid("{\"foo\": \"bar\"}") == true
}
