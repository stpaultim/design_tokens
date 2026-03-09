(function ($) {

  'use strict';

  // --- WCAG contrast ratio helpers ---

  /**
   * Converts a 6-digit hex color string to relative luminance (WCAG 2.1).
   *
   * @param {string} hex - e.g. '#6e0e0a'
   * @return {number} Relative luminance between 0 and 1.
   */
  function hexToLuminance(hex) {
    return [1, 3, 5]
      .map(function (i) { return parseInt(hex.slice(i, i + 2), 16) / 255; })
      .map(function (c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
      .reduce(function (sum, c, i) { return sum + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }

  /**
   * Returns the WCAG contrast ratio between two hex colors.
   *
   * @param {string} hex1
   * @param {string} hex2
   * @return {number} Contrast ratio, e.g. 4.5.
   */
  function contrastRatio(hex1, hex2) {
    var l1 = hexToLuminance(hex1);
    var l2 = hexToLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /**
   * Updates the contrast badge next to a text-type color field.
   *
   * Looks up the companion background field by stripping the '-text' suffix
   * from the token name, calculates the contrast ratio between the two current
   * values, and updates the badge's text and CSS modifier class.
   *
   * @param {jQuery} $textField - The color field for the text token.
   */
  function updateContrastBadge($textField) {
    var $badge = $textField.siblings('.dt-contrast-badge');
    if (!$badge.length) {
      return;
    }

    // Derive the companion background field. Try '{base}-bg' first (e.g.
    // 'button-text' → 'button-bg'), then fall back to just '{base}' (e.g.
    // 'color-primary-text' → 'color-primary').
    var baseName = $textField.data('token-name').replace(/-text$/, '');
    var $bgField = $('[data-token-name="' + baseName + '-bg"]');
    if (!$bgField.length) {
      $bgField = $('[data-token-name="' + baseName + '"]');
    }
    if (!$bgField.length) {
      return;
    }

    var textHex = $textField.val().toLowerCase();
    var bgHex = $bgField.val().toLowerCase();

    if (!/^#[0-9a-f]{6}$/.test(textHex) || !/^#[0-9a-f]{6}$/.test(bgHex)) {
      $badge.text('').removeClass('dt-contrast--aaa dt-contrast--aa dt-contrast--large dt-contrast--fail');
      return;
    }

    var ratio = contrastRatio(textHex, bgHex);
    var ratioText = ratio.toFixed(1) + ':1';
    var level, modifier;

    var title;
    if (ratio >= 7) {
      level = 'AAA';
      modifier = 'dt-contrast--aaa';
      title = 'Excellent contrast (' + ratioText + '). Passes WCAG AAA — suitable for all text.';
    }
    else if (ratio >= 4.5) {
      level = 'AA';
      modifier = 'dt-contrast--aa';
      title = 'Good contrast (' + ratioText + '). Passes WCAG AA — suitable for normal body text.';
    }
    else if (ratio >= 3) {
      level = 'AA Large';
      modifier = 'dt-contrast--large';
      title = 'Marginal contrast (' + ratioText + '). Passes only for large text (18pt+) or bold text (14pt+). Not suitable for body text.';
    }
    else {
      level = 'Fail';
      modifier = 'dt-contrast--fail';
      title = 'Insufficient contrast (' + ratioText + '). Fails all WCAG thresholds — this color combination should be changed.';
    }

    $badge
      .text(ratioText + ' ' + level)
      .attr('title', title)
      .removeClass('dt-contrast--aaa dt-contrast--aa dt-contrast--large dt-contrast--fail')
      .addClass(modifier);
  }

  Backdrop.behaviors.designTokensColor = {
    attach: function (context, settings) {
      $('.design-tokens-color-field', context).once('design-tokens-color').each(function () {
        var $text = $(this);
        var tokenName = $text.data('token-name');
        var currentVal = $text.val();
        var isTextToken = /-text$/.test(tokenName);

        // Append a native color picker input after the text field.
        var $picker = $('<input>')
          .attr('type', 'color')
          .attr('aria-label', $text.attr('aria-label') || $text.attr('title') || '')
          .addClass('design-tokens-color-picker');

        if (/^#[0-9a-f]{6}$/.test(currentVal)) {
          $picker.val(currentVal);
        }

        $text.after($picker);

        // Add a contrast badge after the picker, but only for text-type tokens.
        if (isTextToken) {
          $picker.after($('<span>').addClass('dt-contrast-badge'));
          updateContrastBadge($text);
        }

        // Picker → text field.
        $picker.on('input change', function () {
          var value = $picker.val();
          $text.val(value);
          Backdrop.designTokens.updatePreview(tokenName, value);
          if (isTextToken) {
            updateContrastBadge($text);
          }
          else {
            // Background field changed — update the companion text field's badge.
            // Strip '-bg' suffix if present before appending '-text', so that
            // 'button-bg' finds 'button-text' rather than 'button-bg-text'.
            var baseName = tokenName.replace(/-bg$/, '');
            var $companion = $('[data-token-name="' + baseName + '-text"]');
            if ($companion.length) {
              updateContrastBadge($companion);
            }
          }
        });

        // Text field → picker (and badge).
        $text.on('input change', function () {
          var value = $text.val().toLowerCase();
          if (/^#[0-9a-f]{6}$/.test(value)) {
            $picker.val(value);
          }
          Backdrop.designTokens.updatePreview(tokenName, value);
          if (isTextToken) {
            updateContrastBadge($text);
          }
          else {
            var baseName = tokenName.replace(/-bg$/, '');
            var $companion = $('[data-token-name="' + baseName + '-text"]');
            if ($companion.length) {
              updateContrastBadge($companion);
            }
          }
        });
      });
    }
  };

}(jQuery));
