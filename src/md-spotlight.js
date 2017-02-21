'use strict';

const MdSpotlightDirective = require('./md-spotlight-directive');
const MdSpotlightProvider = require('./md-spotlight-provider');

/**
 * @ngdoc module
 * @name material.spotlight
 */
angular
  .module('md.spotlight', [
    'material.core',
    'material.components.backdrop'
  ])
  .directive('mdSpotlight', MdSpotlightDirective)
  .provider('$mdSpotlight', MdSpotlightProvider);
