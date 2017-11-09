'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Point to fake test resources
var dataDir = _path2.default.resolve('' + __dirname, '../eaternity-edb-data-fake');
var productSchema = (0, _helpers.loadProductSchema)(dataDir);
var orderedKeys = Object.keys(productSchema.properties);

describe('helpers', function () {
  test('addFilename adds filename field to object', function () {
    var someObject = {
      id: 1,
      name: 'some object'
    };
    var expectedObjectWithFilename = {
      id: 1,
      name: 'some object',
      filename: 'some-object.json'
    };
    var objectWithFilename = (0, _helpers.addFilename)(someObject, 'some-object.json');
    expect(objectWithFilename).toEqual(expectedObjectWithFilename);
  });

  test('isValidProductFilename knows valid filenames', function () {
    var filenames = ['prod.json', '1234.json', '1-a-prod.json', '12-b-prod.json', '123-a-b-prod.json', '1234-a-b-c-prod.json'];
    var expectedValidFilanames = ['1-a-prod.json', '12-b-prod.json', '123-a-b-prod.json', '1234-a-b-c-prod.json'];
    var validFilenames = filenames.filter(function (filename) {
      return (0, _helpers.isValidProductFilename)(filename);
    });
    expect(validFilenames).toEqual(expectedValidFilanames);
  });

  test('loadProduct returns undefined when product filename is invalid', function () {
    var pathToProductWithInvalidName = dataDir + '/prods/10-wrong-filename.json';
    expect((0, _helpers.loadProduct)(pathToProductWithInvalidName)).toBeUndefined();
  });

  it('loadProduct loads product with correct filename', function () {
    var pathToFile = dataDir + '/prods/3-child-prod.json';
    var someProduct = _jsonfile2.default.readFileSync(pathToFile);
    var expectedProduct = (0, _helpers.addFilename)(someProduct, '3-child-prod.json');
    var product = (0, _helpers.loadProduct)(pathToFile);
    expect(product).toEqual(expectedProduct);
  });

  test('loadAllProducts loads all products with valid filename', function () {
    var allProducts = (0, _helpers.loadAllProducts)(dataDir);
    var invalidFilename = '10-wrong-filename.json';
    var productFilenames = _fs2.default.readdirSync(dataDir + '/prods');
    var correctProdFileNames = productFilenames.filter(function (filename) {
      return filename !== invalidFilename;
    });
    var randomCorrectProductFilename = _lodash2.default.sample(correctProdFileNames);
    var randomCorrectProduct = _jsonfile2.default.readFileSync(dataDir + '/prods/' + randomCorrectProductFilename);

    // loadAllProducts adds a filename field to each prouct during load
    randomCorrectProduct.filename = randomCorrectProductFilename;

    var prodsContainRandomCorrectProduct = allProducts.some(function (prod) {
      return _lodash2.default.isEqual(prod, randomCorrectProduct);
    });

    expect(allProducts.length).toEqual(13);
    expect(prodsContainRandomCorrectProduct).toBeTruthy();
  });

  test('loadFaos loads fao-product-list.json correctly', function () {
    var faos = (0, _helpers.loadFaos)(dataDir);
    var expectedFaos = [{
      'fao-code': 1,
      'fao-name': 'FAO 1',
      'definition': 'Definition 1'
    }, {
      'fao-code': 2,
      'fao-name': 'FAO 2',
      'definition': 'Definition 2'
    }];

    expect(faos).toEqual(expectedFaos);
  });

  test('loadNutrs only loads files with correct filename', function () {
    var nutrs = (0, _helpers.loadNutrs)(dataDir);
    var expectedNutrs = [{
      'name': 'Fake nutr',
      'id': '1'
    }];
    expect(nutrs).toEqual(expectedNutrs);
  });

  test('loadNutrChange only loads files with correct filename', function () {
    var nutrChange = (0, _helpers.loadNutrChange)(dataDir);
    var expectedNutrChange = [{
      'id': 1,
      'name': 'fake',
      'process': 'cooked'
    }];
    expect(nutrChange).toEqual(expectedNutrChange);
  });

  test('loadProductSchema loads product schema', function () {
    var expectedProductschema = _jsonfile2.default.readFileSync(dataDir + '/prod.schema.json');
    var productSchema = (0, _helpers.loadProductSchema)(dataDir);
    expect(productSchema).toEqual(expectedProductschema);
  });

  test('_removeHelperFields removes filename and validationSummary', function () {
    var productWithHelperFields = _jsonfile2.default.readFileSync(dataDir + '/prods/13-helpers-prod.json');
    var expectedProductWithoutHelpers = {
      'id': 13,
      'name': 'Helpers'
    };
    var productWithoutHelpers = (0, _helpers.removeHelperFields)(productWithHelperFields);
    expect(productWithoutHelpers).toEqual(expectedProductWithoutHelpers);
  });

  test('resetValidation removes validationSummary', function () {
    var productWithValidation = _jsonfile2.default.readFileSync(dataDir + '/prods/13-helpers-prod.json');
    var expectedProductWithoutValidation = {
      id: 13,
      name: 'Helpers',
      filename: '13-helpers-prod.json'
    };
    var productWithoutValidation = (0, _helpers.resetValidation)(productWithValidation);
    expect(productWithoutValidation).toEqual(expectedProductWithoutValidation);
  });

  it('_saveProduct removes helper fields and saves product', function () {
    var filename = '100000-save-me-prod.json';
    var pathToFile = dataDir + '/prods/' + filename;
    var productToSave = {
      id: 100000,
      name: 'save me',
      filename: filename,
      validationSummary: {}
    };

    (0, _helpers._saveProduct)(_helpers.removeHelperFields, dataDir, productToSave);

    var prodFilenames = _fs2.default.readdirSync(dataDir + '/prods');
    expect(prodFilenames.includes(filename)).toBeTruthy();

    // clean up, maybe should be done in afterEach to account for async?
    _fs2.default.unlinkSync(pathToFile);
  });

  it('partially applied saveProduct works like _saveProduct', function () {
    var filename = '100000-save-me-prod.json';
    var pathToFile = dataDir + '/prods/' + filename;
    var productToSave = {
      id: 100000,
      name: 'save me',
      filename: filename,
      validationSummary: {}
    };

    (0, _helpers.saveProduct)(dataDir, productToSave);

    var prodFilenames = _fs2.default.readdirSync(dataDir + '/prods');
    expect(prodFilenames.includes(filename)).toBeTruthy();

    // clean up, maybe should be done in afterEach to account for async?
    _fs2.default.unlinkSync(pathToFile);
  });

  it('saveAllProducts saves all prods to prods.all.json', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var filename = 'prods.all.json';
    var sampleProduct = _lodash2.default.sample(prods);

    var randomProduct = function randomProduct(element) {
      return _lodash2.default.isEqual(element, sampleProduct);
    };

    (0, _helpers.saveAllProducts)(dataDir, prods);

    var productsReloaded = _jsonfile2.default.readFileSync(dataDir + '/' + filename);
    var filenames = _fs2.default.readdirSync(dataDir);

    expect(productsReloaded).toHaveLength(13);
    expect(productsReloaded.find(randomProduct)).toEqual(sampleProduct);
    expect(filenames.includes(filename)).toBeTruthy();

    // clean up, maybe should be done in afterEach to account for async?
    _fs2.default.unlinkSync(dataDir + '/' + filename);
  });

  it('saveAllProductsToCsv saves prods to prods.all.csv', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var filename = 'EDB_Products-Export.csv';
    var fields = [].concat(_toConsumableArray(orderedKeys));

    // calling saveAllProductsToCsv saves the file and returns the csv data
    var result = (0, _helpers.saveAllProductsToCsv)(fields, dataDir, prods);

    var filenames = _fs2.default.readdirSync(dataDir);
    var csvReloaded = _fs2.default.readFileSync(dataDir + '/' + filename, {
      encoding: 'utf8'
    });

    expect(result).toMatchSnapshot();
    expect(filenames.includes(filename)).toBeTruthy();
    expect(csvReloaded).toEqual(result);

    // clean up, maybe should be done in afterEach to account for async?
    _fs2.default.unlinkSync(dataDir + '/' + filename);
  });
});
//# sourceMappingURL=helpers.test.js.map