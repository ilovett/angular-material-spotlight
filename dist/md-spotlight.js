(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$mdSpotlight = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

/**
 * @ngdoc directive
 * @name mdSpotlight
 * @module md.spotlight
 */

function MdSpotlightDirective($$rAF, $mdTheming, $mdSpotlight) {
  return {
    restrict: 'EA',
    link: function link(scope, element, attrs) {
      // TODO logic pertinent to the `md-spotlight` dom element should eventually live here
    }
  };
}

module.exports = MdSpotlightDirective;

},{}],2:[function(_dereq_,module,exports){
'use strict';

var PADDING = 5;

/**
 * @ngdoc service
 * @name $mdSpotlight
 * @module md.spotlight
 */
function MdSpotlightProvider($$interimElementProvider) {

  // Elements to capture and redirect focus when the user presses tab at the dialog boundary.
  var topFocusTrap, bottomFocusTrap;

  return $$interimElementProvider('$mdSpotlight').setDefaults({
    methods: ['disableParentScroll', 'escapeToClose', 'targetEvent', 'closeTo', 'openFrom', 'focusOnOpen', 'parent'],
    options: dialogDefaultOptions
  });

  /* @ngInject */
  function dialogDefaultOptions($mdSpotlight, $mdAria, $mdUtil, $mdConstant, $animate, $compile, $document, $window, $rootScope, $timeout, $rootElement, $log, $injector, $q) {

    return {
      isolateScope: true,
      onShow: onShow,
      onRemove: onRemove,
      escapeToClose: true,
      targetEvent: null,
      closeTo: null,
      openFrom: null,
      focusOnOpen: false,
      disableParentScroll: false,
      transformTemplate: function transformTemplate(template, options) {
        return '<div class="md-spotlight-spotlight md-whiteframe-z1"></div>';
      }
    };

    /**
     * Identify the bounding RECT for the target element
     *
     */
    function getBoundingClientRect(element, orig) {
      var source = angular.element(element || {});
      if (source && source.length) {
        // Compute and save the target element's bounding rect, so that if the
        // element is hidden when the dialog closes, we can shrink the dialog
        // back to the same position it expanded from.
        //
        // Checking if the source is a rect object or a DOM element
        var bounds = { top: 0, left: 0, height: 0, width: 0 };
        var hasFn = angular.isFunction(source[0].getBoundingClientRect);

        return angular.extend(orig || {}, {
          element: hasFn ? source : undefined,
          bounds: hasFn ? source[0].getBoundingClientRect() : angular.extend({}, bounds, source[0]),
          focus: angular.bind(source, source.focus)
        });
      }
    }

    /**
     * Capture originator/trigger/from/to element information (if available)
     * and the parent container for the dialog; defaults to the $rootElement
     * unless overridden in the options.parent
     */
    function captureParentAndFromToElements(options) {
      options.origin = angular.extend({
        element: null,
        bounds: null,
        focus: angular.noop
      }, options.origin || {});

      options.parent = getDomElement(options.parent, $rootElement);
      options.closeTo = getBoundingClientRect(getDomElement(options.closeTo));
      options.openFrom = getBoundingClientRect(getDomElement(options.openFrom));

      if (options.targetEvent) {
        options.origin = getBoundingClientRect(options.targetEvent.target, options.origin);
      }

      /**
       * If the specifier is a simple string selector, then query for
       * the DOM element.
       */
      function getDomElement(element, defaultElement) {
        if (angular.isString(element)) {
          var simpleSelector = element,
              container = $document[0].querySelectorAll(simpleSelector);
          element = container.length ? container[0] : null;
        }

        // If we have a reference to a raw dom element, always wrap it in jqLite
        return angular.element(element || defaultElement);
      }
    }

    /**
     * Show modal backdrop element...
     */
    function showBackdrop(scope, element, options) {

      if (options.disableParentScroll) {
        // !! DO this before creating the backdrop; since disableScrollAround()
        //    configures the scroll offset; which is used by mdBackDrop postLink()
        options.restoreScroll = $mdUtil.disableScrollAround(element, options.parent);
      }

      options.backdrop = $mdUtil.createBackdrop(scope, "md-spotlight-backdrop md-opaque");
      $animate.enter(options.backdrop, options.parent);

      /**
       * Hide modal backdrop element...
       */
      options.hideBackdrop = function hideBackdrop($destroy) {

        if (options.backdrop) {
          if (!!$destroy) {
            options.backdrop.remove();
          } else {
            $animate.leave(options.backdrop);
          }
        }

        if (options.disableParentScroll) {
          options.restoreScroll();
          delete options.restoreScroll;
        }

        options.hideBackdrop = null;
      };
    }

    /**
     * Prevents screen reader interaction behind modal window
     * on swipe interfaces
     */
    function lockScreenReader(element, options) {
      var isHidden = true;

      // get raw DOM node
      walkDOM(element[0]);

      options.unlockScreenReader = function () {
        isHidden = false;
        walkDOM(element[0]);

        options.unlockScreenReader = null;
      };

      /**
       * Walk DOM to apply or remove aria-hidden on sibling nodes
       * and parent sibling nodes
       *
       */
      function walkDOM(element) {
        while (element.parentNode) {
          if (element === document.body) {
            return;
          }
          var children = element.parentNode.children;
          for (var i = 0; i < children.length; i++) {
            // skip over child if it is an ascendant of the dialog
            // or a script or style tag
            if (element !== children[i] && !isNodeOneOf(children[i], ['SCRIPT', 'STYLE'])) {
              children[i].setAttribute('aria-hidden', isHidden);
            }
          }

          walkDOM(element = element.parentNode);
        }
      }
    }

    /**
     * Ensure the dialog container fill-stretches to the viewport
     */
    function stretchDialogContainerToViewport(container, options) {

      var isFixed = $window.getComputedStyle($document[0].body).position == 'fixed';
      var backdrop = options.backdrop ? $window.getComputedStyle(options.backdrop[0]) : null;
      var height = backdrop ? Math.min($document[0].body.clientHeight, Math.ceil(Math.abs(parseInt(backdrop.height, 10)))) : 0;

      container.css({
        top: (isFixed ? $mdUtil.scrollTop(options.parent) : 0) + 'px',
        height: height ? height + 'px' : '100%'
      });

      return container;
    }

    /**
     * Utility function to filter out raw DOM nodes
     */
    function isNodeOneOf(elem, nodeTypeArray) {
      if (nodeTypeArray.indexOf(elem.nodeName) !== -1) {
        return true;
      }
    }

    var currentTarget = void 0,
        nextTarget = void 0,
        spotlightEl = void 0,
        spotlightTipContainerEl = void 0,
        spotlightTipContainerParentEl = void 0,
        spotlightCurrentTipEl = void 0;

    /** Show method for dialogs */
    function onShow(scope, element, options, controller) {

      captureParentAndFromToElements(options);
      showBackdrop(scope, element, options);
      setupSpotlight(element, options);
      activateListeners(element, options);

      // TODO aria -- configureAria(element.find('md-dialog'), options);

      nextTarget = getSpotlightTarget(options.group, 'next');

      moveSpotlightToNextTarget(element, options);

      return animateFromOrigin(element, options).then(function () {
        // TODO locking screen reader
        // TODO focus on open
      });
    }

    function endSpotlight(options) {
      // hide the spotlight, this will trigger `onRemove`
      $mdUtil.nextTick($mdSpotlight.hide, true);
    }

    function setupSpotlight(element, options) {

      // tell the entire html body that spotlight is showing for css overrides
      angular.element($document[0].body).addClass('md-spotlight-is-showing');

      // save reference to the new spotlightElement
      spotlightEl = element;

      // add the spotlight to the DOM
      options.parent.append(spotlightEl);

      // We'll create a new scope to use as the context for the view.
      var $scope = $rootScope.$new();

      $scope.prev = function () {
        nextTarget = getSpotlightTarget(options.group, 'prev');
        moveSpotlightToNextTarget(spotlightEl, options);
      };

      $scope.skip = function () {
        endSpotlight(options);
      };

      $scope.next = function () {
        nextTarget = getSpotlightTarget(options.group, 'next');
        moveSpotlightToNextTarget(spotlightEl, options);
      };

      // create and add the tooltip container
      var html = '\n        <div class="md-spotlight-tip-container layout-column">\n          <div id="md-spotlight-tip-parent" class="flex"></div>\n          <div id="md-spotlight-tip-actions" class="layout-row layout-align-space-between-center" style="width: 100%; max-width: 600px; margin: 0 auto;">\n            <md-button ng-click="prev()">Prev</md-button>\n            <md-button ng-click="skip()">Skip</md-button>\n            <md-button ng-click="next()">Next</md-button>\n          </div>\n        </div>\n      ';

      spotlightTipContainerEl = $compile(html)($scope);

      // save references to important nodes
      spotlightTipContainerParentEl = angular.element(spotlightTipContainerEl.find('div')[0]);

      // TODO animate from origin
      $animate.enter(spotlightTipContainerEl, options.parent);
    }

    function getSpotlightTarget(group, direction) {

      var nextTarget = void 0;

      // get all group elements into an array
      var groupEls = document.querySelectorAll('[md-spotlight="' + group + '"]');
      var groupElsArray = $mdUtil.nodesToArray(groupEls);

      // sort lowest to highest `md-spotlight-index`
      groupElsArray.sort(function (a, b) {

        var astr = a.getAttribute('md-spotlight-index');
        var bstr = b.getAttribute('md-spotlight-index');
        var aint = parseInt(astr);
        var bint = parseInt(bstr);

        // if both are integers, compare the int values
        if (!isNaN(aint) && !isNaN(bint)) {
          return aint > bint;
        }
        // otherwise compare string
        else {
            return astr > bstr;
          }
      });

      if (!currentTarget) {
        nextTarget = angular.element(groupElsArray[0]);
      } else {

        var nextIndex = groupElsArray.indexOf(currentTarget[0]) + (direction === 'prev' ? -1 : 1);

        if (nextIndex >= groupElsArray.length || nextIndex < 0) {
          nextTarget = null;
        } else {
          nextTarget = angular.element(groupElsArray[nextIndex]);
        }
      }

      return nextTarget;
    }

    function moveSpotlightToNextTarget(spotlightEl, options) {

      // tell the current target that the spotlight aint no longer on'em
      currentTarget && currentTarget.removeClass('md-spotlight-shining');

      if (!nextTarget) {
        return endSpotlight(options);
      }

      // tell the next target the spotlight shining on'em
      nextTarget && nextTarget.addClass('md-spotlight-shining');

      // use css animations on and set the new boundaries for the spotlight
      var nextTargetBounds = getBoundingClientRect(nextTarget);
      spotlightEl.css({
        top: nextTargetBounds.bounds.top - PADDING + 'px',
        bottom: nextTargetBounds.bounds.bottom + PADDING + 'px',
        left: nextTargetBounds.bounds.left - PADDING + 'px',
        right: nextTargetBounds.bounds.right + PADDING + 'px',
        height: nextTargetBounds.bounds.height + PADDING + PADDING + 'px',
        width: nextTargetBounds.bounds.width + PADDING + PADDING + 'px'
      });

      currentTarget = nextTarget;

      showSpotlightTips(options);
    }

    function showSpotlightTips(options) {

      var backdrop = options.backdrop;
      var children = currentTarget.find('md-spotlight-tip');

      // take the last child tip found
      var childTip = angular.element(children[children.length - 1]);

      // TODO future improvements
      // sort by depth and take the first one
      // map to a specific id / template if provided

      spotlightCurrentTipEl && $animate.leave(spotlightCurrentTipEl);

      // if we have a tip to show relevant to the showing tip, show it
      if (childTip.length) {
        spotlightCurrentTipEl = childTip.clone();
        $animate.enter(spotlightCurrentTipEl, spotlightTipContainerParentEl);
      } else {
        spotlightCurrentTipEl = null;
      }
    }

    function animateFromOrigin(spotlightEl, options) {

      var animator = $mdUtil.dom.animator;
      var buildTranslateToOrigin = animator.calculateZoomToOrigin;
      var translateOptions = { transitionInClass: 'md-transition-in', transitionOutClass: 'md-transition-out' };

      var from = animator.toTransformCss(buildTranslateToOrigin(spotlightEl, options.openFrom || options.origin));
      var to = animator.toTransformCss(""); // defaults to center display (or parent or $rootElement)

      // TODO save animation promise to cancel?

      return animator.translate3d(spotlightEl, from, to, translateOptions).then(function (animateReversal) {

        // Build a reversal translate function synched to this translation...
        options.reverseAnimate = function () {

          // TODO fix closing to 0,0

          delete options.reverseAnimate;

          if (options.closeTo) {
            // Using the opposite classes to create a close animation to the closeTo element
            translateOptions = { transitionInClass: 'md-transition-out', transitionOutClass: 'md-transition-in' };
            from = to;
            to = animator.toTransformCss(buildTranslateToOrigin(currentTarget, options.closeTo));

            return animator.translate3d(currentTarget, from, to, translateOptions);
          }

          return animateReversal(animator.toTransformCss(buildTranslateToOrigin(currentTarget, options.origin)));
        };
        return true;
      });
    }

    /**
     * Listen for escape keys and outside clicks to auto close
     */
    function activateListeners(element, options) {
      var window = angular.element($window);
      var onWindowResize = $mdUtil.debounce(function () {
        moveSpotlightToNextTarget(spotlightEl, options);
      }, 60);

      var removeListeners = [];

      var parentTarget = options.parent;

      // OPTION -- escapeToClose
      if (options.escapeToClose) {

        var keyHandlerFn = function keyHandlerFn(ev) {
          if (ev.keyCode === $mdConstant.KEY_CODE.ESCAPE) {
            ev.stopPropagation();
            ev.preventDefault();
            endSpotlight(options);
          }
        };

        // Add keydown listeners
        element.on('keydown', keyHandlerFn);
        parentTarget.on('keydown', keyHandlerFn);

        // Queue remove listeners function
        removeListeners.push(function () {
          element.off('keydown', keyHandlerFn);
          parentTarget.off('keydown', keyHandlerFn);
        });
      }

      // LEFT/RIGHT navigation
      var keyHandlerLeftRightFn = function keyHandlerLeftRightFn(ev) {
        if (ev.keyCode === $mdConstant.KEY_CODE.LEFT_ARROW) {
          ev.stopPropagation();
          ev.preventDefault();
          nextTarget = getSpotlightTarget(options.group, 'prev');
          $mdUtil.nextTick(function () {
            return moveSpotlightToNextTarget(element, options);
          }, true);
        } else if (ev.keyCode === $mdConstant.KEY_CODE.RIGHT_ARROW) {
          ev.stopPropagation();
          ev.preventDefault();
          nextTarget = getSpotlightTarget(options.group, 'next');
          $mdUtil.nextTick(function () {
            return moveSpotlightToNextTarget(element, options);
          }, true);
        }
      };

      // Add keydown listeners
      element.on('keydown', keyHandlerLeftRightFn);
      parentTarget.on('keydown', keyHandlerLeftRightFn);

      // Queue remove listeners function
      removeListeners.push(function () {
        element.off('keydown', keyHandlerLeftRightFn);
        parentTarget.off('keydown', keyHandlerLeftRightFn);
      });

      // Register listener to update dialog on window resize
      window.on('resize', onWindowResize);

      removeListeners.push(function () {
        window.off('resize', onWindowResize);
      });

      // Attach specific `remove` listener handler
      options.deactivateListeners = function () {
        removeListeners.forEach(function (removeFn) {
          removeFn();
        });
        options.deactivateListeners = null;
      };
    }

    /**
     * Remove function for all dialogs
     */
    function onRemove(scope, element, options) {

      options.deactivateListeners();
      // TODO screen reader locking stuff
      // options.unlockScreenReader();
      options.hideBackdrop(options.$destroy);

      // animate the tip container toward origin and remove spotlight tip container
      spotlightTipContainerEl && $animate.leave(spotlightTipContainerEl);

      // Remove the focus traps that we added earlier for keeping focus within the dialog.
      if (topFocusTrap && topFocusTrap.parentNode) {
        topFocusTrap.parentNode.removeChild(topFocusTrap);
      }

      if (bottomFocusTrap && bottomFocusTrap.parentNode) {
        bottomFocusTrap.parentNode.removeChild(bottomFocusTrap);
      }

      // For navigation $destroy events, do a quick, non-animated removal,
      // but for normal closes (from clicks, etc) animate the removal
      return !!options.$destroy ? detachAndClean() : animateRemoval().then(detachAndClean);

      /**
       * For normal closes, animate the removal.
       * For forced closes (like $destroy events), skip the animations
       */
      function animateRemoval() {
        var promise = options.reverseAnimate ? options.reverseAnimate() : $q.when();
        return promise.then(function () {
          if (options.contentElement) {
            // When we use a contentElement, we want the element to be the same as before.
            // That means, that we have to clear all the animation properties, like transform.
            options.clearAnimate();
          }
        });
      }

      /**
       * Detach the element
       */
      function detachAndClean() {

        // tell document spotlight is no longer showing
        angular.element($document[0].body).removeClass('md-spotlight-is-showing');

        // reset targets
        currentTarget = null;
        nextTarget = null;

        // remove the spotlight element
        spotlightEl && spotlightEl.remove();

        if (!options.$destroy) options.origin.focus();
      }
    }
  }
}

module.exports = MdSpotlightProvider;

},{}],3:[function(_dereq_,module,exports){
'use strict';

var MdSpotlightDirective = _dereq_('./md-spotlight-directive');
var MdSpotlightProvider = _dereq_('./md-spotlight-provider');

/**
 * @ngdoc module
 * @name material.spotlight
 */
angular.module('md.spotlight', ['material.core', 'material.components.backdrop']).directive('mdSpotlight', MdSpotlightDirective).provider('$mdSpotlight', MdSpotlightProvider);

module.exports = angular.module('md.spotlight');

},{"./md-spotlight-directive":1,"./md-spotlight-provider":2}]},{},[3])(3)
});

//# sourceMappingURL=md-spotlight.js.map
