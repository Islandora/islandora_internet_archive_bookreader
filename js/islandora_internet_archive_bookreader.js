/**
 * @file
 * Defines initializing/attaching the Book Reader to the
 * defined element.
 */

(function ($) {
  Drupal.behaviors.islandoraInternetArchiveBookReader = {
    attach: function(context, settings) {
      $('.islandora-internet-archive-bookreader', context).once('islandora-bookreader', function () {

        var pluginRegistry = {
          'djatoka' : (typeof IslandoraDjatokaBookReader === "undefined") ? null : IslandoraDjatokaBookReader,
          'iiif' : (typeof IslandoraIiifBookReader === "undefined") ? null : IslandoraIiifBookReader
        };

        var getPlugin = function(Cls) {
          return new (Function.prototype.bind.apply(Cls, arguments));
        };

        var plugin = getPlugin(pluginRegistry[settings.islandoraInternetArchiveBookReader.pageSource], settings.islandoraInternetArchiveBookReader)
        // Initialize and Render the BookReader.
        plugin.init();
      });
    }
  };
})(jQuery);
