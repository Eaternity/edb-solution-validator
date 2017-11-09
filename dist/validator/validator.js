'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pullAndAddFieldsFromParent = exports.pullFieldsFromParent = exports.getFieldFromParent = exports.classify = exports.validateNutrChangeId = exports.validateNutritionId = exports.fillValidationSummary = exports.addParentProduct = exports.schemaValidate = exports.addValidationSummary = exports.removeEmptyObjectsFromArrays = exports.removeEmptyArrays = exports.orderProduct = exports.orderContains = exports.orderProcesses = exports.ALL_FIELDS_FROM_LINKED_PRODUCT = exports.MANDATORY_FIELDS = exports.OPTIONAL_FIELDS_FROM_LINKED_PRODUCT = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _jsonschema = require('jsonschema');

var _jsonschema2 = _interopRequireDefault(_jsonschema);

var _ramda = require('ramda');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // let's' try to write the complete validator in functional style


// Definition of product fields.

/*
These fields are mandatory and NOT allowed to pull from the linked product.
 */
var UNIQUE_FIELDS = ['id', 'name'];

/*
These fields are mandatory, but are allowed to pull from the linked product.
 */
var MANDATORY_FIELDS_FROM_LINKED_PRODUCT = ['nutrition-id', 'tags', 'perishability', 'co2-value'];

/*
 These fields are optional, but are allowed to pull from the linked product.
  */
var OPTIONAL_FIELDS_FROM_LINKED_PRODUCT = exports.OPTIONAL_FIELDS_FROM_LINKED_PRODUCT = ['fao-product-id', 'water-scarcity-footprint-id', 'waste-id', 'season-begin', 'season-end', 'processes', 'allergenes', 'unit-weight', 'density', 'contains', 'production-names', 'production-values', 'conservation-names', 'conservation-values', 'processing-names', 'processing-values', 'packaging-names', 'packaging-values'];

/*
Every product which can be exported shall contain this fields
 */
var MANDATORY_FIELDS = exports.MANDATORY_FIELDS = [].concat(UNIQUE_FIELDS, MANDATORY_FIELDS_FROM_LINKED_PRODUCT);

/*
All these fields are pulled from the linked product.
 */
var ALL_FIELDS_FROM_LINKED_PRODUCT = exports.ALL_FIELDS_FROM_LINKED_PRODUCT = [].concat(MANDATORY_FIELDS_FROM_LINKED_PRODUCT, OPTIONAL_FIELDS_FROM_LINKED_PRODUCT);

var orderProcesses = exports.orderProcesses = function orderProcesses(processes) {
  var keys = ['process', 'nutr-change-id'];
  var orderedProcesses = processes.filter(function (process) {
    return process;
  }).map(function (process) {
    var orderedProcess = keys.map(function (key) {
      return _defineProperty({}, key, process[key]);
    });

    return Object.assign.apply(Object, [{}].concat(_toConsumableArray(orderedProcess)));
  });

  return orderedProcesses;
};

// TODO this is code duplication with above - how to handle that?
var orderContains = exports.orderContains = function orderContains(contains) {
  var keys = ['substance', 'percentage'];
  var orderedSubstances = contains.filter(function (substance) {
    return substance;
  }).map(function (substance) {
    var orderedSubstance = keys.map(function (key) {
      return _defineProperty({}, key, substance[key]);
    });

    return Object.assign.apply(Object, [{}].concat(_toConsumableArray(orderedSubstance)));
  });

  return orderedSubstances;
};

var _orderProduct = function _orderProduct(orderProcesses, orderContains, orderedKeys, product) {
  var orderedPairs = orderedKeys.filter(function (key) {
    return product[key] !== undefined;
  }).map(function (key) {
    if (key === 'processes') {
      return _defineProperty({}, key, orderProcesses(product[key]));
    } else if (key === 'contains') {
      return _defineProperty({}, key, orderContains(product[key]));
    } else {
      return _defineProperty({}, key, product[key]);
    }
  });

  var orderedProduct = Object.assign.apply(Object, [{}].concat(_toConsumableArray(orderedPairs)));
  return orderedProduct;
};

var curriedOrderProduct = (0, _ramda.curry)(_orderProduct);
var orderProduct = exports.orderProduct = curriedOrderProduct(orderProcesses, orderContains);

var _removeEmptyArrays = function _removeEmptyArrays(orderedKeys, product) {
  return orderedKeys.filter(function (key) {
    return !(Array.isArray(product[key]) && product[key].length === 0);
  }).map(function (key) {
    return _defineProperty({}, key, product[key]);
  }).reduce(function (obj, newField) {
    return Object.assign(obj, newField);
  }, {});
};

var removeEmptyArrays = exports.removeEmptyArrays = (0, _ramda.curry)(_removeEmptyArrays);

