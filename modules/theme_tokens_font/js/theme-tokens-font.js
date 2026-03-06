/**
 * @file
 * Theme Tokens Font — admin field enhancement.
 *
 * Inserts a preset select dropdown and font preview for each font token field.
 * Google Fonts are loaded on demand when selected so the admin preview renders
 * in the correct typeface.
 */
(function ($) {
  'use strict';

  /**
   * Dynamically injects a Google Fonts stylesheet if not already loaded.
   *
   * @param {string} googleFontSpec
   *   The Google Fonts CSS2 API family spec, e.g. "Merriweather:wght@400;700".
   */
  function loadGoogleFont(googleFontSpec) {
    var id = 'theme-tokens-gf-' + googleFontSpec.replace(/[^a-zA-Z0-9]/g, '-');
    if (document.getElementById(id)) {
      return;
    }
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + googleFontSpec + '&display=swap';
    document.head.appendChild(link);
  }

  Backdrop.behaviors.themeTokensFont = {
    attach: function (context, settings) {
      var s = settings.themeTokensFont || {};
      var presets     = s.presets     || [];
      var selectLabel = s.selectLabel || '— Choose a preset —';
      var customLabel = s.customLabel || 'Custom font stack';
      var previewText = s.previewText || 'The quick brown fox jumps over the lazy dog.';

      // Build a flat map: CSS value → google_font spec (for on-demand loading).
      var googleFontsMap = {};
      $.each(presets, function (i, group) {
        $.each(group.fonts, function (j, font) {
          if (font.google_font) {
            googleFontsMap[font.value] = font.google_font;
          }
        });
      });

      $('.theme-tokens-font-field', context).once('theme-tokens-font', function () {
        var $field   = $(this);
        var $wrapper = $field.closest('.form-item');
        var current  = $field.val();

        /* ---- Build the preset select ------------------------------------ */
        var $select = $('<select class="theme-tokens-font-select form-select">');
        $select.append($('<option>').val('').text(selectLabel));

        var matchesPreset = false;

        $.each(presets, function (i, group) {
          var $group = $('<optgroup>').attr('label', group.label);
          $.each(group.fonts, function (j, font) {
            var $opt = $('<option>').val(font.value).text(font.label);
            if (font.value === current) {
              $opt.prop('selected', true);
              matchesPreset = true;
              // Pre-load the font so the existing value renders correctly.
              if (font.google_font) {
                loadGoogleFont(font.google_font);
              }
            }
            $group.append($opt);
          });
          $select.append($group);
        });

        var $customGroup = $('<optgroup>').attr('label', customLabel);
        var $customOpt   = $('<option>').val('custom').text('— ' + customLabel + '…');
        $customGroup.append($customOpt);
        $select.append($customGroup);

        if (current && !matchesPreset) {
          $customOpt.prop('selected', true);
        }

        /* ---- Build the preview ------------------------------------------ */
        var $preview = $('<div class="theme-tokens-font-preview">').text(previewText);
        $preview.css('font-family', current || 'inherit');

        /* ---- Insert into DOM -------------------------------------------- */
        $wrapper.prepend($select);
        $field.after($preview);

        // Hide the text field unless a custom value is active.
        if (!current || matchesPreset) {
          $field.addClass('theme-tokens-font-field-hidden');
        }

        /* ---- Event handlers --------------------------------------------- */
        $select.on('change', function () {
          var val = $(this).val();
          if (val === 'custom') {
            $field.removeClass('theme-tokens-font-field-hidden').focus();
          }
          else if (val) {
            $field.val(val).addClass('theme-tokens-font-field-hidden');
            $preview.css('font-family', val);
            // Load the Google Font for the admin preview if needed.
            if (googleFontsMap[val]) {
              loadGoogleFont(googleFontsMap[val]);
              // Also load it inside the preview iframe.
              if (Backdrop.themeTokens && Backdrop.themeTokens.loadFontInPreview) {
                Backdrop.themeTokens.loadFontInPreview(googleFontsMap[val]);
              }
            }
            // Send CSS variable update to the live preview iframe.
            if (Backdrop.themeTokens && Backdrop.themeTokens.updatePreview) {
              Backdrop.themeTokens.updatePreview($field.data('token-name'), val);
            }
          }
          else {
            $field.addClass('theme-tokens-font-field-hidden');
          }
        });

        $field.on('input change', function () {
          var val = $(this).val();
          $preview.css('font-family', val || 'inherit');

          // Sync select if value matches a preset.
          var matched = false;
          $select.find('option').each(function () {
            if ($(this).val() === val) {
              $(this).prop('selected', true);
              matched = true;
            }
          });
          if (!matched) {
            $customOpt.prop('selected', true);
          }

          // Send CSS variable update to the live preview iframe.
          if (Backdrop.themeTokens && Backdrop.themeTokens.updatePreview) {
            Backdrop.themeTokens.updatePreview($field.data('token-name'), val);
          }
        });
      });
    }
  };

})(jQuery);
