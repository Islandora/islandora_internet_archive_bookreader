/**
 * @file
 * Defines initializing/attaching the Book Reader to the
 * defined element.
 */

// noConflict is here to allow for compatibility between jQuery 1.5 and jquery 1.7.
// JS loaded prior to this point in the bookreader requires jQuery 1.5, and further
// execution requires jQuery 1.7 or higher.
// TODO: Figure out what library is the culprit.
Drupal.settings.islandoraInternetArchiveBookReader_jQuery = jQuery.noConflict(true);
(function ($) {
  Drupal.behaviors.islandoraInternetArchiveBookReader = {
    attach: function(context, settings) {
      $('.islandora-internet-archive-bookreader', context).once('islandora-bookreader', function () {
        var bookReader = null;
        if (settings.islandoraInternetArchiveBookReader.pageSource === 'djatoka') {
          bookReader = new IslandoraDjatokaBookReader(settings.islandoraInternetArchiveBookReader);
        }
        else if (settings.islandoraInternetArchiveBookReader.pageSource === 'iiif') {
          bookReader = new IslandoraIiifBookReader(settings.islandoraInternetArchiveBookReader);
        }
        // Initialize and Render the BookReader.
        bookReader.init();
        // Handle page resize, required for full screen.
        $(window).resize(function() {
          bookReader.windowResize();
        });
        // We currently don't support read-aloud.
        $('#BRtoolbar').find('.read').hide();
        if (!bookReader.searchEnabled()) {
          $('#textSrch').hide();
          $('#btnSrch').hide();
        }
        // Add class 'aria-label' for accessibility support for screen readers.
        $('.ui-slider-handle').each(function(e){
          $(this).attr('aria-label', Drupal.t("Book Slider Handle"));
        });
        if ($.browser.mobile && settings.islandoraInternetArchiveBookReader.mobilize) {
          bookReader.goFullScreen();
        }
        else if (settings.islandoraInternetArchiveBookReader.mode) {
          bookReader.switchMode(settings.islandoraInternetArchiveBookReader.mode);
        }
      });
    }
  };
})(jQuery);
