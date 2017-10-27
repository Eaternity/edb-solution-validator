'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveAllProductsToCsv = exports.saveAllProducts = exports.saveProduct = exports._saveProduct = exports.resetValidation = exports.removeHelperFields = exports.loadProductSchema = exports.loadNutrChange = exports.loadNutrs = exports.loadFaos = exports.loadAllProducts = exports.loadProduct = exports.isValidProductFilename = exports.addFilename = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _ramda = require('ramda');

var _json2csv = require('json2csv');

var _json2csv2 = _interopRequireDefault(_json2csv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// set indentation for jsonfile
_jsonfile2.default.spaces = 2;

var addFilename = exports.addFilename = function addFilename(product, filename) {
  if (product) {
    return Object.assign({}, product, { filename: filename });
  }
};

var isValidProductFilename = exports.isValidProductFilename = function isValidProductFilename(filename) {
  // http://regexr.com/ is awesome!
  var filenameRegEx = /^\d.+(prod\.json)/g;
  return filenameRegEx.test(filename);
};

var _loadProduct = function _loadProduct(addFilename, pathToProduct) {
  var filename = pathToProduct.split('/').pop();
  if (isValidProductFilename(filename)) {
    var product = _jsonfile2.default.readFileSync(pathToProduct);
    return addFilename(product, filename);
  }
};

var curriedLoadProduct = (0, _ramda.curry)(_loadProduct);
var loadProduct = exports.loadProduct = curriedLoadProduct(addFilename);

var _loadAllProducts = function _loadAllProducts(isValidProductFilename, dataDir) {
  var filenames = _fs2.default.readdirSync(dataDir + '/prods');
  var prods = filenames.filter(function (filename) {
    return isValidProductFilename(filename);
  }).map(function (filename) {
    var pathToProduct = dataDir + '/prods/' + filename;
    var product = loadProduct(pathToProduct);
    return product;
  });

  return prods;
};

var curriedLoadAllProducts = (0, _ramda.curry)(_loadAllProducts);
var loadAllProducts = exports.loadAllProducts = curriedLoadAllProducts(isValidProductFilename);

var loadFaos = exports.loadFaos = function loadFaos(dataDir) {
  var faos = _jsonfile2.default.readFileSync(dataDir + '/fao-product-list.json');
  return faos;
};

var loadNutrs = exports.loadNutrs = function loadNutrs(dataDir) {
  var filenames = _fs2.default.readdirSync(dataDir + '/nutrs');
  var nutrs = filenames.filter(function (filename) {
    var filenameRegEx = /^.+(nutr\.json)/g;
    return filenameRegEx.test(filename);
  }).map(function (filename) {
    return _jsonfile2.default.readFileSync(dataDir + '/nutrs/' + filename);
  });

  return nutrs;
};

var loadNutrChange = exports.loadNutrChange = function loadNutrChange(dataDir) {
  var filenames = _fs2.default.readdirSync(dataDir + '/nutr-change');
  var nutrChange = filenames.filter(function (filename) {
    var filenameRegEx = /^.+(nutr-change\.json)/g;
    return filenameRegEx.test(filename);
  }).map(function (filename) {
    return _jsonfile2.default.readFileSync(dataDir + '/nutr-change/' + filename);
  });

  return nutrChange;
};

var loadProductSchema = exports.loadProductSchema = function loadProductSchema(dataDir) {
  return _jsonfile2.default.readFileSync(dataDir + '/prod.schema.json');
};

var removeHelperFields = exports.removeHelperFields = function removeHelperFields(product) {
  var cleanCopy = _extends({}, product);
  delete cleanCopy.filename;
  delete cleanCopy.validationSummary;
  return cleanCopy;
};

var resetValidation = exports.resetValidation = function resetValidation(product) {
  var cleanCopy = _extends({}, product);
  delete cleanCopy.validationSummary;
  return cleanCopy;
};

var _saveProduct = exports._saveProduct = function _saveProduct(removeHelperFields, dataDir, product) {
  var filename = product.filename;

  var cleanProduct = removeHelperFields(product);
  _jsonfile2.default.writeFileSync(dataDir + '/prods/' + filename, cleanProduct);
};

// Hey future me: what's the (dis)advantage of doing this vs. just using
// _removeHelperFields from the enclosiong scope? It's not a pure function
// anyway because it saves a file which is an obvious side effect...
var curriedSaveProduct = (0, _ramda.curry)(_saveProduct);
var saveProduct = exports.saveProduct = curriedSaveProduct(removeHelperFields);

var saveAllProducts = exports.saveAllProducts = function saveAllProducts(dataDir, prods) {
  _jsonfile2.default.writeFileSync(dataDir + '/prods.all.json', prods);
};

var _saveAllProductsToCsv = function _saveAllProductsToCsv(fields, dataDir, prods) {
  var filename = 'EDB_Products-Export.csv';
  var result = (0, _json2csv2.default)({ data: prods, fields: fields });
  _fs2.default.writeFileSync(dataDir + '/' + filename, result);
  return result;
};

var saveAllProductsToCsv = exports.saveAllProductsToCsv = (0, _ramda.curry)(_saveAllProductsToCsv);
//# sourceMappingURL=helpers.js.map