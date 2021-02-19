var jose = require('jose');

var tokenConstraintTypes = {
    "cert": tokenConstraintCert,
    "secret": (constraints) => tokenConstraintString("secret", constraints),
    "alg": (constraints) => tokenConstraintString("alg", constraints),
    "iss": (constraints) => tokenConstraintString("iss", constraints),
    "aud": (constraints) => tokenConstraintString("aud", constraints),
    "time": tokenConstraintTime
};

// getKeyFromCertOrJWK returns the public key found in a X.509 certificate or JWK key(s).
// A valid PEM block is never valid JSON (and vice versa), hence can try parsing both.
function getKeyFromCertOrJWK(certificate) {
    // Node docs: if the format is 'pem',
    // the 'key' may also be an X.509 certificate.
    // should throw if it encounters errors...
    var key = JWK.asKey({
        key: certificate,
        format: 'pem'
    });
    // just in case...
    if(key.type !== "public") {
        throw "failed to extract a public Key from the PEM certificate";
    }
    // upstream go requires "materialize"
    return key;
}

// tokenConstraintCert handles the `cert` constraint.
function tokenConstraintCert(constraints) {
    constraints = tokenConstraintString("cert", constraints)
    constraints.keys = getKeyFromCertOrJWK(constraints["cert"])
    return constraints;
}

// tokenConstraintTime handles the `time` constraint.
function tokenConstraintTime(constraints) {
    if(typeof constraints["time"] !== "number" || isNaN(constraints["time"])) {
        throw "time constraint: must be a number";
    }
    if(constraints["time"] < 0) {
        throw "token time constraint: must not be negative";
    }
    return constraints;
}

// tokenConstraintString handles string constraints.
function tokenConstraintString(name, constraints) {
    if(typeof constraints[name] !== "string") {
        throw name + " constraint: must be a string";
    }
    return constraints;
}

// parseTokenConstraints parses the constraints argument.
function parseTokenConstraints(constraints) {
    if(constraints.constructor.name !== "Object") {
        throw("token constraints must be object");
    }
    for(var name in constraints) {
        if(tokenConstraintTypes.hasOwnProperty(name)) {
            var handler = tokenConstraintTypes[name];
            constraints = handler(constraints);
        } else {
            throw "unknown token validation constraint: " + name;
        }
    }
    return constraints;
}

// Implements JWT decoding/validation based on RFC 7519 Section 7.2:
// https://tools.ietf.org/html/rfc7519#section-7.2
// It does no data validation, it merely checks that the given string
// represents a structurally valid JWT. It supports JWTs using JWS compact
// serialization.
function builtinJWTDecode(token) {
    var t = jose.JWT.decode(token, { complete: true });
    var hexSig = new Buffer(t.signature, 'base64').toString('hex');
    return [ t.header, t.payload, hexSig ];
}

function _verify(string, certificate, algorithms) {
    try {
        JWT.verify(string, certificate, { algorithms: algorithms });
        return true;
    } catch(e) {
        return false;
    }
}

// validate validates the constraints argument.
function validateConstraints(constraints) {
    var keys = 0;
    if(constraints.keys !== undefined) {
        keys++;
    }
    if(constraints.secret !== "") {
        keys++;
    }
    if(keys > 1) {
        throw "duplicate key constraints";
    }
    if(keys < 1) {
        throw "no key constraint";
    }
}

