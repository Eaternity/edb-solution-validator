'use strict';

var _ramda = require('ramda');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _helpers = require('./validator/helpers/helpers');

var _validator = require('./validator/validator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var dataDir = _path2.default.resolve('' + __dirname, '../eaternity-edb-data');

var products = (0, _helpers.loadAllProducts)(dataDir);

var productSchema = (0, _helpers.loadProductSchema)(dataDir);
var orderedKeys = Object.keys(productSchema.properties);
var enhancedKeys = [].concat(_toConsumableArray(orderedKeys), ['filename', 'validationSummary']);

// just use whatever functions from the validator here...
// Put in debugger statements in the relevant functions of the validator where
// you need them!
var validateProduct = (0, _ramda.pipe)((0, _validator.orderProduct)(enhancedKeys));

// run for all props
// products.forEach(product => validateProduct(product))

// run for a single product
var product = products[10];
product.name = 'hey';
validateProduct(product);

// saveProduct(dataDir, product)
//# sourceMappingURL=debug.js.map