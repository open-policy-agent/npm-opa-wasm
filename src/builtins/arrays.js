arrayConcat = (arr1, arr2) => arr1.concat(arr2);
arraySlice = (arr, startIndex, stopIndex) => arr.slice(startIndex, stopIndex);

module.exports = { "array.concat": arrayConcat, "array.slice": arraySlice };
