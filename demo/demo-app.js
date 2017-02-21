'use strict';

angular.module('spotlightDemo', [
  'ngAnimate',
  'ngAria',
  'ngMaterial',
  'md.spotlight',
  'ui.router'
])
.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/welcome');

  $stateProvider
    .state('welcome', {
      url: '/welcome',
      templateUrl: 'templates/welcome.html',
      controller: 'WelcomeCtrl',
      controllerAs: '$ctrl'
    });

})
.controller('WelcomeCtrl', function($mdSpotlight) {

  this.tour = function(group, $event) {
    return $mdSpotlight.show({
      targetEvent: $event,
      group: group || 'top-icons'
    });
  };

});
