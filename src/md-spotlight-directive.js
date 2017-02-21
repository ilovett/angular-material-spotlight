'use strict';

/**
 * @ngdoc directive
 * @name mdSpotlight
 * @module md.spotlight
 */
function MdSpotlightDirective($$rAF, $mdTheming, $mdSpotlight) {
  return {
    restrict: 'EA',
    link: function(scope, element) {
      // TODO logic pertinent to the `md-spotlight` dom element should eventually live here
    }
  };
}

module.exports = MdSpotlightDirective;
