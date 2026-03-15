/**
 * @file
 * Admin JS for Design Tokens Utility autocomplete.
 */

(function ($) {
  'use strict';

  /**
   * Constrains the autocomplete popup height and prevents scroll events
   * from bubbling to the page when scrolling inside the dropdown.
   *
   * Backdrop's autocomplete popup is <div id="autocomplete"> with
   * overflow:hidden set in system.css. We override overflow-y via an
   * injected <style> tag (reliable regardless of CSS load order).
   *
   * Max-height is set dynamically when the dropdown is positioned so it
   * never extends below the visible viewport, regardless of where the
   * input field sits on screen.
   */
  Backdrop.behaviors.designTokensUtilityAutocomplete = {
    attach: function (context, settings) {

      // Inject CSS once to guarantee overflow-y wins over system.css.
      // Max-height is intentionally omitted here — set dynamically below.
      if (!$('#dt-autocomplete-scroll-style').length) {
        $('<style id="dt-autocomplete-scroll-style">' +
          '#autocomplete { overflow-y: scroll !important; }' +
          '</style>').appendTo('head');
      }

      // Dynamically set max-height when the dropdown appears or is repositioned,
      // so it fits within the visible viewport below its top edge.
      function constrainHeight() {
        var el = document.getElementById('autocomplete');
        if (!el || !el.style.top) { return; }
        var rect = el.getBoundingClientRect();
        var available = window.innerHeight - rect.top - 20; // 20px breathing room
        el.style.maxHeight = Math.min(300, Math.max(80, available)) + 'px';
      }

      // MutationObserver watches for the dropdown being shown or repositioned.
      // Guard against attaching multiple observers across Backdrop.behaviors calls.
      if (window.MutationObserver && !window._dtAcObserver) {
        window._dtAcObserver = new MutationObserver(function (mutations) {
          var i;
          for (i = 0; i < mutations.length; i++) {
            if (mutations[i].target.id === 'autocomplete' ||
                (mutations[i].addedNodes.length &&
                 document.getElementById('autocomplete'))) {
              constrainHeight();
              break;
            }
          }
        });
        window._dtAcObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style']
        });
      }

      // Prevent wheel events bubbling to the page when scrolling the list.
      $(document).on('wheel.dtAutocomplete', '#autocomplete', function (e) {
        var el = this;
        var delta = e.originalEvent.deltaY;
        var atTop = delta < 0 && el.scrollTop === 0;
        var atBottom = delta > 0 && el.scrollTop + el.offsetHeight >= el.scrollHeight;

        if (atTop || atBottom) {
          e.preventDefault();
        }
        e.stopPropagation();
      });
    }
  };

}(jQuery));
