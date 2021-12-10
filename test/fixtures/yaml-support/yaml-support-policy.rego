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

canParseYAML {
	resource := yaml.unmarshal(fixture)
	resource.info.title == "test"
}

hasSemanticError {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L22
	yaml.unmarshal("a:\n\t1\nb:\n\t2\n")
}

hasSyntaxError {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L49
	yaml.unmarshal("{ , }\n---\n{ 123,,, }\n")
}

hasReferenceError {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L245
	yaml.unmarshal("{ , }\n---\n{ 123,,, }\n")
}

hasYAMLWarning {
	# see: https://github.com/eemeli/yaml/blob/395f892ec9a26b9038c8db388b675c3281ab8cd3/tests/doc/errors.js#L224
	yaml.unmarshal("%FOO\n---bar\n")
}

canMarshalYAML[x] {
	string := yaml.marshal(input)
	x := yaml.unmarshal(string)
}

isValidYAML {
	yaml.is_valid(fixture) == true
	yaml.is_valid("foo: {") == false
	yaml.is_valid("{\"foo\": \"bar\"}") == true
}
