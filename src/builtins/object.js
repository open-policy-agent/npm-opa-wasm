union = function() {
    var obj = {};
    for(var i = 0; i < arguments.length; i++) {
        obj = Object.assign(obj, arguments[i]);
    }
    return obj;
}

remove = function(obj, key) {
    var newObj = Object.assign({}, obj);
    delete newObj[key];
    return newObj;
}

module.exports = { 
    "object.union": union,
    "object.remove": remove,
 };
