'use strict';

const babelJest = require('babel-jest');
const path = require('path');
// const nodeModulesPath = path.resolve(__dirname, '../node_modules');

let nodeModulesPath = path.dirname(require.resolve('@babel/preset-env'))
// nodeModulesPath = nodeModulesPath.substr(0,nodeModulesPath.indexOf("node_modules")) + "node_modules/"
// const env = nodeModulesPath+'/@babel/preset-env';

module.exports = babelJest.createTransformer({
  presets: [ nodeModulesPath ],
  babelrc: false,
  configFile: false,
});