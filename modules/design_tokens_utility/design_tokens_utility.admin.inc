<?php
/**
 * @file
 * Admin page callbacks for Design Tokens Utility.
 */

/**
 * Page callback: renders the utility class reference page for a theme.
 *
 * Shows all generated utility classes with live color swatches (using the
 * current saved token values) and font previews.
 *
 * @param string $theme_name
 *   The machine name of the theme.
 *
 * @return array|void
 *   A render array, or backdrop_not_found() if the theme is not supported.
 */
function design_tokens_utility_reference_page($theme_name) {
  $supported = design_tokens_get_supported_themes();
  if (!isset($supported[$theme_name])) {
    return backdrop_not_found();
  }

  $info = design_tokens_load_info($theme_name);
  if (empty($info['tokens'])) {
    return array('#markup' => '<p>' . t('This theme has no token definitions.') . '</p>');
  }

  $tokens = $info['tokens'];
  $current_values = design_tokens_get_values($theme_name);
  $theme_list = list_themes();
  $theme_label = isset($theme_list[$theme_name]) ? $theme_list[$theme_name]->info['name'] : $theme_name;
  $settings_url = 'admin/appearance/tokens/' . $theme_name;

  backdrop_set_title(t('Utility Class Reference — @theme', array('@theme' => $theme_label)));

  $output = array();

  $output['intro'] = array(
    '#markup' => '<p>' . t(
      'The following CSS utility classes are available for the <strong>@theme</strong> theme. '
      . 'To apply a class: open the <strong>Layout editor</strong>, click a block, expand <strong>Style</strong> settings, '
      . 'and enter the class name in the <strong>CSS class</strong> field.',
      array('@theme' => $theme_label)
    ) . '</p>'
    . '<p>' . l(t('← Back to token settings'), $settings_url) . '</p>',
    '#weight' => -100,
  );

  $color_rows = array();
  $font_rows = array();

  foreach ($tokens as $token_name => $token) {
    if (empty($token['utility'])) {
      continue;
    }

    $type = isset($token['type']) ? $token['type'] : '';

    switch ($type) {
      case 'color':
        $slug = preg_replace('/^color-/', '', $token_name);
        $class = 'dt-bg-' . $slug;

        // Derive group label for display.
        $group = isset($token['group']) ? $token['group'] : '';
        $group_label = '';
        if ($group && isset($info['groups'][$group])) {
          $g = $info['groups'][$group];
          $group_label = is_array($g) ? $g['label'] : $g;
        }

        // Build a live swatch using actual saved token values.
        $bg_color = isset($current_values[$token_name]) ? $current_values[$token_name] : '#cccccc';
        $text_color = isset($current_values[$token_name . '-text']) ? $current_values[$token_name . '-text'] : '#000000';
        $link_color = isset($current_values[$token_name . '-link']) ? $current_values[$token_name . '-link'] : $text_color;

        $swatch_style = 'background-color: ' . check_plain($bg_color) . '; '
          . 'color: ' . check_plain($text_color) . '; '
          . 'padding: 0.6rem 1rem; border-radius: 3px; font-size: 0.85rem; '
          . 'display: inline-block; min-width: 10rem; font-family: monospace;';

        $link_dot_style = 'display: inline-block; width: 1rem; height: 1rem; '
          . 'background: ' . check_plain($link_color) . '; '
          . 'border-radius: 50%; vertical-align: middle; margin-left: 0.5rem; '
          . 'title="Link color: ' . check_plain($link_color) . '"';

        $swatch = '<span style="' . $swatch_style . '">.' . check_plain($class) . '</span>'
          . '<span style="' . $link_dot_style . '" title="' . t('Link color: @color', array('@color' => $link_color)) . '"></span>';

        // Describe which properties are set.
        $has_text = isset($tokens[$token_name . '-text']);
        $has_link = isset($tokens[$token_name . '-link']);
        $sets = array(t('background'));
        if ($has_text) {
          $sets[] = t('text');
          $sets[] = t('block title');
        }
        if ($has_link) {
          $sets[] = t('links');
        }

        $color_rows[] = array(
          $swatch,
          '<code>.' . check_plain($class) . '</code>',
          check_plain($group_label),
          implode(', ', $sets),
        );
        break;

      case 'font':
        $slug = preg_replace('/^font-/', '', $token_name);
        $font_value = isset($current_values[$token_name]) ? $current_values[$token_name] : 'inherit';

        $preview_style = 'font-family: ' . check_plain($font_value) . '; '
          . 'font-size: 1.1rem; padding: 0.4rem 0;';

        $font_rows[] = array(
          '<div style="' . $preview_style . '">' . t('The quick brown fox') . '</div>',
          '<code>.dt-font-' . check_plain($slug) . '</code>',
          t('All text within the block'),
        );
        $font_rows[] = array(
          '<div style="' . $preview_style . ' font-size: 1.4rem; font-weight: bold;">'
            . t('Block Title Example') . '</div>',
          '<code>.dt-title-' . check_plain($slug) . '</code>',
          t('Block title only (.block-title)'),
        );
        break;
    }
  }

  if (!empty($color_rows)) {
    $output['color_heading'] = array(
      '#markup' => '<h2>' . t('Color Classes') . '</h2>'
        . '<p>' . t('Each class sets background color, text color, block title color, and link color together. The small dot shows the link color. Swatches reflect the current saved token values.') . '</p>',
      '#weight' => 10,
    );
    $output['color_table'] = array(
      '#theme' => 'table',
      '#header' => array(
        t('Preview'),
        t('Class name'),
        t('Color group'),
        t('Sets'),
      ),
      '#rows' => $color_rows,
      '#weight' => 11,
    );
  }

  if (!empty($font_rows)) {
    $output['font_heading'] = array(
      '#markup' => '<h2>' . t('Font Classes') . '</h2>'
        . '<p>' . t('Apply a font family to a block. Use .dt-font-{name} to change all text within the block, or .dt-title-{name} to change only the block title.') . '</p>',
      '#weight' => 20,
    );
    $output['font_table'] = array(
      '#theme' => 'table',
      '#header' => array(
        t('Preview'),
        t('Class name'),
        t('Applies to'),
      ),
      '#rows' => $font_rows,
      '#weight' => 21,
    );
  }

  if (empty($color_rows) && empty($font_rows)) {
    $output['none'] = array(
      '#markup' => '<p>' . t("No utility classes are configured for this theme. Add <code>'utility' => TRUE</code> to token definitions in your theme's <code>tokens.inc</code> file.") . '</p>',
    );
  }

  return $output;
}
