<?php

/**
 * @file
 * Handles the display/submission of the admin settings form for this module.
 */

/**
 * Defines the admin settings form.
 *
 * @param array $form
 *   The Drupal form definition.
 * @param array $form_state
 *   The Drupal form state.
 *
 * @return array
 *   The Drupal form definition.
 */
function islandora_internet_archive_bookreader_admin_settings_form(array $form, array &$form_state) {
  $get_default_value = function($name, $default) use($form_state) {
    return isset($form_state['values'][$name]) ? $form_state['values'][$name] : variable_get($name, $default);
  };
  $solr_enabled = module_exists('islandora_solr');
  $form = array(
    'islandora_internet_archive_bookreader_compression' => array(
      '#type' => 'textfield',
      '#title' => t('The djatoka image compression level'),
      '#description' => t('The level of compression we want djatoka to use when creating the image, usually set at 4 or 5.'),
      '#element_validate' => array('element_validate_number'),
      '#default_value' => $get_default_value('islandora_internet_archive_bookreader_compression', '4'),
    ),
    'islandora_internet_archive_bookreader_ocr_filter_field' => array(
      '#access' => $solr_enabled,
      '#type' => 'textfield',
      '#title' => t('Solr field that has the relationship to the book object pid'),
      '#description' => t('When we search within a book we need to know the pid of the book. This would be the solr field that contains the book pid for each page object.'),
      '#default_value' => $get_default_value('islandora_internet_archive_bookreader_ocr_filter_field', 'rels.isMemberOf'),
    ),
  );
  return system_settings_form($form);
}