var _removeEmptyObjectsFromArrays = function _removeEmptyObjectsFromArrays(orderedKeys, product) {
  return orderedKeys
  // I really think we should also remove empty strings...
  // .filter(key => product[key] !== '')
  // and empty objects
  // .filter(key => !(Object.keys(product[key]).length === 0 &&
  //    product[key].constructor === Object)
  // remove empty objects from arrays
  .map(function (key) {
    return Array.isArray(product[key]) ? _defineProperty({}, key, product[key].filter(function (element) {
      return (
        // remove emty objects from array
        !(Object.keys(element).length === 0 && element.constructor === Object)
      );
    })) : _defineProperty({}, key, product[key]);
  }).filter(function (field) {
    return field[Object.keys(field)] !== undefined;
  }).reduce(function (obj, newField) {
    return Object.assign(obj, newField);
  }, {});
};

var removeEmptyObjectsFromArrays = exports.removeEmptyObjectsFromArrays = (0, _ramda.curry)(_removeEmptyObjectsFromArrays);

var addValidationSummary = exports.addValidationSummary = function addValidationSummary(product) {
  // define a default validationSummary
  var validationSummary = {
    isValid: false,
    parentProduct: '',
    brokenLinks: [],
    missingFields: [],
    missingMandatoryFields: [],
    validationErrors: []
  };
  var hasValidationSummary = product.hasOwnProperty('validationSummary') && Object.keys(product.validationSummary).every(function (key) {
    return Object.keys(validationSummary).includes(key);
  });

  if (!hasValidationSummary) {
    product = _extends({}, product, { validationSummary: validationSummary });
  }

  return product;
};

var _schemaValidate = function _schemaValidate(jsonschema, addValidationSummary, schema, product) {
  product = addValidationSummary(product);
  var _product = product,
      validationSummary = _product.validationSummary;


  var validationErrors = jsonschema.validate(product, schema).errors.map(function (error) {
    return error.stack;
  });

  var hasValidationErrors = validationErrors.length > 0;

  if (hasValidationErrors) {
    validationSummary = _extends({}, validationSummary, { validationErrors: validationErrors });
  }

  return _extends({}, product, { validationSummary: validationSummary });
};

var curriedSchemaValidate = (0, _ramda.curry)(_schemaValidate);
var schemaValidate = exports.schemaValidate = curriedSchemaValidate(_jsonschema2.default, addValidationSummary);

var _addParentProduct = function _addParentProduct(addValidationSummary, prods, product) {
  product = addValidationSummary(product);
  var _product2 = product,
      validationSummary = _product2.validationSummary;


  var isLinked = product.hasOwnProperty('linked-id');

  if (isLinked) {
    var parentName = prods.map(function (product) {
      return product.filename;
    }).filter(function (filename) {
      return filename.split('-')[0] === product['linked-id'];
    });

    validationSummary = _extends({}, validationSummary, {
      parentProduct: parentName[0] || ''
    });
  }

  return _extends({}, product, { validationSummary: validationSummary });
};

var curriedAddParentProduct = (0, _ramda.curry)(_addParentProduct);
var addParentProduct = exports.addParentProduct = curriedAddParentProduct(addValidationSummary);

var _fillValidationSummary = function _fillValidationSummary(allFieldsFromLinkedProduct, MANDATORY_FIELDS, product) {
  product = addValidationSummary(product);
  var _product3 = product,
      validationSummary = _product3.validationSummary;


  var missingFields = allFieldsFromLinkedProduct.filter(function (field) {
    return !product.hasOwnProperty(field);
  });

  var missingMandatoryFields = missingFields.filter(function (field) {
    return MANDATORY_FIELDS.includes(field);
  });

  var fieldsMissing = missingFields.length > 0;
  var mandatoryFieldsMissing = missingMandatoryFields.length > 0;

  if (fieldsMissing) {
    validationSummary = _extends({}, validationSummary, { missingFields: missingFields });
  }

  if (mandatoryFieldsMissing) {
    validationSummary = _extends({}, validationSummary, { missingMandatoryFields: missingMandatoryFields });
  }

  return _extends({}, product, { validationSummary: validationSummary });
};

var curriedFillValidationSummary = (0, _ramda.curry)(_fillValidationSummary);
var fillValidationSummary = exports.fillValidationSummary = curriedFillValidationSummary(ALL_FIELDS_FROM_LINKED_PRODUCT, MANDATORY_FIELDS);

var _validateNutritionId = function _validateNutritionId(addValidationSummary, nutrs, product) {
  product = addValidationSummary(product);
  var _product4 = product,
      validationSummary = _product4.validationSummary;
  var _validationSummary = validationSummary,
      brokenLinks = _validationSummary.brokenLinks;


  var hasNutritionId = product.hasOwnProperty('nutrition-id');

  if (hasNutritionId) {
    var nutritionId = product['nutrition-id'];
    var linkedNutritionIdExists = nutrs.some(function (nutrObj) {
      return nutrObj.id === nutritionId;
    });

    if (!linkedNutritionIdExists) {
      validationSummary = _extends({}, validationSummary, {
        brokenLinks: [].concat(_toConsumableArray(brokenLinks), ['nutrition-id'])
      });
    }
  }

  return _extends({}, product, { validationSummary: validationSummary });
};

