'use strict';

const babelJest = require('babel-jest');
const path = require('path');
let nodeModulesPath = path.dirname(require.resolve('@babel/preset-env'))

module.exports = babelJest.createTransformer({
  presets: [ nodeModulesPath ],
  babelrc: false,
  configFile: false,
});