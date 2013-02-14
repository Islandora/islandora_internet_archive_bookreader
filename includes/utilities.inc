<?php

/**
 * @file
 * Miscellaneous helper functions.
 */

/**
 * Fetches the given page's dimensions.
 *
 * Firsts attempts to get it from the FITS metadata datastream, if that fails
 * it will use Djatoka.
 *
 * @param FedoraObject $object
 *   The page object.
 *
 * @return array
 *   An associative array containing the following fields.
 *   - width: The width of the image in pixels.
 *   - height: The width of the image in pixels.
 *   If this function should fail for some reason all the fields will be 0.
 */
function islandora_internet_archive_bookreader_get_page_dimensions(FedoraObject $object) {
  $dimensions = array('width' => 0, 'height' => 0);
  $metadata = islandora_internet_archive_bookreader_get_technical_metadata($object);
  $metadata = $metadata ? $metadata : islandora_internet_archive_bookreader_get_page_metadata_from_djatoka($object->id);
  return $metadata ? array_intersect_key($metadata, $dimensions) : $dimensions;
}

/**
 * Fetches the given page's technical metadata.
 *
 * The technical metadata is pull from the techincal metadata datastream created
 * by islandora_fits.
 *
 * @param FedoraObject $object
 *   The page object.
 *
 * @return array
 *   An associative array containing the following fields.
 *   - width: The width of the image in pixels.
 *   - height: The width of the image in pixels.
 *   If this function fails FALSE is returned.
 */
function islandora_internet_archive_bookreader_get_technical_metadata(FedoraObject $object) {
  $dsid = variable_get('islandora_fits_techmd_dsid', 'TECHMD');
  if (empty($object[$dsid])) {
    return FALSE;
  }
  $metadata = FALSE;
  $file = file_create_filename("{object->id}_{$dsid}.xml", 'temporary://');
  $file = drupal_realpath($file);
  if ($object[$dsid]->getContent($file)) {
    $doc = simplexml_load_file($file);
    $doc->registerXPathNamespace('ns', 'http://hul.harvard.edu/ois/xml/ns/fits/fits_output');
    $width = (int) array_pop($doc->xpath('/ns:fits/ns:metadata/ns:image/ns:imageWidth'));
    $height = (int) array_pop($doc->xpath('/ns:fits/ns:metadata/ns:image/ns:imageHeight'));
    $metadata = array('width' => $width, 'height' => $height);
  }
  file_unmanaged_delete($file);
  return $metadata;
}

/**
 * Fetches the given page's metadata via Djatoka.
 *
 * @param string $object_id
 *   The PID of the page to fetch the metadata from.
 *
 * @return array
 *   An associative array contatining the following string fields:
 *   - identifier: The URL to the resource.
 *   - imagefile: The path to the temp file being served.
 *   - width: The width of the image in pixels.
 *   - height: The width of the image in pixels.
 *   - dwtLevels: ???
 *   - levels: ???
 *   - compositingLayerCount: ???
 *   If the request to Djatoka fails then FALSE is returned.
 */
function islandora_internet_archive_bookreader_get_page_metadata_from_djatoka($object_id) {
  module_load_include('inc', 'islandora', 'includes/authtokens');
  $datastream_url = url("islandora/object/{$object_id}/datastream/JP2/view", array(
    'absolute' => TRUE,
    'query' => array(
      'token' => islandora_get_object_token($object_id, 'JP2'),
    ),
  ));

  $djatoka_url = variable_get('islandora_internet_archive_bookreader_djatoka_url', 'http://localhost:8080/adore-djatoka');
  $djatoka_url .= (substr($djatoka_url, -1) == '/') ? '' : '/';
  $djatoka_url = url($djatoka_url . "resolver", array(
    'query' => array(
      'url_ver' => 'Z39.88-2004',
      'rft_id' => $datastream_url,
      'svc_id' => 'info:lanl-repo/svc/getMetadata',
    ),
    'external' => TRUE,
  ));
  $request = drupal_http_request($djatoka_url);
  if ($request->code == '200') {
    return drupal_json_decode($request->data);
  }
  return FALSE;
}