var curriedValidateNutritionId = (0, _ramda.curry)(_validateNutritionId);
var validateNutritionId = exports.validateNutritionId = curriedValidateNutritionId(addValidationSummary);

var _validateNutrChangeId = function _validateNutrChangeId(addValidationSummary, nutrChange, product) {
  product = addValidationSummary(product);
  var _product5 = product,
      validationSummary = _product5.validationSummary;
  var _validationSummary2 = validationSummary,
      brokenLinks = _validationSummary2.brokenLinks;


  var hasProcesses = product.hasOwnProperty('processes') && product.processes;

  var hasNutritionChangeId = hasProcesses ? product.processes.length > 0 && product.processes[0].hasOwnProperty('nutr-change-id') : false;

  if (hasNutritionChangeId) {
    var _product6 = product,
        processes = _product6.processes;

    var allNutritionChangeIds = processes.map(function (processesObj) {
      return processesObj['nutr-change-id'];
    });

    var linkedNutritionChangeIdsExist = allNutritionChangeIds.every(function (nutritionChangeId) {
      return nutrChange.some(function (nutrChangeObj) {
        return nutrChangeObj.id === nutritionChangeId;
      });
    });

    if (!linkedNutritionChangeIdsExist) {
      validationSummary = _extends({}, validationSummary, {
        brokenLinks: [].concat(_toConsumableArray(brokenLinks), ['nutr-change-id'])
      });
    }
  }

  return _extends({}, product, { validationSummary: validationSummary });
};

var curriedValidateNutritionChangeId = (0, _ramda.curry)(_validateNutrChangeId);
var validateNutrChangeId = exports.validateNutrChangeId = curriedValidateNutritionChangeId(addValidationSummary);

var classify = exports.classify = function classify(product) {
  var validationSummary = product.validationSummary;


  if (!validationSummary) {
    throw new Error('Cannot classify product without validationSummary');
  }

  var _validationSummary3 = validationSummary,
      brokenLinks = _validationSummary3.brokenLinks,
      missingMandatoryFields = _validationSummary3.missingMandatoryFields,
      validationErrors = _validationSummary3.validationErrors;

  var hasBrokenLinks = brokenLinks.length > 0;
  var hasMissingMandatoryFields = missingMandatoryFields.length > 0;
  var hasValidationErrors = validationErrors.length > 0;
  var isValid = !hasBrokenLinks && !hasMissingMandatoryFields && !hasValidationErrors;
  validationSummary = _extends({}, validationSummary, { isValid: isValid });
  return _extends({}, product, { validationSummary: validationSummary });
};

var _getFieldFromParent = function _getFieldFromParent(prods, parentProduct, field) {
  var validatedParentProduct = addParentProduct(prods, parentProduct);
  var validationSummary = validatedParentProduct.validationSummary;

  var pulledField = {};

  var fieldExistsInParent = parentProduct.hasOwnProperty(field);
  // parentProduct is '' (falsy) when no linked-id is given or no product with
  // the linked id exists
  var isLinked = validationSummary.parentProduct;

  if (fieldExistsInParent) {
    pulledField = _defineProperty({}, field, parentProduct[field]);
  } else if (isLinked) {
    var grandParent = prods.filter(function (product) {
      return product.filename === validationSummary.parentProduct;
    })[0];
    var validatedGrandParent = addParentProduct(prods, grandParent);
    return _getFieldFromParent(prods, validatedGrandParent, field);
  } else {
    pulledField = _defineProperty({}, field, 'NOT_RESOLVABLE');
  }

  return pulledField;
};

var getFieldFromParent = exports.getFieldFromParent = (0, _ramda.curry)(_getFieldFromParent);

var _pullFieldsFromParent = function _pullFieldsFromParent(getFieldFromParent, prods, validatedProduct) {
  var missingFields = validatedProduct.validationSummary.missingFields;


  var pulledFields = missingFields.map(function (field) {
    return getFieldFromParent(prods, validatedProduct, field);
  }).filter(function (field) {
    return field[Object.keys(field)] !== 'NOT_RESOLVABLE';
  }).reduce(function (prev, curr) {
    return _extends({}, prev, curr);
  }, {});

  return pulledFields;
};

var curriedPullFieldsFromParent = (0, _ramda.curry)(_pullFieldsFromParent);
var pullFieldsFromParent = exports.pullFieldsFromParent = curriedPullFieldsFromParent(getFieldFromParent);

var _pullAndAddFieldsFromParent = function _pullAndAddFieldsFromParent(pullFieldsFromParent, prods, product) {
  var pulledFields = pullFieldsFromParent(prods, product);
  return _extends({}, product, pulledFields);
};

var curriedPullAndAddFieldsFromParent = (0, _ramda.curry)(_pullAndAddFieldsFromParent);
var pullAndAddFieldsFromParent = exports.pullAndAddFieldsFromParent = curriedPullAndAddFieldsFromParent(pullFieldsFromParent);
//# sourceMappingURL=validator.js.map