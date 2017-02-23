angular-material-spotlight
==========================

Add a Spotlight Tour to your Angular Material projects.

<p align="center">
  <img src="demo/demo.gif?raw=true" alt="Angular Material Spotlight Demo"/>
</p>

*NOTE: Spotlight is not a legitimate part of the [Material Design Spec](https://material.io/guidelines/), however this component is built on top of [Angular Material](https://material.angularjs.org/), and I feel integrates into the concept of Material Design very well.  If you found it, then good for you!*

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
  .controller('YourController', ['$scope, $mdSpotlight', function($scope, $mdSpotlight) {

    this.tour = function(group, $event) {
      return $mdSpotlight.show({
        targetEvent: $event,
        group: group || 'top-icons'
      });
    };

  }] );
```

In Angular templates:

```html

<md-content class="flex layout-column layout-align-space-around-center" ng-controller="YourController as $ctrl">

  <div class="layout-row layout-align-space-around-center" style="width: 100%;">

    <md-icon md-spotlight="tour-b" md-spotlight-index="3">feedback</md-icon>

    <md-icon md-spotlight="tour-a" md-spotlight-index="2">grade</md-icon>

    <md-icon md-spotlight="tour-b" md-spotlight-index="1">
      favorite
      <md-spotlight-tip>Mark your favorites here.</md-spotlight-tip>
    </md-icon>

    <md-icon md-spotlight="tour-a" md-spotlight-index="4">g_translate</md-icon>

  </div>

  <div style="text-align: center;">
    <md-button class="md-raised md-primary" ng-click="$ctrl.tour('tour-a', $event)">Spotlight Tour A</md-button>
    <md-button class="md-raised md-accent" ng-click="$ctrl.tour('tour-b', $event)">Spotlight Tour B</md-button>
  </div>

  <div class="layout-row layout-align-space-around-center" style="width: 100%;">

    <md-icon md-spotlight="tour-b" md-spotlight-index="2">
      feedback
      <md-spotlight-tip>Give your feedback here.</md-spotlight-tip>
    </md-icon>

    <md-icon md-spotlight="tour-a" md-spotlight-index="5">grade</md-icon>

    <md-icon md-spotlight="tour-b" md-spotlight-index="4">
      delete
      <md-spotlight-tip>Delete stuff here.</md-spotlight-tip>
    </md-icon>

    <md-icon md-spotlight="tour-a" md-spotlight-index="3">g_translate</md-icon>

  </div>

</md-content>
```

## Building

```bash
# install dependencies
npm install
bower install

# run default gulp task to build and watch for changes
gulp
```