/**
 * Queries SOLR for all occurrences of the given term within the given book.
 *
 * @param string $object_id
 *   The PID of the book to search within.
 * @param string $term
 *   The term to search within the given book.
 *
 * @return array
 *   The results of the SOLR search.
 */
function islandora_internet_archive_bookreader_query_solr($object_id, $term) {
  $url = islandora_internet_archive_bookreader_get_solr_search_url($object_id, $term);
  $request = drupal_http_request($url);
  if ($request->code == '200') {
    return drupal_json_decode($request->data);
  }
  return array();
}

/**
 * Maps the given SOLR results to BookReader results.
 *
 * Also it generates word coordinates where applicable.
 *
 * @param array $results
 *   The SOLR results to map.
 * @param string $term
 *   The term used to generate the SOLR results.
 *
 * @return array
 *   The results in BookReader format including word coordinates.
 */
function islandora_internet_archive_bookreader_map_solr_results_to_bookreader_results(array $results, $term) {
  module_load_include('inc', 'islandora_internet_archive_bookreader', 'includes/utilities');
  $ocr_field = variable_get('islandora_internet_archive_bookreader_ocr_field', 'OCR.OCR');
  $sequence_field = variable_get('islandora_internet_archive_bookreader_sequence_number', 'rels.isSequenceNumber');
  $output = array('matches' => array());
  foreach ($results['response']['docs'] as $doc) {
    // @todo Index the page width and height in solr, rather than fetch from
    // djatoka
    $pid = $doc['PID'];
    $page_data = islandora_internet_archive_bookreader_get_page_dimensions(islandora_object_load($pid));
    $page = $doc["$sequence_field"][0];
    $highlighting = $results['highlighting'];
    $highlighted_text = $highlighting[$pid][$ocr_field][0];
    $output['matches'][] = array(
      'text' => preg_replace('/[^a-zA-Z0-9-\n {}]/', '', $highlighted_text),
      'par' => array(
        array(
          'page' => intval($page),
          'page_width' => $page_data['width'],
          'page_height' => $page_data['height'],
          'boxes' => islandora_internet_archive_bookreader_populate_boxes($pid, $page, $term),
        ),
      ),
    );
  }
  return $output;
}

/**
 * Gets the SOLR search URL for the given search parameters.
 *
 * @param string $object_id
 *   The PID of the book to search within.
 * @param string $term
 *   The term to search within the given book.
 *
 * @return string
 *   The SOLR search URL that will query for all occurances of the given term
 *   within the given book.
 */
function islandora_internet_archive_bookreader_get_solr_search_url($object_id, $term) {
  module_load_include('inc', 'islandora_solr', 'includes/common');
  $base_url = variable_get('islandora_solr_url', 'localhost:8080/solr') . '/select/';
  $ocr_field = variable_get('islandora_internet_archive_bookreader_ocr_field', 'OCR.OCR');
  $ocr_filter_field = variable_get('islandora_internet_archive_bookreader_ocr_filter_field', 'rels.isMemberOf');
  $sequence_field = variable_get('islandora_internet_archive_bookreader_sequence_number', 'rels.isSequenceNumber');
  $num_rows = variable_get('islandora_internet_archive_bookreader_solr_result_count', 32);
  $url = url($base_url, array(
           'query' => array(
             'q' => implode(':', array($ocr_field, lesser_escape($term))),
             'fq' => implode(':', array($ocr_filter_field, lesser_escape($object_id))),
             'version' => '2.2',
             'start' => '0',
             'rows' => $num_rows,
             'fl' => implode(',', array('PID', $sequence_field)),
             'hl' => 'true',
             'hl.fl' => $ocr_field,
             'hl.snippets' => '200',
             'hl.simple.pre' => '{{{',
             'hl.simple.post' => '}}}',
             'hl.fragsize' => '200',
             'wt' => 'json',
           ),
           'absolute' => TRUE,
           'external' => TRUE,
         ));
  // Seems to be a bug in url(), such that if both external and absolute are
  // given then asbolute is ignored. Here we Default to http if they need https
  // they should set it in the islandora solr config form.
  $url_components = parse_url($url);
  $url = isset($url_components['scheme']) ? $url : 'http://' . $url;
  return $url;
}

