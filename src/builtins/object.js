union = function() {
    var obj = {};
    for(var i = 0; i < arguments.length; i++) {
        obj = Object.assign(obj, arguments[i]);
    }
    return obj;
}

remove = function(object, keys) {
    if(!(typeof object === "object" && object && object.constructor === Object)) {
        if(object instanceof Set) {
            throw 'object.remove: invalid argument(s)';
        }
        throw `object.remove: operand 1 must be object but got ${object === null || object === undefined ? 'var' : typeof object === 'object' ? object.constructor.name.toLowerCase() : typeof object}`;
    }
    var newObj = Object.assign({}, object);
    if(keys instanceof Set || keys instanceof Array) {
        for(var k of keys) {
            delete newObj[k];
        }
    } else if(typeof keys === "object" && keys && keys.constructor === Object) {
        for(var k in keys) {
            if(keys.hasOwnProperty(k)) {
                delete newObj[k];
            }
        }
    } else {
        throw `object.remove: operand 2 must be one of {object, string, array} but got ${typeof keys === 'object' ? 'var' : typeof keys}`;
    }
    return newObj;
}

module.exports = { 
    "object.union": union,
    "object.remove": remove,
 };
