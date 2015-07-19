/* jshint node: true */

var mergeTrees = require('broccoli-merge-trees');
var funnel = require('broccoli-funnel');
// TODO(azirbel): Deprecated, remove and use es6modules
var compileES6 = require('broccoli-es6-concatenator');
var es3Safe = require('broccoli-es3-safe-recast');
var templateCompiler = require('broccoli-ember-hbs-template-compiler');
var compileSass = require('broccoli-sass');

var wrap = require('./wrap');
var globals = require('./globals');

var addonTree = funnel('addon', {
  srcDir: '/',
  destDir: 'ember-table'
});

// Compile templates
var templateTree = templateCompiler('app/templates', {
  module: true
});
templateTree = funnel(templateTree, {
  srcDir: '/',
  destDir: 'ember-table/templates'
});

var sourceTree = mergeTrees([templateTree, addonTree], {
  overwrite: true
});

// Does a few things:
//   - Generate global exports, like Ember.Table.EmberTableComponent
//   - Register all templates on Ember.TEMPLATES
//   - Register views and components with the container so they can be looked up
// Output goes into globals-output.js
var globalExports = globals(funnel(sourceTree, {
  srcDir: '/ember-table',
  destDir: '/'
}));

// Require.js module loader
var loader = funnel('bower_components', {
  srcDir: '/loader.js',
  destDir: '/'
});

var jsTree = mergeTrees([sourceTree, globalExports, loader]);

// Transpile modules
var compiled = compileES6(jsTree, {
  wrapInEval: false,
  loaderFile: 'loader.js',
  inputFiles: ['ember-table/**/*.js'],
  ignoredModules: ['ember'],
  outputFile: '/ember-table.js',
  legacyFilesToAppend: ['globals-output.js']
});

// Wrap in a function which is executed
compiled = wrap(compiled);

// Compile scss
var scssTree = funnel('addon/styles', {
  srcDir: '/',
  destDir: '/'
});
var scssMain = 'addon.scss';
var scssOutputFile = 'ember-table.css';
var scssOutput = compileSass([scssTree], scssMain, scssOutputFile);

module.exports = mergeTrees([es3Safe(compiled), scssOutput]);
