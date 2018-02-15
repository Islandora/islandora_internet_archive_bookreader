/**
 * @file
 * IslandoraIiifBookReader is derived from the Internet Archive BookReader class.
 */

(function ($) {
    /**
     * Constructor
     */
    IslandoraIiifBookReader = function(settings) {
        IslandoraBookReader.call(this, settings);
        this.dimensions = {};
        if (settings.tokenHeader === true) {
            this.loadWithAjax = true;
        }
    };

    // Inherit from base Islandora bookreader class.
    IslandoraIiifBookReader.prototype =  Object.create(IslandoraBookReader.prototype);
    IslandoraIiifBookReader.prototype.constructor = IslandoraIiifBookReader;
    /**
     * For a given "accessible page index" return metadata from Djatoka.
     *
     * @param index
     *   The index of the page.
     *
     * @return object
     *   An object containing the following string fields:
     *   - width: The width of the image in pixels.
     *   - height: The width of the image in pixels.
     *   If this function fails the values for each field will be 0.
     */
    IslandoraIiifBookReader.prototype.getPageDimensions = function(index) {
        var dimensions = { width: 0, height: 0 };
        var page = this.getPage(index);

        if (typeof page !== 'undefined') {
            if (typeof page.width !== 'undefined' && typeof page.height !== 'undefined') {
                dimensions.width = parseInt(page.width);
                dimensions.height = parseInt(page.height);
            }
            else if (typeof page.identifier !== 'undefined') {
                var url = this.settings.iiifUri + '/' + page.identifier + '/info.json';
                jQuery.ajax({
                    url: url,
                    dataType: 'json',
                    success: function(data, textStatus, jqXHR) {
                        dimensions.width = data.width;
                        dimensions.height = data.height;
                    },
                    async: false
                });
            }
        }

        return dimensions;
    };

    /**
     * Gets the width of the given page.
     *
     * @param index
     *   The index of the page.
     *
     * @return int
     *   The width in pixels of the given page.
     */
    IslandoraIiifBookReader.prototype.getPageWidth = function(index) {
        if (typeof this.dimensions[index] === 'undefined') {
            this.dimensions[index] = this.getPageDimensions(index);
        }
        return this.dimensions[index].width;
    };

    /**
     * Gets the height of the given page.
     *
     * @param index
     *   The index of the page.
     *
     * @return int
     *   The height in pixels of the given page.
     */
    IslandoraIiifBookReader.prototype.getPageHeight = function(index) {
        if (typeof this.dimensions[index] === 'undefined') {
            this.dimensions[index] = this.getPageDimensions(index);
        }
        return this.dimensions[index].height;
    };

    /**
     * Gets URI to the given page resource.
     *
     * @param index
     *   The index of the page.
     * @param reduce
     *   The factor by which the image should be reduced
     * @param rotate
     *   The amount the image should be rotated.
     *
     * @return string
     *   The URI
     */
    IslandoraIiifBookReader.prototype.getPageURI = function(index, reduce, rotate) {
        if (typeof(reduce) === 'undefined') {
            reduce = 1;
        }
        if (typeof(rotate) === 'undefined') {
            rotate = 0;
        }

        var page = this.getPage(index);
        if (typeof page !== 'undefined' && typeof page.identifier !== 'undefined') {
            return this.settings.iiifUri + '/' + page.identifier + '/full/pct:' + (1.0 / reduce * 100).toFixed(0) + '/' + rotate + '/default.jpg';
        }
    };

    /**
     * Gets the correct headers for the page.
     *
     * @param index
     *   The index of the page.
     *
     * @return object
     *   String -> String mapping of headers
     */
    IslandoraIiifBookReader.prototype.getAjaxHeaders = function(index) {
        var page = this.getPage(index);
        if (this.settings.tokenHeader === true && this.loadWithAjax === true) {
            if (typeof(page) !== 'undefined' && typeof(page.token) !== 'undefined') {
                return {'X-ISLANDORA-TOKEN' : page.token};
            }
        }
        return {};
    };
})(jQuery);
