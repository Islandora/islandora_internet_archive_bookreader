/**
 * @file
 * IslandoraBookReader is derived from the Internet Archive BookReader class.
 */

/**
 * Constructor
 */
function IslandoraBookReader(settings) {
  BookReader.call(this);
  this.settings = settings;
  this.dimensions = {};
  this.numLeafs = settings.pageCount;
  this.bookTitle = settings.label.substring(0,97) + '...';
  this.bookUrl = document.location.toString();
  this.imagesBaseURL = settings.imagesFolderUri;
  this.logoURL = '';
}

(function ($) {
  // Inherit from Internet Archive BookReader class.
  jQuery.extend(IslandoraBookReader.prototype, BookReader.prototype);

  /**
   * For a given "accessible page index" return the page number in the book.
   *
   * For example, index 5 might correspond to "Page 1" if there is front matter such
   * as a title page and table of contents.
   * for now we just show the image number
   *
   * @param int index
   *   The index of the page.
   */
  IslandoraBookReader.prototype.getPageNum = function(index) {
    return index + 1;
  }

  /**
   * Gets the index for the given leaf number.
   *
   * @param int leafNum
   *   The leaf number.
   *
   * @return int
   *   The index of the given leaf number.
   */
  IslandoraBookReader.prototype.leafNumToIndex = function(leafNum) {
    return leafNum-1;
  }

  /**
   * For a given "accessible page index" return the PID of that page.
   *
   * @param int index
   *   The index of the page.
   *
   * @return string
   *   The PID the given page repersents.
   */
  IslandoraBookReader.prototype.getPID = function(index) {
    return this.settings.pages[index];
  }

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
  IslandoraBookReader.prototype.getPageDimensions = function(index) {
    var dimensions = { width: 0, height: 0 };
    var pid = this.getPID(index);
    if(typeof pid == 'undefined') {
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
      async: false,
    });
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
  IslandoraBookReader.prototype.getPageWidth = function(index) {
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
  IslandoraBookReader.prototype.getPageHeight = function(index) {
    if (typeof this.dimensions[index] == 'undefined') {
      this.dimensions[index] = this.getPageDimensions(index);
    }
    return this.dimensions[index].height;
  }

  /**
   * Checks to see if search is enabled.
   *
   * @return boolean
   *   true if search is enabled false otherwise.
   */
  IslandoraBookReader.prototype.searchEnabled = function() {
    return this.settings.searchUri != null;
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
  IslandoraBookReader.prototype.getDjatokaUri = function(resource_uri) {
    var base_uri = this.settings.djatokaUri;
    var params = $.param({
      'rft_id': resource_uri,
      'url_ver': 'Z39.88-2004',
      'svc_id': 'info:lanl-repo/svc/getRegion',
      'svc_val_fmt': 'info:ofi/fmt:kev:mtx:jpeg2000',
      'svc.format': 'image/png',
      'svc.level': this.settings.compression,
      'svc.rotate': 0,
    });
    return (base_uri + 'resolver?' + params);
  };

  /**
   * Gets the URI to the given objects resource.
   *
   * @param string pid
   *   The id of the object containing the resource.
   *
   * @return string
   *   The Resource URI of the image, to be displayed in the
   *   viewer.
   */
  IslandoraBookReader.prototype.getResourceUri = function(pid) {
    var uri = this.settings.resourceUri;
    uri = uri.replace('PID', pid);
    return uri;
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
  IslandoraBookReader.prototype.getDimensionsUri = function(pid) {
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
  IslandoraBookReader.prototype.getPageURI = function(index, reduce, rotate) {
    var pid = this.getPID(index);
    var resource_uri = this.getResourceUri(pid);
    return this.getDjatokaUri(resource_uri);
  }

  /**
   * Get the URI to the text content for the given page object.
   * This content will be displayed in the full text modal dialog box.
   *
   * @param string pid
   *   The page object to fetch the text content from.
   *
   * @return string
   *   The URI
   */
  IslandoraBookReader.prototype.getTextURI = function (pid) {
    return this.settings.textUri.replace('PID', pid);
  }

  /**
   * Return which side, left or right, that a given page should be
   * displayed on.
   */
  IslandoraBookReader.prototype.getPageSide = function(index) {
    return this.settings.pageProgression.toUpperCase()[index & 0x1];
  }

  /**
   * This function returns the left and right indices for the user-visible
   * spread that contains the given index.  The return values may be
   * null if there is no facing page or the index is invalid.
   */
  IslandoraBookReader.prototype.getSpreadIndices = function(pindex) {
    var spreadIndices = [null, null];
    if ('rl' == this.pageProgression) {
      // Right to Left
      if (this.getPageSide(pindex) == 'R') {
        spreadIndices[1] = pindex;
        spreadIndices[0] = pindex + 1;
      }
      else {
        // Given index was LHS
        spreadIndices[0] = pindex;
        spreadIndices[1] = pindex - 1;
      }
    }
    else {
      // Left to right
      if (this.getPageSide(pindex) == 'L') {
        spreadIndices[0] = pindex;
        spreadIndices[1] = pindex + 1;
      }
      else {
        // Given index was RHS
        spreadIndices[1] = pindex;
        spreadIndices[0] = pindex - 1;
      }
    }
    return spreadIndices;
  }

  /**
   * Search SOLR for the given term.
   */
  IslandoraBookReader.prototype.search = function(term) {
    var url = this.settings.searchUri.replace('TERM', encodeURI(term));
    term = term.replace(/\//g, ' '); // strip slashes, since this goes in the url
    this.searchTerm = term;
    this.removeSearchResults();
    this.showProgressPopup('<img id="searchmarker" src="'+ this.imagesBaseURL + 'marker_srch-on.png'+'"> Search results will appear below...');
    var that = this;
    $.ajax({url:url, dataType:'json',
            success: function(data, status, xhr) {
              that.BRSearchCallback(data);
            },
            error: function() {
              alert("Search call to " + url + " failed");
            }
           });
  }

  /**
   * Display the Search Progress
   */
  IslandoraBookReader.prototype.showProgressPopup = function(msg) {
    if (this.popup) return;
    this.popup = document.createElement("div");
    $(this.popup).css({
        top:      '-' + ($('#BookReader').height()*0.5) + 'px',
    }).attr('className', 'BRprogresspopup');
    var bar = document.createElement("div");
    $(bar).css({
        height:   '20px'
    }).attr('className', 'BRprogressbar');
    $(this.popup).append(bar);
    if (msg) {
        var msgdiv = document.createElement("div");
        msgdiv.innerHTML = msg;
        $(this.popup).append(msgdiv);
    }
    $(this.popup).appendTo('#BookReader');
  }

  /**
   * Search callback, displays results.
   */
  IslandoraBookReader.prototype.BRSearchCallback = function(results) {
    this.removeSearchResults();
    this.searchResults = results;
    if (0 == results.matches.length) {
      var errStr  = 'No matches were found.';
      var timeout = 1000;
      if (false === results.indexed) {
        errStr  = "<p>This book hasn't been indexed for searching yet. We've just started indexing it, so search should be available soon. Please try again later. Thanks!</p>";
        timeout = 5000;
      }
      $(this.popup).html(errStr);
      var that = this;
      setTimeout(function(){
        $(that.popup).fadeOut('slow', function() {
          that.removeProgressPopup();
        })
      },timeout);
      return;
    }
    var i;
    for (i=0; i<results.matches.length; i++) {
      this.addSearchResult(results.matches[i].text, this.leafNumToIndex(results.matches[i].par[0].page));
    }
    this.updateSearchHilites();
    this.removeProgressPopup();
  }

  /**
   * Embed code is not supported at the moment.
   */
  IslandoraBookReader.prototype.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
    return Drupal.t("Embed code not currently supported.");
  }

  /**
   * Intialized the strings in the interface.
   *
   * @todo Translate these strings.
   */
  IslandoraBookReader.prototype.initUIStrings = function() {
    // Navigation handlers will be bound after all UI is in place -- makes moving icons between
    // the toolbar and nav bar easier
    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org', // $$$ update after getting OL record
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.onepg': 'One-page view',
                   '.twopg': 'Two-page view',
                   '.thumb': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed BookReader',
                   '.link': 'Link to this book (and page)',
                   '.bookmark': 'Bookmark this page',
                   '.read': 'Read this book aloud',
                   '.share': 'Share this book',
                   '.info': 'Info',
                   '.full': 'Show fullscreen',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.BOOKREADERdn': 'Show/hide nav bar',
                   '.BOOKREADERup': 'Show/hide nav bar',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page',
                   '.full_text' : 'Full Text'
                 };
    if ('rl' == this.pageProgression) {
      titles['.book_leftmost'] = 'Last page';
      titles['.book_rightmost'] = 'First page';
      titles['.book_left'] = 'Next Page';
      titles['.book_right'] = 'Previous Page';
    } else { // LTR
      titles['.book_leftmost'] = 'First page';
      titles['.book_rightmost'] = 'Last page';
      titles['.book_left'] = 'Previous Page';
      titles['.book_right'] = 'Next Page';
    }
    for (var icon in titles) {
      if (titles.hasOwnProperty(icon)) {
        $('#BookReader').find(icon).attr('title', titles[icon]);
      }
    }
  }

  /**
   * Override the default toolbar, mostly the same but some icons such as
   * full text are added.
   */
  IslandoraBookReader.prototype.initToolbar = function(mode, ui) {
    if (ui == "embed") {
      return; // No toolbar at top in embed mode
    }
    var readIcon = '';
    if (!navigator.userAgent.match(/mobile/i)) {
      readIcon = "<button class='BRicon read modal'></button>";
    }

    $("#BookReader").append(
      "<div id='BRtoolbar'>"
        +   "<span id='BRtoolbarbuttons'>"
        +     "<form  id='booksearch'><input type='search' id='textSrch' name='textSrch' val='' placeholder='Search inside'/><button type='submit' id='btnSrch' name='btnSrch'>GO</button></form>"
        +     "<button class='BRicon play'></button>"
        +     "<button class='BRicon pause'></button>"
        +     "<button class='BRicon info'></button>"
        +     "<button class='BRicon full_text'></buttion>"
        // @todo Fix full screen mode.
        //+     "<button class='BRicon full'></button>"
        +     "<button class='BRicon share'></button>"
        +     readIcon
        +   "</span>"
        +   "<span><a class='logo' href='" + this.logoURL + "'></a></span>"
        +   "<span id='BRreturn'><a></a></span>"
        +   "<div id='BRnavCntlTop' class='BRnabrbuvCntl'></div>"
        + "</div>"
    );
    // Attach submit handler to form.
    var that = this;
    $('#BRtoolbarbuttons > form').submit(function(event) {
      event.preventDefault();
      that.search($('#textSrch').val());
      return false;
    });

    // Browser hack - bug with colorbox on iOS 3 see https://bugs.launchpad.net/bookreader/+bug/686220
    if ( navigator.userAgent.match(/ipad/i) && $.browser.webkit && (parseInt($.browser.version, 10) <= 531) ) {
      $('#BRtoolbarbuttons .info').hide();
      $('#BRtoolbarbuttons .share').hide();
    }

    $('#BRreturn a').attr('href', this.bookUrl).text(this.bookTitle);

    $('#BRtoolbar .BRnavCntl').addClass('BRup');
    $('#BRtoolbar .pause').hide();

    this.updateToolbarZoom(this.reduce); // Pretty format

    if (ui == "embed" || ui == "touch") {
      $("#BookReader a.logo").attr("target","_blank");
    }

    // $$$ turn this into a member variable
    var jToolbar = $('#BRtoolbar'); // j prefix indicates jQuery object

    // We build in mode 2
    jToolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
      jToolbar.find('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
      jToolbar.find('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if ( !(this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
      jToolbar.find('.one_page_mode').hide();
    }

    // $$$ Don't hardcode ids
    var self = this;
    jToolbar.find('.share').colorbox({inline: true, opacity: "0.5", href: "#BRshare", onLoad: function() { self.autoStop(); self.ttsStop(); } });
    jToolbar.find('.info').colorbox({inline: true, opacity: "0.5", href: "#BRinfo", onLoad: function() { self.autoStop(); self.ttsStop(); } });
    jToolbar.find('.full_text').colorbox({inline: true, opacity: "0.5", href: "#BRfulltext",
      onLoad: function() {
        self.autoStop(); self.ttsStop();
        self.buildFullTextDiv($('#BRfulltext'));
      }
    });
    $('<div style="display: none;"></div>').append(this.blankShareDiv()).append(this.blankInfoDiv()).append(this.blankFullTextDiv()).appendTo($('body'));
    $('#BRinfo .BRfloatTitle a').attr( {'href': this.bookUrl} ).text(this.bookTitle).addClass('title');
    this.buildInfoDiv($('#BRinfo'));
    this.buildShareDiv($('#BRshare'));
  }

  /**
   * The default look of the "Info" modal dialog box.
   */
  IslandoraBookReader.prototype.blankInfoDiv = function() {
    return $([
      '<div class="BRfloat" id="BRinfo">',
            '<div class="BRfloatHead">About this book',
                '<a class="floatShut" href="javascript:;" onclick="jQuery.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
      '</div>'].join('\n'));
  }

  /**
   * The default look of the "Full Text" modal dialog box.
   */
  IslandoraBookReader.prototype.blankFullTextDiv = function() {
     return $([
        '<div class="BRfloat" id="BRfulltext">',
            '<div class="BRfloatHead">Text View',
                '<a class="floatShut" href="javascript:;" onclick="jQuery.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
            '<div class="BRfloatMeta">',
            '</div>',
            '</div>',
        '</div>'].join('\n')
    );
  }

  /**
   * The default look of the "Share" modal dialog box.
   */
  IslandoraBookReader.prototype.blankShareDiv = function() {
    return $([
      '<div class="BRfloat" id="BRshare">',
            '<div class="BRfloatHead">',
                'Share',
                '<a class="floatShut" href="javascript:;" onclick="jQuery.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
      '</div>'].join('\n'));
  }

  /**
   * Appends content onto the "Info" module dialog box.
   */
  IslandoraBookReader.prototype.buildInfoDiv = function(jInfoDiv) {
    $(this.settings.info).appendTo(jInfoDiv);
  }

  /**
   * Appends content onto the "Share" module dialog box.
   */
  IslandoraBookReader.prototype.buildShareDiv = function(jShareDiv) {
    var pageView = document.location + '';
    var bookView = (pageView + '').replace(/#.*/,'');
    var self = this;
    var jForm = $([
        '<p>Copy and paste one of these options to share this book elsewhere.</p>',
        '<form method="post" action="">',
            '<fieldset>',
                '<label for="pageview">Link to this page view:</label>',
                '<input type="text" name="pageview" id="pageview" value="' + pageView + '"/>',
            '</fieldset>',
            '<fieldset>',
                '<label for="booklink">Link to the book:</label>',
                '<input type="text" name="booklink" id="booklink" value="' + bookView + '"/>',
            '</fieldset>',
            '<fieldset class="center">',
                '<button type="button" onclick="jQuery.fn.colorbox.close();">Finished</button>',
            '</fieldset>',
        '</form>'].join('\n'));

    jForm.appendTo(jShareDiv);

    jForm.find('input').bind('change', function() {
        var form = $(this).parents('form:first');
        var params = {};
        params.mode = $(form.find('input[name=pages]:checked')).val();
        if (form.find('input[name=thispage]').attr('checked')) {
            params.page = self.getPageNum(self.currentIndex());
        }

        // $$$ changeable width/height to be added to share UI
        var frameWidth = "480px";
        var frameHeight = "430px";
        form.find('.BRframeEmbed').val(self.getEmbedCode(frameWidth, frameHeight, params));
    })
    jForm.find('input[name=thispage]').trigger('change');
    jForm.find('input, textarea').bind('focus', function() {
      this.select();
    });
    jForm.appendTo(jShareDiv);
    jForm = ''; // closure
  }

  /**
   * Appends content onto the "FullText" module dialog box.
   */
  IslandoraBookReader.prototype.buildFullTextDiv = function(jFullTextDiv) {
    jFullTextDiv.find('.BRfloatMeta').height(600);
    jFullTextDiv.find('.BRfloatMeta').width(600);
    if (1 == this.mode) {
      var index = this.currentIndex();
      var pid = this.getPID(index);
      $.get(this.getTextURI(pid),
            function(data) {
              jFullTextDiv.find('.BRfloatMeta').html(data);
            });
    } else if (3 == this.mode) {
      jFullTextDiv.find('.BRfloatMeta').html('<div>Full text not supported for this view.</div>');
    } else {
      var twoPageText = $([
      '<div class="textTop">',
         '<div class="textLeft"></div>',
         '<div class="textRight"></div>',
      '</div>'].join('\n'));
      jFullTextDiv.find('.BRfloatMeta').html(twoPageText);
      var indices = this.getSpreadIndices(this.currentIndex());
      var left_pid = this.getPID(indices[0]);
      var right_pid = this.getPID(indices[1]);
      if(left_pid) {
        $.get(this.getTextURI(left_pid),
              function(data) {
                jFullTextDiv.find('.textLeft').html(data);
              });
      }
      if(right_pid) {
        $.get(this.getTextURI(right_pid),
              function(data) {
                jFullTextDiv.find('.textRight').html(data);
              });
      }
    }
  }

  /**
   * This call back bind's handlers to various controls in the viewer. Performs
   * the default behaviour and add an additional navigation handler that hides
   * the viewer's toolbars, but otherwise allows tooltips to appear outside the
   * interface.
   */
  IslandoraBookReader.prototype.bindNavigationHandlers = function() {
    BookReader.prototype.bindNavigationHandlers.apply(this);
    $('.BRnavCntl').click(function(){
      if ($('#BRnavCntlBtm').hasClass('BRdn')) {
        $('#BookReader').css('overflow', 'visible');
      }
      else {
        $('#BookReader').css('overflow', 'hidden');
      }
    });
  }

  /**
   * Update the location hash only change it when it actually changes, as some
   * browsers can't handle that shit.
   */
  IslandoraBookReader.prototype.updateLocationHash = function() {
    var newHash = this.fragmentFromParams(this.paramsFromCurrent());
    if (this.oldLocationHash != newHash) {
      window.location.hash = newHash;
    }
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
  }

})(jQuery);