// Implements full JWT decoding, validation and verification.
function builtinJWTDecodeVerify(string, constraints) {
	// io.jwt.decode_verify(string, constraints, [valid, header, payload])
	//
	// If valid is true then the signature verifies and all constraints are met.
	// If valid is false then either the signature did not verify or some constrain
	// was not met.
	//
	// Decoding errors etc are returned as errors.
    constraints = parseTokenConstraints(constraints);
    validateConstraints(constraints);

    var options = { complete: true };
    if(constraints.alg) {
        options.algorithms = [constraints.alg];
    }
    if(constraints.iss) {
        options.issuer = constraints.iss;
    }
    if(constraints.time) {
        options.now = new Date(time/1e6) // constraints.time is in nanoseconds
    }
    if(constraints.aud) {
        options.audience = constraints.aud; // aud can be array or string
    }

    try {
        var t = jose.JWT.verify(string, constraints.cert || constraints.secret, options);
        var hexSig = new Buffer(t.signature, 'base64').toString('hex');

        // if constraints.aud is absent then the aud claim must be absent too.
        if(!constraints.aud && t.payload.aud) {
            return [false, {}, {}];
        }
        return [true, t.header, t.payload];
    } catch(e) {
        return [false, {}, {}];
    }
};

// io.jwt.encode_sign_raw() takes three JSON Objects (strings)
// as parameters and returns their JWS Compact Serialization.
// This builtin should be used by those that want maximum control
// over the signing and serialization procedure. It is important to
// remember that StringOrURI values are compared as case-sensitive
// strings with no transformations or canonicalizations applied.
// Therefore, line breaks and whitespaces are significant.

// headers, payload and key are JSON objects that represent
// the JWS Protected Header, JWS Payload and JSON Web Key (RFC7517)
// respectively.
function builtinJWTEncodeSignRaw(headers, payload, key) {
    var header = JSON.parse(headers);
    var key = JWK.asKey(JSON.parse(key));
    return jose.JWS.sign(payload, key, {
        ...header,
        alg: header.alg,
        kid: key.kid || header.kid
    });
}

// io.jwt.encode_sign() takes three Rego Objects as parameters and
// returns their JWS Compact Serialization. This builtin should be
// used by those that want to use rego objects for signing during
// policy evaluation.

// Note that with io.jwt.encode_sign the Rego objects are serialized
// to JSON with standard formatting applied whereas the
// io.jwt.encode_sign_raw built-in will not affect whitespace of
// the strings passed in. This will mean that the final encoded token
// may have different string values, but the decoded and parsed JSON
// will match.

// headers, payload and key are JSON objects that represent
// the JWS Protected Header, JWS Payload and JSON Web Key (RFC7517)
// respectively.
function builtinJWTEncodeSign(headers, payload, key) {
    return jose.JWT.sign(payload, key, {
        header: headers
    });
}

module.exports = {
    "io.jwt.verify_rs256": (string, certificate) => _verify(string, certificate, ['RS256']),
    "io.jwt.verify_rs384": (string, certificate) => _verify(string, certificate, ['RS384']),
    "io.jwt.verify_rs512": (string, certificate) => _verify(string, certificate, ['RS512']),
    "io.jwt.verify_ps256": (string, certificate) => _verify(string, certificate, ['PS256']),
    "io.jwt.verify_ps384": (string, certificate) => _verify(string, certificate, ['PS384']),
    "io.jwt.verify_ps512": (string, certificate) => _verify(string, certificate, ['PS512']),
    "io.jwt.verify_es256": (string, certificate) => _verify(string, certificate, ['ES256']),
    "io.jwt.verify_es384": (string, certificate) => _verify(string, certificate, ['ES384']),
    "io.jwt.verify_es512": (string, certificate) => _verify(string, certificate, ['ES512']),
    "io.jwt.verify_hs256": (string, certificate) => _verify(string, certificate, ['HS256']),
    "io.jwt.verify_hs384": (string, certificate) => _verify(string, certificate, ['HS384']),
    "io.jwt.verify_hs512": (string, certificate) => _verify(string, certificate, ['HS512']),
    "io.jwt.decode": builtinJWTDecode,
    "io.jwt.decode_verify": builtinJWTDecodeVerify,
    "io.jwt.encode_sign_raw": builtinJWTEncodeSignRaw,
    "io.jwt.encode_sign": builtinJWTEncodeSign,
};
