import {pipe} from 'ramda'
import path from 'path'

import {loadAllProducts, loadProductSchema, saveAllProducts} from './validator/helpers/helpers'

import {orderProduct} from './validator/validator'

const dataDir = path.resolve(`${__dirname}`, '../../eaternity-edb-data')

const products = loadAllProducts(dataDir)

const productSchema = loadProductSchema(dataDir)
const orderedKeys = Object.keys(productSchema.properties)
const enhancedKeys = [...orderedKeys, 'filename', 'validationSummary']

// just use whatever functions from the validator here...
// Put in debugger statements in the relevant functions of the validator where
// you need them!
const validateProduct = pipe(orderProduct(enhancedKeys))

// run for all props
// products.forEach(product => validateProduct(product))

// run for a single product
const product = products[10]
// console.log(product)
validateProduct(product)

saveAllProducts(dataDir, products)
