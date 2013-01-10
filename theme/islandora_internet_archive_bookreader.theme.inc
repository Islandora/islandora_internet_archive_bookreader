<?php

/**
 * @file
 *
 * Any hooks/functions used by this modules theme's.
 */

/**
 * Implements hook_preprocess_theme().
 */
function islandora_internet_archive_bookreader_preprocess_islandora_internet_archive_bookreader(array &$variables) {
  module_load_include('inc', 'islandora_internet_archive_bookreader', 'includes/utilities');
  $object = $variables['object'];
  $dsid = $variables['datastream_id'];
  $library_path = libraries_get_path('bookreader');
  $module_path = drupal_get_path('module', 'islandora_internet_archive_bookreader');
  $search_uri = module_exists('islandora_solr') ? url("internet_archive_bookreader_search/{$object->id}/TERM", array('absolute' => TRUE)) : NULL;
  $resource_uri = url("islandora/object/PID/datastream/{$dsid}/view", array('absolute' => TRUE));
  $page_data = count($variables['pages']) ? islandora_internet_archive_bookreader_get_page_data($variables['pages'][0]) : array('width' => 0, 'height' => 0);
  // Get token to allow access to XACML protected datastreams if necessary.
  if (isset($object['POLICY'])) {
    module_load_include('inc', 'islandora', 'includes/islandora_authtokens');
    $token = islandora_get_object_token($object->id, $dsid, 2);
    $resource_uri = url("islandora/object/{$islandora_object->id}/datastream/{$dsid}/view", array(
                      'absolute' => TRUE,
                      'query' => array('token' => $token),
                    ));
  }
  drupal_add_js(array(
      'islandoraInternetArchiveBookReader' => array(
        'book' => $object->id,
        'info' => theme('islandora_internet_archive_bookreader_book_info', array('object' => $object)),
        'label' => $object->label,
        'searchUri' => $search_uri,
        'textUri' => url('internet_archive_bookreader_text/PID', array('absolute' => TRUE)),
        'djatokaUri' => variable_get('islandora_internet_archive_bookreader_djatoka_url', 'http://localhost:8080/adore-djatoka'),
        'resourceUri' => $resource_uri,
        'imagesFolderUri' => url("$library_path/BookReader/images/", array('absolute' => TRUE)),
        'compression' => variable_get('islandora_internet_archive_bookreader_compression', '4'),
        'pageProgression' => $variables['page_progression'],
        'pages' => $variables['pages'],
        'pageCount' => count($variables['pages']),
        // Use the same width and height for all pages, we will probably have to
        // change this in the future
        'height' => $page_data['height'],
        'width' => $page_data['width'],
      ),
    ), 'setting');
  drupal_add_css("$library_path/BookReader/BookReader.css");
  drupal_add_css("$module_path/css/islandora_internet_archive_bookreader.css");
  // jquery 1.4.2 and ui 1.8.5 not being used in favor of the Drupal system.
  drupal_add_library('system', 'effects');
  drupal_add_library('system', 'ui.slider');
  drupal_add_library('system', 'ui.draggable');
  drupal_add_js("$library_path/BookReader/dragscrollable.js");
  // Use a newer version of color box as the version bundled with BookReader
  // won't work with JQuery 1.4.4
  drupal_add_js("$module_path/js/jquery.colorbox-min.js");
  // Needed to modify jquery.ui.ipad.js plugin to work with drupal
  // as '$' is not defined globally in D7.
  drupal_add_js("$module_path/js/jquery.ui.ipad.js");
  drupal_add_js("$library_path/BookReader/jquery.bt.min.js");
  drupal_add_js("$library_path/BookReader/BookReader.js");
  drupal_add_js("$module_path/js/IslandoraBookReader.js");
  drupal_add_js("$module_path/js/islandora_internet_archive_bookreader.js");
}

/**
 * Implements theme_hook().
 */
function theme_islandora_internet_archive_bookreader_book_info(array $variables) {
  $object = $variables['object'];
  $fields = islandora_internet_archive_bookreader_info_fields($object);
  $fields = array_map(function($o) { return implode('<br/>', $o); }, $fields);
  $rows = array_map(null, array_keys($fields), array_values($fields));
  $content = theme_table(array(
               'caption' => '',
               'empty' => t('No Information specified.'),
               'attributes' => array(),
               'colgroups' => array(),
               'header' => array(t('Field'), t('Values')),
               'rows' => $rows,
               'sticky' => FALSE,
             )
  );
  return $content;
}

/**
 * Retrieves an array of fields to display in the BookReader's "info"
 * modal dialog box.
 *
 * @param FedoraObject $object
 *   The object to fetch the information from.
 *
 * @return array
 *   Any array of fields where the key is the label and the second the
 *   fields value(s).
 * @code
 *   array(
 *     'label' => array('value', 'value')
 *   )
 * @endcode
 */
function islandora_internet_archive_bookreader_info_fields(FedoraObject $object) {
  if (!isset($object['MODS'])) {
    return array();
  }
  $fields = array(
    'Title' => '//mods:title',
    'Subtitle' => '//mods:subTitle',
    'Date' => '//mods:dateCreated | //mods:dateIssued',
    'Name' => array('//mods:name', 'mods:namePart'),
    'Abstract' => '//mods:abstract',
    'Identifier' => '//mods:identifier',
    'Physical Description' => array('//mods:physicalDescription', 'mods:extent | mods:form | mods:note[not(@*)] | mods:note[@type="physical"] | mods:note[@type="details"] | mods:scale | mods:coordinates'),
    'Topic' => '/mods:mods/mods:subject/mods:topic',
    'Continent' => '//mods:continent',
    'Country' => '//mods:country',
    'Province' => '//mods:province',
    'County' => '//mods:county',
    'Region/Lot' => '//mods:region',
    'City' => '//mods:city',
    'City Section' => '//mods:citySection',
    'Use and Reproduction' => '//mods:accessCondition[@type="useAndReproduction"]',
    'Restrictions on Access' => '//mods:accessCondition[@type="restrictionOnAccess"]',
    'Physical Location' => '//mods:physicalLocation'
  );
  $xml = simplexml_load_string($object['MODS']->content);
  $xml->registerXPathNamespace('mods', 'http://www.loc.gov/mods/v3');
  $to_string = function($o) { return (string) $o; };
  // Query each context node with the given xpath.
  $query_each_context = function (array $contexts, $xpath) {
    // Map values to each context node.
    array_walk($contexts, function(&$context, $key, $xpath) {
        $context->registerXPathNamespace('mods', 'http://www.loc.gov/mods/v3');
        $context = $context->xpath($xpath);
      }, $xpath);
    // Flatten to an array of values.
    return call_user_func_array('array_merge', $contexts);
  };
  // Query the given xpath. If the xpath is any array the first value is the
  // xpath for the context node(s) and the second the path to the value fields.
  $query = function(SimpleXMLElement $xml, $xpath) use(&$query_each_context) {
    return is_string($xpath) ? $xml->xpath($xpath) : $query_each_context($xml->xpath($xpath[0]), $xpath[1]);
  };
  foreach ($fields as $label => $xpath) {
    $results = $query($xml, $xpath);
    // Remove empty values.
    $fields[$label] = array_filter(array_map($to_string, $results));
  }
  // Remove empty fields.
  return array_filter($fields);
}
