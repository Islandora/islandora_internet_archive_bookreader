/**
 * @file
 * IslandoraDjatokaBookReader is derived from the Internet Archive BookReader class.
 */

(function ($) {
    /**
     * Constructor
     */
    IslandoraDjatokaBookReader = function(settings) {
        IslandoraBookReader.call(this, settings);
        this.dimensions = {};
    }

    // Inherit from base Islandora bookreader class
    jQuery.extend(IslandoraDjatokaBookReader.prototype, IslandoraBookReader.prototype);

    /**
     * For a given "accessible page index" return metadata from Djatoka.
     *
     * @param int index
     *   The index of the page.
     *
     * @return object
     *   An object contatining the following string fields:
     *   - width: The width of the image in pixels.
     *   - height: The width of the image in pixels.
     *   If this function fails the values for each field will be 0.
     */
    IslandoraDjatokaBookReader.prototype.getPageDimensions = function(index) {
        var dimensions = { width: 0, height: 0 };
        var page = this.getPage(index);
        if (typeof page != 'undefined') {
            // If we don't have one or the other, make a query out to Djatoka.
            if (typeof page.width == 'undefined' || typeof page.height == 'undefined') {
                var pid = page.pid;
                if (typeof pid == 'undefined') {
                    return dimensions;
                }
                var url = this.getDimensionsUri(pid);
                jQuery.ajax({
                    url: url,
                    dataType: 'json',
                    success: function(data, textStatus, jqXHR) {
                        dimensions.width = parseInt(data.width);
                        dimensions.height = parseInt(data.height);
                    },
                    async: false
                });
            }
            else {
                dimensions.width = parseInt(page.width);
                dimensions.height = parseInt(page.height);
            }
        }

        return dimensions;
    }

    /**
     * Gets the width of the given page.
     *
     * @param int index
     *   The index of the page.
     *
     * @return int
     *   The width in pixels of the given page.
     */
    IslandoraDjatokaBookReader.prototype.getPageWidth = function(index) {
        if (typeof this.dimensions[index] == 'undefined') {
            this.dimensions[index] = this.getPageDimensions(index);
        }
        return this.dimensions[index].width;
    }

    /**
     * Gets the height of the given page.
     *
     * @param int index
     *   The index of the page.
     *
     * @return int
     *   The height in pixels of the given page.
     */
    IslandoraDjatokaBookReader.prototype.getPageHeight = function(index) {
        if (typeof this.dimensions[index] == 'undefined') {
            this.dimensions[index] = this.getPageDimensions(index);
        }
        return this.dimensions[index].height;
    }

    /**
     * Gets the Djatoka URI.
     *
     * @param string resource_uri
     *   The uri to the image Djatoka will use.
     *
     * @return string
     *   The Djatoka URI for the given resource URI.
     */
    IslandoraDjatokaBookReader.prototype.getDjatokaUri = function(resource_uri) {
        var base_uri = this.settings.djatokaUri;
        //Do some sanitation on that base uri.
        //Since it comes from an admin form, let's make sure there's a '/' at the
        //end of it.
        var params = $.param({
            'rft_id': resource_uri,
            'url_ver': 'Z39.88-2004',
            'svc_id': 'info:lanl-repo/svc/getRegion',
            'svc_val_fmt': 'info:ofi/fmt:kev:mtx:jpeg2000',
            'svc.format': 'image/jpeg',
            'svc.level': this.settings.compression,
            'svc.rotate': 0
        });
        return (base_uri + '?' + params);
    };

    /**
     * Gets the URI to the dimensions callback for the given page.
     *
     * @param string pid
     *   The id of the object containing the resource.
     *
     * @return string
     *   The Dimensions URI of the callback, to be used to fetch the pages
     *   dimension.
     */
    IslandoraDjatokaBookReader.prototype.getDimensionsUri = function(pid) {
        var uri = this.settings.dimensionsUri;
        uri = uri.replace('PID', pid);
        return uri;
    };

    /**
     * Gets URI to the given page resource.
     *
     * @param int index
     *   The index of the page.
     *
     * @return string
     *   The URI
     */
    IslandoraDjatokaBookReader.prototype.getPageURI = function(index, reduce, rotate) {
        if (typeof this.settings.pages[index] != 'undefined') {
            // Using backups? Get the image URI via callback and determine whether to
            // Djatoka-ize it.
            if (this.settings.useBackupUri == true) {
                var callback_uri = null;
                $.ajax({
                    url: this.settings.tokenUri.replace('PID', this.settings.pages[index].pid),
                    async: false,
                    success: function(data, textStatus, jqXHR) {
                        callback_uri = data;
                    }
                });
                if (callback_uri.indexOf("datastream/JP2/view") != -1) {
                    return this.getDjatokaUri(callback_uri);
                }
                return callback_uri;
            }
            // Not using backups? Just Djatoka-ize the page's image URI.
            else {
                return this.getDjatokaUri(this.settings.pages[index].uri);
            }
        }
    }
})(jQuery);
