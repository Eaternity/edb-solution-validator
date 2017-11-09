'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _ramda = require('ramda');

var _helpers = require('./helpers/helpers');

var _validator = require('./validator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Point to fake test resources and load some standard resources
var dataDir = _path2.default.resolve('' + __dirname, './eaternity-edb-data-fake');
var prods = (0, _helpers.loadAllProducts)(dataDir);
var nutrs = (0, _helpers.loadNutrs)(dataDir);
var nutrChange = (0, _helpers.loadNutrChange)(dataDir);
var productSchema = (0, _helpers.loadProductSchema)(dataDir);
var orderedKeys = Object.keys(productSchema.properties);

describe('validator', function () {
  test('_orderProcesses correctly orders processes array', function () {
    var unorderedProduct = _jsonfile2.default.readFileSync(dataDir + '/prods/11-unordered-prod.json');
    var orderedProduct = _jsonfile2.default.readFileSync(dataDir + '/prods/12-ordered-prod.json');
    var unorderedProcesses = unorderedProduct.processes;
    var expectedOrderedProcesses = orderedProduct.processes;
    var orderedProcesses = (0, _validator.orderProcesses)(unorderedProcesses);
    expect(orderedProcesses).toEqual(expectedOrderedProcesses);
  });

  it('orderProduct orders a product according to a list of keys', function () {
    var unorderedProduct = _jsonfile2.default.readFileSync(dataDir + '/prods/11-unordered-prod.json');
    var expectedOrderedProduct = _jsonfile2.default.readFileSync(dataDir + '/prods/12-ordered-prod.json');
    var orderedProduct = (0, _validator.orderProduct)(orderedKeys)(unorderedProduct);
    expect((0, _helpers.removeHelperFields)(orderedProduct)).toEqual((0, _helpers.removeHelperFields)(expectedOrderedProduct));
  });

  test('removeEmptyArrays removes all fields holding []', function () {
    var productWithEmptyArrays = {
      id: 1234,
      name: 'test',
      synonyms: [],
      'co2-value': 42,
      processes: []
    };

    var validateProduct = (0, _ramda.pipe)((0, _validator.removeEmptyArrays)(orderedKeys),
    // this is just to remove the empty fields
    (0, _validator.orderProduct)(orderedKeys));

    var result = validateProduct(productWithEmptyArrays);
    expect(result).toMatchSnapshot();
    expect(Object.keys(result).length).toBe(Object.keys(productWithEmptyArrays).length - 2);
  });

  test('removeEmptyObjectsFromArrays removes [{}]', function () {
    var productWithArrayWithEmptyObject = {
      id: 15,
      processes: [{ key: 'value' }, {}]
    };

    var result = (0, _validator.removeEmptyObjectsFromArrays)(orderedKeys)(productWithArrayWithEmptyObject);
    expect(result).toMatchSnapshot();
  });

  test('addValidationSummary adds validationSummary to product', function () {
    // define a validationResult
    var expectedValidationSummary = {
      isValid: false,
      parentProduct: '',
      brokenLinks: [],
      missingFields: [],
      missingMandatoryFields: [],
      validationErrors: []
    };

    var someProduct = {
      id: 1,
      name: 'Some product'
    };

    var productWithValidationSummary = (0, _validator.addValidationSummary)(someProduct);
    var validationSummary = productWithValidationSummary.validationSummary;


    expect(productWithValidationSummary.id).toEqual(1);
    expect(productWithValidationSummary.name).toEqual('Some product');
    expect(validationSummary).toEqual(expectedValidationSummary);
  });

  test('addValidationSummary does not overwrite existing summary', function () {
    // define a validationResult
    var existingValidationSummary = {
      isValid: false,
      parentProduct: '2-parent-prod.json',
      brokenLinks: ['nutr-change-id'],
      missingFields: ['perishability'],
      validationErrors: []
    };
    var productWithValidationSummary = {
      id: 1,
      name: 'Some product',
      validationSummary: existingValidationSummary
    };
    var validatedProduct = (0, _validator.addValidationSummary)(productWithValidationSummary);
    var validationSummary = validatedProduct.validationSummary;

    expect(validationSummary).toEqual(existingValidationSummary);
  });

  test('schemaValidate catches schema errors and adds them to summary', function () {
    var expectedValidationErrors = ['instance.synonyms[0] is not of a type(s) string', 'instance.tags is not of a type(s) string', 'instance.co2-value is not of a type(s) number'];
    var productWithWrongTypes = _jsonfile2.default.readFileSync(dataDir + '/prods/9-wrong-types-prod.json');
    var validatedProductWithWrongTypes = (0, _validator.schemaValidate)(productSchema, productWithWrongTypes);
    var validationErrors = validatedProductWithWrongTypes.validationSummary.validationErrors;

    expect(validationErrors).toEqual(expectedValidationErrors);
  });

  it('addParentProduct adds name of parent product to summary', function () {
    var expectedParentProduct = '2-parent-prod.json';
    var pathToChild = dataDir + '/prods/3-child-prod.json';
    var child = _jsonfile2.default.readFileSync(pathToChild);
    var productWithParent = (0, _validator.addParentProduct)(prods, child);
    var parentProduct = productWithParent.validationSummary.parentProduct;

    expect(parentProduct).toEqual(expectedParentProduct);
  });

  it('addParentProduct adds name of parent product to summary', function () {
    var expectedParentProduct = '2-parent-prod.json';
    var pathToChild = dataDir + '/prods/3-child-prod.json';
    var child = (0, _helpers.loadProduct)(pathToChild);
    var productWithParent = (0, _validator.addParentProduct)(prods, child);
    var parentProduct = productWithParent.validationSummary.parentProduct;

    expect(parentProduct).toEqual(expectedParentProduct);
  });

  it('addParentProduct adds empty string as parent when not linked', function () {
    var expectedParentProduct = '';
    var pathToGrandParent = dataDir + '/prods/1-grand-parent-prod.json';
    var grandParent = (0, _helpers.loadProduct)(pathToGrandParent);
    var validatedGrandParent = (0, _validator.addParentProduct)(prods, grandParent);
    var parentProduct = validatedGrandParent.validationSummary.parentProduct;

    expect(parentProduct).toEqual(expectedParentProduct);
  });

  it('addParentProduct adds empty string as parent when link broken', function () {
    var expectedParentProduct = '';
    var pathToLonelychild = dataDir + '/prods/4-lonely-child-prod.json';
    var lonelyChild = (0, _helpers.loadProduct)(pathToLonelychild);
    var validatedLonelyChild = (0, _validator.addParentProduct)(prods, lonelyChild);
    var parentProduct = validatedLonelyChild.validationSummary.parentProduct;

    expect(parentProduct).toEqual(expectedParentProduct);
  });

  test('addMissingLinkedFieldsToValidationSummary adds all missing fields', function () {
    var expectedMissingFields = _validator.ALL_FIELDS_FROM_LINKED_PRODUCT;
    var pathToGrandParent = dataDir + '/prods/3-child-prod.json';
    var grandParent = (0, _helpers.loadProduct)(pathToGrandParent);
    var validatedGrandParent = (0, _validator.fillValidationSummary)(grandParent);
    var missingFields = validatedGrandParent.validationSummary.missingFields;

    expect(missingFields).toEqual(expectedMissingFields);
  });

  test('addMissingLinkedFieldsToValidationSummary adds nothing when no missing fields', function () {
    var expectedMissingFields = [];
    var pathToFullProduct = dataDir + '/prods/14-full-prod.json';
    var fullProduct = (0, _helpers.loadProduct)(pathToFullProduct);
    var validatedFullProduct = (0, _validator.fillValidationSummary)(fullProduct);
    var missingFields = validatedFullProduct.validationSummary.missingFields;

    expect(missingFields).toEqual(expectedMissingFields);
  });

  test('validateNutritionId finds and adds broken nutrition-id links', function () {
    var expectedBrokenLinks = ['nutrition-id'];
    var productWithBrokenNutritionId = _jsonfile2.default.readFileSync(dataDir + '/prods/5-broken-nutrition-id-prod.json');
    var validatedProduct = (0, _validator.validateNutritionId)(nutrs, productWithBrokenNutritionId);

    var brokenLinks = validatedProduct.validationSummary.brokenLinks;

    expect(brokenLinks).toEqual(expectedBrokenLinks);
  });

  test('validateNutritionId adds nothing when nutrition-id missing', function () {
    var expectedBrokenLinks = [];
    var productWithNoNutritionId = _jsonfile2.default.readFileSync(dataDir + '/prods/3-child-prod.json');
    var validatedProduct = (0, _validator.validateNutritionId)(nutrs, productWithNoNutritionId);

    var brokenLinks = validatedProduct.validationSummary.brokenLinks;

    expect(brokenLinks).toEqual(expectedBrokenLinks);
  });

  test('validateNutrChangeId finds and adds broken nutr-change links', function () {
    var expectedBrokenLinks = ['nutr-change-id'];
    var productWithBrokenNutrChangeId = _jsonfile2.default.readFileSync(dataDir + '/prods/6-broken-nutr-change-id-prod.json');
    var validatedProduct = (0, _validator.validateNutrChangeId)(nutrChange, productWithBrokenNutrChangeId);

    var brokenLinks = validatedProduct.validationSummary.brokenLinks;

    expect(brokenLinks).toEqual(expectedBrokenLinks);
  });

  test('validateNutrChangeId adds nothing when nutr-change-id missing', function () {
    var expectedBrokenLinks = [];
    var productWithNoNutrChangeId = _jsonfile2.default.readFileSync(dataDir + '/prods/3-child-prod.json');
    var validatedProduct = (0, _validator.validateNutrChangeId)(nutrChange, productWithNoNutrChangeId);

    var brokenLinks = validatedProduct.validationSummary.brokenLinks;

    expect(brokenLinks).toEqual(expectedBrokenLinks);
  });

  it('classify sets isValid to true if product is valid', function () {
    var pathToFullProduct = dataDir + '/prods/14-full-prod.json';
    var fullProduct = (0, _helpers.loadProduct)(pathToFullProduct);
    var validateProduct = (0, _ramda.pipe)((0, _validator.orderProduct)(orderedKeys), (0, _validator.schemaValidate)(productSchema), (0, _validator.addParentProduct)(prods), _validator.fillValidationSummary, (0, _validator.validateNutritionId)(nutrs), (0, _validator.validateNutrChangeId)(nutrChange), _validator.classify);
    var validatedProduct = validateProduct(fullProduct);
    expect(validatedProduct.validationSummary.isValid).toBeTruthy();
  });

  it('classify throws Error when passed product without summary', function () {
    var pathToProduct = dataDir + '/prods/3-child-prod.json';
    var productWithoutSummary = (0, _helpers.loadProduct)(pathToProduct);
    var classifyProd = function classifyProd() {
      return (0, _validator.classify)(productWithoutSummary);
    };
    expect(classifyProd).toThrow('Cannot classify product without validationSummary');
  });

  it('pipe yourself a validator', function () {
    var pathToFullProduct = dataDir + '/prods/14-full-prod.json';
    var fullProduct = (0, _helpers.loadProduct)(pathToFullProduct);

    var validatorPipeline = (0, _ramda.pipe)((0, _validator.schemaValidate)(productSchema), (0, _validator.addParentProduct)(prods), _validator.fillValidationSummary, (0, _validator.validateNutritionId)(nutrs), (0, _validator.validateNutrChangeId)(nutrChange), _validator.classify);

    var expectedValidationSummary = {
      isValid: true,
      parentProduct: '',
      brokenLinks: [],
      missingFields: [],
      missingMandatoryFields: [],
      validationErrors: []
    };

    var validatedProduct = validatorPipeline(fullProduct);
    var validationSummary = validatedProduct.validationSummary;

    expect(validationSummary).toEqual(expectedValidationSummary);
  });

  it('getFieldFromParent gets field from parent', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var field = 'co2-value';
    var pathToParent = dataDir + '/prods/2-parent-prod.json';
    var parent = (0, _helpers.loadProduct)(pathToParent);
    var expectedReturnValue = { 'co2-value': 1 };
    var getField = (0, _validator.getFieldFromParent)(prods);
    var returnValue = getField(parent, field);
    expect(returnValue).toEqual(expectedReturnValue);
  });

  it('getFieldFromParent recursively gets field from grand parent', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var field = 'nutrition-id';
    var pathToParent = dataDir + '/prods/2-parent-prod.json';
    var parent = (0, _helpers.loadProduct)(pathToParent);
    var expectedReturnValue = { 'nutrition-id': '1' };
    var getField = (0, _validator.getFieldFromParent)(prods);
    var returnValue = getField(parent, field);
    expect(returnValue).toEqual(expectedReturnValue);
  });

  it('pullFieldsFromParent pulls all missing fields from parent', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var pathToParent = dataDir + '/prods/2-parent-prod.json';
    var parent = (0, _helpers.loadProduct)(pathToParent);
    var validateParent = (0, _ramda.pipe)((0, _validator.addParentProduct)(prods), _validator.fillValidationSummary);
    var validatedParent = validateParent(parent);
    var expectedReturnValue = {
      'nutrition-id': '1',
      'season-begin': 'from grandparent',
      'season-end': 'from grandparent'
    };
    var returnValue = (0, _validator.pullFieldsFromParent)(prods, validatedParent);
    expect(returnValue).toEqual(expectedReturnValue);
  });

  it('pullFieldsFromParent pulls fields from parent and grandparent', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var pathToChild = dataDir + '/prods/3-child-prod.json';
    var child = (0, _helpers.loadProduct)(pathToChild);
    var validateChild = (0, _ramda.pipe)((0, _validator.addParentProduct)(prods), _validator.fillValidationSummary);
    var validatedChild = validateChild(child);
    var expectedReturnValue = {
      'nutrition-id': '1',
      tags: 'from, parent',
      perishability: 'from parent',
      'co2-value': 1,
      'season-begin': 'from grandparent',
      'season-end': 'from grandparent',
      processes: [{ 'nutr-change-id': 1, process: 'from parent' }],
      contains: [{
        substance: 'from parent',
        percentage: 4
      }]
    };
    var returnValue = (0, _validator.pullFieldsFromParent)(prods, validatedChild);
    expect(returnValue).toEqual(expectedReturnValue);
  });

  it('pullAndAddFieldsFromParent pulls and adds fields from summary', function () {
    var prods = (0, _helpers.loadAllProducts)(dataDir);
    var pathToChild = dataDir + '/prods/3-child-prod.json';
    var child = (0, _helpers.loadProduct)(pathToChild);
    var enhanceChild = (0, _ramda.pipe)((0, _validator.addParentProduct)(prods), _validator.fillValidationSummary, (0, _validator.pullAndAddFieldsFromParent)(prods), _helpers.removeHelperFields);
    var expectedReturnValue = {
      id: 3,
      name: 'Child',
      'linked-id': '2',
      'nutrition-id': '1',
      tags: 'from, parent',
      perishability: 'from parent',
      'co2-value': 1,
      'season-begin': 'from grandparent',
      'season-end': 'from grandparent',
      processes: [{ process: 'from parent', 'nutr-change-id': 1 }],
      contains: [{
        substance: 'from parent',
        percentage: 4
      }]
    };
    var returnValue = enhanceChild(child);
    expect(returnValue).toEqual(expectedReturnValue);
  });
});
//# sourceMappingURL=validator.test.js.map