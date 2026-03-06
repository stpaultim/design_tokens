(function ($) {

  'use strict';

  Backdrop.behaviors.themeTokensAdmin = {
    attach: function (context, settings) {

      // Collapse all / Expand all toggle.
      $('#theme-tokens-collapse-all', context).once('theme-tokens-collapse').on('click', function () {
        var $button = $(this);
        var $fieldsets = $('fieldset.collapsible', context);
        var allCollapsed = $fieldsets.filter(':not(.collapsed)').length === 0;

        if (allCollapsed) {
          // Expand all — click any collapsed fieldset legends.
          $fieldsets.filter('.collapsed').find('> legend a').trigger('click');
          $button.text(Backdrop.t('Collapse all'));
        }
        else {
          // Collapse all — click any expanded fieldset legends.
          $fieldsets.filter(':not(.collapsed)').find('> legend a').trigger('click');
          $button.text(Backdrop.t('Expand all'));
        }
      });

      // Preview panel toggle.
      $('#theme-tokens-preview-toggle', context).once('theme-tokens-toggle').on('click', function () {
        Backdrop.themeTokens.togglePreview();
      });

      // Close button inside the panel.
      $('#theme-tokens-preview-close', context).once('theme-tokens-close').on('click', function () {
        Backdrop.themeTokens.closePreview();
      });

      // Scheme selector — populate all token fields when a preset is chosen.
      $('#theme-tokens-scheme-select', context).once('theme-tokens-scheme').on('change', function () {
        var scheme_key = $(this).val();
        if (!scheme_key) {
          return;
        }
        var schemes = (settings.themeTokens && settings.themeTokens.schemes) ? settings.themeTokens.schemes : {};
        var scheme = schemes[scheme_key];
        if (!scheme || !scheme.tokens) {
          return;
        }
        $.each(scheme.tokens, function (token_name, value) {
          var $field = $('[data-token-name="' + token_name + '"]');
          if ($field.length) {
            $field.val(value).trigger('change');
          }
        });
      });

      // Initialize live preview iframe.
      Backdrop.themeTokens.initPreview(context);
    }
  };

  /**
   * Shared Theme Tokens preview utilities.
   */
  Backdrop.themeTokens = Backdrop.themeTokens || {

    /**
     * Opens the preview panel, positioning it below the Backdrop toolbar.
     */
    openPreview: function () {
      var $panel = $('#theme-tokens-preview-panel');
      var $toggle = $('#theme-tokens-preview-toggle');

      // Position panel below the Backdrop admin toolbar.
      var toolbarHeight = $('#toolbar').outerHeight() || 0;
      $panel.css('top', toolbarHeight + 'px');

      $panel.removeAttr('hidden');
      $toggle.text(Backdrop.t('Hide preview'));
      $('body').addClass('theme-tokens-preview-open');
    },

    /**
     * Closes the preview panel.
     */
    closePreview: function () {
      $('#theme-tokens-preview-panel').attr('hidden', '');
      $('#theme-tokens-preview-toggle').text(Backdrop.t('Show preview'));
      $('body').removeClass('theme-tokens-preview-open');
    },

    /**
     * Toggles the preview panel open or closed.
     */
    togglePreview: function () {
      var isHidden = $('#theme-tokens-preview-panel').attr('hidden') !== undefined;
      if (isHidden) {
        Backdrop.themeTokens.openPreview();
      }
      else {
        Backdrop.themeTokens.closePreview();
      }
    },

    /**
     * Initializes the preview iframe — replays all current values on load.
     */
    initPreview: function (context) {
      var $iframe = $('#theme-tokens-preview-iframe', context);
      if (!$iframe.length) {
        return;
      }

      $iframe.on('load', function () {
        $('[data-token-name]').each(function () {
          var $field = $(this);
          Backdrop.themeTokens.updatePreview($field.data('token-name'), $field.val());
        });
      });
    },

    /**
     * Sends a token update to the preview iframe via postMessage.
     *
     * @param {string} tokenName  Token name (without --).
     * @param {string} value      New value.
     */
    updatePreview: function (tokenName, value) {
      var $iframe = $('#theme-tokens-preview-iframe');
      if (!$iframe.length || !$iframe[0].contentWindow) {
        return;
      }
      $iframe[0].contentWindow.postMessage({
        type: 'themeTokensUpdate',
        token: '--' + tokenName,
        value: value
      }, window.location.origin);
    }
  };

}(jQuery));
