count = (arr) => arr.length;
sum = (arr) => arr.reduce((a, b) => a + b, 0);
product = (arr) => arr.reduce((total, num) => total * num, 1);
max = (arr) => Math.max(arr);
min = (arr) => Math.min(arr);
sort = (arr) => [...arr].sort();
all = (arr) => (arr.length === 0 ? true : arr.every((v) => v === true));
any = (arr) => (arr.length === 0 ? false : arr.includes(true));

module.exports = { count, sum, product, min, sort, all, any };
