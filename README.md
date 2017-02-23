angular-material-spotlight
==========================

Add a Spotlight Tour to your Angular Material projects.

<p align="center">
  <img src="demo/demo.gif?raw=true" alt="Angular Material Spotlight Demo"/>
</p>

## Requirements

* [AngularJS](https://angularjs.org/)
* [Angular Material](https://material.angularjs.org/)

## Getting Started

Install via Bower:

```bash
bower install angular-material-spotlight
```

Use in Angular:

```javascript
angular.module( 'YourApp', [ 'md.spotlight' ] )
  .controller("YourController", ['$scope, $mdSpotlight', function($scope, $mdSpotlight) {

    $scope.help = function($event, group) {
      return $mdSpotlight.show({
        targetEvent: $event,
        group: 'add-screen'
      });
    }

  }] );
```

In Angular templates:

```html

<md-toolbar class="md-whiteframe-z1">
  <div class="md-toolbar-tools">

    <md-button id="btn-filter" class="md-icon-button" aria-label="Filter" ng-click="openFilterDialog($event)"
      md-spotlight="add-screen"
      md-spotlight-index=1
      >
      <md-icon>filter_list</md-icon>
      <md-tooltip md-direction="top" md-visible="spotlightIndex == 1">Tooltip when index is 1</md-tooltip>
    </md-button>

    <md-button class="md-icon-button" aria-label="Back" ui-sref="new"
      md-spotlight="add-screen"
      md-spotlight-index=2
      >
      <md-icon>add</md-icon>
      <md-tooltip md-direction="top" md-visible="spotlightIndex == 2">Tooltip when index is 2</md-tooltip>
    </md-button>

    <md-button class="md-icon-button" aria-label="Done" ui-sref="review"
      md-spotlight="add-screen"
      md-spotlight-index=3
      >
      <md-icon>check</md-icon>
    </md-button>

    <span flex></span>

    <md-button class="md-icon-button" aria-label="Help" ng-click="help($event)">
      <md-icon>help</md-icon>
    </md-button>

  </div>
</md-toolbar>

```

## Building

```bash
# install dependencies
npm install
bower install

# run default gulp task to build and watch for changes
gulp
```
