'use strict';

/**
 * @ngdoc service
 * @name $mdSpotlight
 * @module md.spotlight
 */
function MdSpotlightProvider($$interimElementProvider) {

  // Elements to capture and redirect focus when the user presses tab at the dialog boundary.
  var topFocusTrap, bottomFocusTrap;

  return $$interimElementProvider('$mdSpotlight')
    .setDefaults({
      methods: [
        'disableParentScroll',
        'targetEvent',
        'closeTo',
        'openFrom',
        'focusOnOpen',
        'parent'
      ],
      options: dialogDefaultOptions
    });

  /* @ngInject */
  function dialogDefaultOptions($mdSpotlight, $mdAria, $mdUtil, $mdConstant, $animate, $document, $window, $rootScope, $timeout, $rootElement, $log, $injector, $q) {
    return {
      isolateScope: true,
      onShow: onShow,
      onShowing: beforeShow,
      onRemove: onRemove,
      escapeToClose: true,
      targetEvent: null,
      closeTo: null,
      openFrom: null,
      focusOnOpen: false,
      disableParentScroll: false,
      transformTemplate: function(template, options) {
        return '<div class="md-spotlight-spotlight md-whiteframe-z1"></div>';
      }
    };

    function beforeShow(scope, element, options, controller) {
      // if (controller) {
      //   controller.mdHtmlContent = controller.htmlContent || options.htmlContent || '';
      //   controller.mdTextContent = controller.textContent || options.textContent ||
      //       controller.content || options.content || '';

      //   if (controller.mdHtmlContent && !$injector.has('$sanitize')) {
      //     throw Error('The ngSanitize module must be loaded in order to use htmlContent.');
      //   }

      //   if (controller.mdHtmlContent && controller.mdTextContent) {
      //     throw Error('md-dialog cannot have both `htmlContent` and `textContent`');
      //   }
      // }
    }

    /** Show method for dialogs */
    function onShow(scope, element, options, controller) {

      // TODO replace with md-spotlight-is-showing
      angular.element($document[0].body).addClass('md-spotlight-is-showing');

      captureParentAndFromToElements(options);

      // TODO aria bullshit
      // configureAria(element.find('md-dialog'), options);

      showBackdrop(scope, element, options);


      setupSpotlight(element, options);

      activateListeners(element, options);

      return moveSpotlightToNextSpotlightItem(element, options)
        .then(function() {

          // TODO perhaps here should be where highlight index goes

          lockScreenReader(element, options);
          focusOnOpen();
        });

      /**
       * Focus on "Next" / "Prev" / "Close"
       */
      function focusOnOpen() {

        if (options.focusOnOpen) {

          // TODO does this look for the md-autofocus?
          debugger;
          var target = $mdUtil.findFocusTarget(element) || findNextButton();
          target.focus();
        }

        /**
         * If no element with class dialog-close, try to find the last
         * button child in md-actions and assume it is a close button.
         *
         * If we find no actions at all, log a warning to the console.
         */
        function findNextButton() {

          // TODO replace logic
          return;

          // var closeButton = element[0].querySelector('.dialog-close');
          // if (!closeButton) {
          //   var actionButtons = element[0].querySelectorAll('.md-actions button, md-dialog-actions button');
          //   closeButton = actionButtons[actionButtons.length - 1];
          // }
          // return angular.element(closeButton);
        }
      }
    }

    /**
     * Remove function for all dialogs
     */
    function onRemove(scope, element, options) {

      console.log('onRemove');


      // options.deactivateListeners();
      options.unlockScreenReader();
      options.hideBackdrop(options.$destroy);

      // Remove the focus traps that we added earlier for keeping focus within the dialog.
      if (topFocusTrap && topFocusTrap.parentNode) {
        topFocusTrap.parentNode.removeChild(topFocusTrap);
      }

      if (bottomFocusTrap && bottomFocusTrap.parentNode) {
        bottomFocusTrap.parentNode.removeChild(bottomFocusTrap);
      }

      // For navigation $destroy events, do a quick, non-animated removal,
      // but for normal closes (from clicks, etc) animate the removal
      return !!options.$destroy ? detachAndClean() : animateRemoval().then( detachAndClean );

      /**
       * For normal closes, animate the removal.
       * For forced closes (like $destroy events), skip the animations
       */
      function animateRemoval() {
        return dialogPopOut(element, options);
      }

      /**
       * Detach the element
       */
      function detachAndClean() {
        angular.element($document[0].body).removeClass('md-spotlight-is-showing');
        element.remove();

        if (!options.$destroy) options.origin.focus();
      }
    }

    /**
     * Identify the bounding RECT for the target element
     *
     */
    function getBoundingClientRect (element, orig) {
      var source = angular.element((element || {}));
      if (source && source.length) {
        // Compute and save the target element's bounding rect, so that if the
        // element is hidden when the dialog closes, we can shrink the dialog
        // back to the same position it expanded from.
        //
        // Checking if the source is a rect object or a DOM element
        var bounds = {top:0,left:0,height:0,width:0};
        var hasFn = angular.isFunction(source[0].getBoundingClientRect);

        return angular.extend(orig || {}, {
            element : hasFn ? source : undefined,
            bounds  : hasFn ? source[0].getBoundingClientRect() : angular.extend({}, bounds, source[0]),
            focus   : angular.bind(source, source.focus),
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

          options.parent   = getDomElement(options.parent, $rootElement);
          options.closeTo  = getBoundingClientRect(getDomElement(options.closeTo));
          options.openFrom = getBoundingClientRect(getDomElement(options.openFrom));

          if ( options.targetEvent ) {
            options.origin   = getBoundingClientRect(options.targetEvent.target, options.origin);
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
     * Listen for escape keys and outside clicks to auto close
     */
    function activateListeners(element, options) {

      console.log('activate listeners');

      var window = angular.element($window);
      var onWindowResize = $mdUtil.debounce(function(){
        // TODO move spotlight to calculated container offset (stay at same index)
        console.log('TODO onWindowResize');
      }, 60);

      var removeListeners = [];

      if (options.escapeToClose) {

        var parentTarget = options.parent;
        var keyHandlerFn = function(ev) {

          if (ev.keyCode === $mdConstant.KEY_CODE.ESCAPE) {
            ev.stopPropagation();
            ev.preventDefault();
            endSpotlight(options);
          }

          if (ev.keyCode === $mdConstant.KEY_CODE.LEFT_ARROW) {
            ev.stopPropagation();
            ev.preventDefault();
            moveSpotlightToNextSpotlightItem(element, options, 'prev');
          }
          else if (ev.keyCode === $mdConstant.KEY_CODE.RIGHT_ARROW) {
            ev.stopPropagation();
            ev.preventDefault();
            moveSpotlightToNextSpotlightItem(element, options);
          }

        };

        // Add keydown listeners
        element.on('keydown', keyHandlerFn);
        parentTarget.on('keydown', keyHandlerFn);

        // Queue remove listeners function
        removeListeners.push(function() {

          element.off('keydown', keyHandlerFn);
          parentTarget.off('keydown', keyHandlerFn);

        });
      }

      // Register listener to update dialog on window resize
      window.on('resize', onWindowResize);
      removeListeners.push(function() {
        window.off('resize', onWindowResize);
      });

      // Attach specific `remove` listener handler
      options.deactivateListeners = function() {
        removeListeners.forEach(function(removeFn) {
          removeFn();
        });
        options.deactivateListeners = null;
      };
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

      // if (options.hasBackdrop) {
        options.backdrop = $mdUtil.createBackdrop(scope, "_md-dialog-backdrop md-opaque");
        $animate.enter(options.backdrop, options.parent);
      // }

      /**
       * Hide modal backdrop element...
       */
      options.hideBackdrop = function hideBackdrop($destroy) {
        if (options.backdrop) {
          if ( !!$destroy ) options.backdrop.remove();
          else              $animate.leave(options.backdrop);
        }

        if (options.disableParentScroll) {
          options.restoreScroll();
          delete options.restoreScroll;
        }

        options.hideBackdrop = null;
      }
    }

    /**
     * Inject ARIA-specific attributes appropriate for Dialogs
     */
    function configureAria(element, options) {

      var role = (options.$type === 'alert') ? 'alertdialog' : 'dialog';
      var dialogContent = element.find('md-dialog-content');
      var dialogContentId = 'dialogContent_' + (element.attr('id') || $mdUtil.nextUid());

      element.attr({
        'role': role,
        'tabIndex': '-1'
      });

      if (dialogContent.length === 0) {
        dialogContent = element;
      }

      dialogContent.attr('id', dialogContentId);
      element.attr('aria-describedby', dialogContentId);

      if (options.ariaLabel) {
        $mdAria.expect(element, 'aria-label', options.ariaLabel);
      }
      else {
        $mdAria.expectAsync(element, 'aria-label', function() {
          var words = dialogContent.text().split(/\s+/);
          if (words.length > 3) words = words.slice(0, 3).concat('...');
          return words.join(' ');
        });
      }

      // Set up elements before and after the dialog content to capture focus and
      // redirect back into the dialog.
      topFocusTrap = document.createElement('div');
      topFocusTrap.classList.add('_md-dialog-focus-trap');
      topFocusTrap.tabIndex = 0;

      bottomFocusTrap = topFocusTrap.cloneNode(false);

      // When focus is about to move out of the dialog, we want to intercept it and redirect it
      // back to the dialog element.
      var focusHandler = function() {
        element.focus();
      };
      topFocusTrap.addEventListener('focus', focusHandler);
      bottomFocusTrap.addEventListener('focus', focusHandler);

      // The top focus trap inserted immeidately before the md-dialog element (as a sibling).
      // The bottom focus trap is inserted at the very end of the md-dialog element (as a child).
      element[0].parentNode.insertBefore(topFocusTrap, element[0]);
      element.after(bottomFocusTrap);
    }

    /**
     * Prevents screen reader interaction behind modal window
     * on swipe interfaces
     */
    function lockScreenReader(element, options) {
      var isHidden = true;

      // get raw DOM node
      walkDOM(element[0]);

      options.unlockScreenReader = function() {
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

    var currentSpotlightItem = null;

    function moveSpotlightToNextSpotlightItem(spotlightEl, options, direction) {

      console.log('moveSpotlightToNextSpotlightItem');
      console.log('spotlightEl', spotlightEl);

      var nextSpotlightItem;

      if (currentSpotlightItem) {
        currentSpotlightItem.removeClass('md-spotlight-shining');
      }

      // query for the "next" thing to highlight -- md-spotlight group="controls" index="1"
      var groupEls = document.querySelectorAll('[md-spotlight="' + options.group + '"]');

      var groupElsArray = $mdUtil.nodesToArray(groupEls);

      // sort lowest to highest by `md-spotlight-index` attribute
      groupElsArray.sort(function(a,b) {
        return a.getAttribute('md-spotlight-index') > b.getAttribute('md-spotlight-index');
      });

      if (currentSpotlightItem) {
        var index = groupElsArray.indexOf(currentSpotlightItem[0]) + (direction === 'prev' ? -1 : 1);

        if (index >= groupElsArray.length || index < 0) {
          return endSpotlight(options);
        }
        else {
          nextSpotlightItem = angular.element(groupElsArray[index]);
        }

      }
      else {
        nextSpotlightItem = angular.element(groupElsArray[0]);
      }

      var animator = $mdUtil.dom.animator;
      var buildTranslateToOrigin = animator.calculateZoomToOrigin;
      var translateOptions = {transitionInClass: '_md-transition-in', transitionOutClass: '_md-transition-out'};


      var endPoint = getBoundingClientRect(nextSpotlightItem);

      // TODO remove spotlight class from currentSpotlightItem
      nextSpotlightItem.addClass('md-spotlight-shining');

      var padding = 5;

      spotlightEl.css({
        top: endPoint.bounds.top - padding + 'px',
        bottom: endPoint.bounds.bottom + padding + 'px',
        left: endPoint.bounds.left - padding + 'px',
        right: endPoint.bounds.right + padding + 'px',
        height: endPoint.bounds.height + padding + padding + 'px',
        width: endPoint.bounds.width + padding + padding + 'px'
      });

      if (currentSpotlightItem) {
        currentSpotlightItem = nextSpotlightItem;
        $timeout(function() {
          $rootScope.spotlightIndex = currentSpotlightItem.attr('md-spotlight-index');
        });
        return $q.when(true);
      }

      var from = animator.toTransformCss(buildTranslateToOrigin(spotlightEl, options.openFrom || options.origin));
      var to = animator.toTransformCss("");  // defaults to center display (or parent or $rootElement)

      console.log('from', from);
      console.log('to', to);

      currentSpotlightItem = nextSpotlightItem;

      $timeout(function() {
        $rootScope.spotlightIndex = currentSpotlightItem.attr('md-spotlight-index');
      })


      // TODO save animation promise to cancel?

      return animator
        .translate3d(spotlightEl, from, to, translateOptions)
        .then(function(animateReversal) {

          // Build a reversal translate function synched to this translation...
          options.reverseAnimate = function() {
            delete options.reverseAnimate;

            if (options.closeTo) {
              // Using the opposite classes to create a close animation to the closeTo element
              translateOptions = {transitionInClass: '_md-transition-out', transitionOutClass: '_md-transition-in'};
              from = to;
              to = animator.toTransformCss(buildTranslateToOrigin(currentSpotlightItem, options.closeTo));

              return animator
                .translate3d(currentSpotlightItem, from, to, translateOptions);
            }

            return animateReversal(
              animator.toTransformCss(
                // in case the origin element has moved or is hidden,
                // let's recalculate the translateCSS
                buildTranslateToOrigin(currentSpotlightItem, options.origin)
              )
            );

          };
          return true;
        });

    }

    function endSpotlight(options) {

      // hide on next tick
      // $mdUtil.nextTick($mdSpotlight.hide, true);
      // $mdSpotlight.destroy(element);

      $timeout(function() {
        $rootScope.spotlightIndex = null;
      });

      options.hideBackdrop(options.$destroy);

      return options.reverseAnimate().then(function() {

        options.deactivateListeners();

        console.log('removed spotlightEl from dom');
        if (currentSpotlightItem) {
          currentSpotlightItem.removeClass('md-spotlight-shining');
        }
        currentSpotlightItem = undefined;
        options.spotlightEl.remove();
      })
    }

    // TODO rename spotlightEl to spotlight?
    function setupSpotlight(spotlightEl, options) {

      console.log('setupSpotlight', spotlightEl, options);

      // add the `.md-spotlight-spotlight` to the DOM
      options.parent.append(spotlightEl);
      console.log('added spotlightEl to dom');

      options.spotlightEl = spotlightEl;
    }

    /**
     * Utility function to filter out raw DOM nodes
     */
    function isNodeOneOf(elem, nodeTypeArray) {
      if (nodeTypeArray.indexOf(elem.nodeName) !== -1) {
        return true;
      }
    }

  }
}

module.exports = MdSpotlightProvider;