/**
 * Get the word coordinates for the given term and page.
 *
 * @param string $pid
 *   The PID of the page object to check.
 * @param string $page
 *   The page index.
 * @param string $terms
 *   The terms to fetch the coordinates for. Terms Seperated by a single space.
 *
 * @return array
 *   The word coordinates for the given term and page.
 */
function islandora_internet_archive_bookreader_populate_boxes($pid, $page, $terms) {
  $object = islandora_object_load($pid);
  if (!isset($object['HOCR'])) {
    return array();
  }
  $file = file_create_filename("{object->id}_HOCR.xml", 'temporary://');
  $file = drupal_realpath($file);
  $object['HOCR']->getContent($file);
  $doc = new DOMDocument('1.0', 'UTF-8');
  $doc->load($file);
  $xpath = new DOMXPath($doc);
  $xpath->registerNamespace("php", "http://php.net/xpath");
  $xpath->registerPhpFunctions();
  $terms = mb_strtolower($terms);
  $terms = urldecode($terms);
  $terms = explode(' ', $terms);
  $boxes = array();
  foreach ($terms as $term) {
    $matches = $xpath->query("//*[php:functionString('mb_strtolower', text()) = '{$term}']");
    foreach ($matches as $match) {
      $bounding_box = islandora_internet_archive_bookreader_get_word_bounding_box($match);
      if ($bounding_box) {
        // Only keep the values the viewer is interested in.
        $box = array_intersect_key($bounding_box, array(
                 'l' => 0,
                 't' => 0,
                 'r' => 0,
                 'b' => 0));
        $box['page'] = $page;
        $boxes[] = $box;
      }
    }
  }
  file_unmanaged_delete($file);
  return $boxes;
}

/**
 * Gets the bounding box for the given element.
 *
 * @param DOMElement $element
 *   The element.
 *
 * @return array
 *   The bounding box for the given element if found, FALSE otherwise.
 *
 * @see islandora_internet_archive_bookreader_get_bounding_box()
 */
function islandora_internet_archive_bookreader_get_word_bounding_box(DOMElement $element) {
  $bounding_box = islandora_internet_archive_bookreader_get_bounding_box($element);
  if ($bounding_box) {
    if ($bounding_box['class'] == 'ocrx_word') {
      return $bounding_box;
    }
    return FALSE;
  }
  if ($element->parentNode) {
    return islandora_internet_archive_bookreader_get_word_bounding_box($element->parentNode);
  }
  return FALSE;
}

/**
 * Gets the bounding box for the given element if defined.
 *
 * @param DOMElement $element
 *   The element.
 *
 * @return array
 *   An associative array as follows:
 *   - id: The id of the given element.
 *   - class: The class of the given element, 'ocrx_word', 'ocr_line', etc.
 *   - l: The left most point of the element in pixels.
 *   - t: The top most point of the element in pixels.
 *   - r: The right most point of the element in pixels.
 *   - b: The bottom most point of the element in pixels.
 *  If the given element doesn't have a bounding box FALSE is returned.
 */
function islandora_internet_archive_bookreader_get_bounding_box(DOMElement $element) {
  if ($element->hasAttribute('title')) {
    // The coordinates are stored in the title attribute in the following
    // format "bbox 539 1210 623 1235"
    $bounding_box = $element->getAttribute('title');
    $coordinates = explode(' ', $bounding_box);
    return array(
      'id' => $element->hasAttribute('id') ? $element->getAttribute('id') : NULL,
      'class' => $element->hasAttribute('class') ? $element->getAttribute('class') : NULL,
      'l' => intval($coordinates[1]),
      't' => intval($coordinates[2]),
      'r' => intval($coordinates[3]),
      'b' => intval($coordinates[4]),
    );
  }
  return FALSE;
}
