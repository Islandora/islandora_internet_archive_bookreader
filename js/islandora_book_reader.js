/**
 * @file
 * IslandoraBookReader is derived from the Internet Archive BookReader class.
 */

(function ($) {

  /**
   * Constructor
   */
  IslandoraBookReader = function(settings) {
    BookReader.call(this);
    this.settings = settings;
    this.numLeafs = settings.pageCount;
    this.bookTitle = settings.label.substring(0,97) + '...';
    this.bookUrl = document.location.toString();
    this.imagesBaseURL = settings.imagesFolderUri;
    this.logoURL = '';
    this.mode = settings.mode;
    this.fullscreen = false;
    this.content_type = settings.content_type;
    this.pageProgression = settings.pageProgression;
    this.hasCover = settings.hasCover;
  }

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
    return leafNum - 1;
  }

  /**
   * Get the structure for the given page.
   */
  IslandoraBookReader.prototype.getPage = function(index) {
    if (typeof this.settings.pages[index] != 'undefined') {
      return this.settings.pages[index];
    }
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
    var page = this.getPage(index);
    if (typeof page != 'undefined') {
      return page.pid;
    }
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
 *
 * Overrided here to enable fullscreen button, maybe a better metod to do it
 *
 * This method builds the html for the toolbar. It can be decorated to extend
 * the toolbar.
 * @return {jqueryElement}
 */
  IslandoraBookReader.prototype.buildToolbarElement = function() {
  // $$$mang should be contained within the BookReader div instead of body
  var readIcon = '';
  if (this.isSoundManagerSupported) {
      readIcon = "<button class='BRicon read modal js-tooltip'></button>";
  }

  var escapedTitle = BookReader.util.escapeHTML(this.bookTitle);

  var mobileClass = '';
  if (this.enableMobileNav) {
    mobileClass = 'responsive';
  }

  var desktopSearchHtml = '';
  if (this.enableSearch) {
      desktopSearchHtml = "<span class='BRtoolbarSection BRtoolbarSectionSearch tc ph20 last'>"
      +         "<form class='booksearch desktop'>"
      +           "<input type='search' class='textSrch form-control' name='textSrch' val='' placeholder='Search inside this book'/>"
      +           "<button type='submit' id='btnSrch' name='btnSrch'>"
      +              "<img src=\""+this.imagesBaseURL+"icon_search_button.svg\" />"
      +           "</button>"
      +         "</form>"
      +       "</span>";
  }

  // Add large screen navigation
  return $(
    "<div id='BRtoolbar' class='header fixed "+mobileClass+"'>"
    +   "<span class='BRmobileHamburgerWrapper'>"
    +     "<span class=\"hamburger\"><a href=\"#BRmobileMenu\"></a></span>"
    +     "<span class=\"BRtoolbarMobileTitle\" title=\""+escapedTitle+"\">" + this.bookTitle + "</span>"
    +   "</span>"
    +   "<span id='BRtoolbarbuttons' >"
    +     "<span class='BRtoolbarLeft'>"
    +       "<span class='BRtoolbarSection BRtoolbarSectionLogo tc'>"
    +         "<a class='logo' href='" + this.logoURL + "'></a>"
    +       "</span>"

    +       "<span class='BRtoolbarSection BRtoolbarSectionTitle title tl ph10 last'>"
    +           "<span id='BRreturn'><a></a></span>"
    +           "<div id='BRnavCntlTop' class='BRnabrbuvCntl'></div>"
    +       "</span>"
    +    "</span>"

    +     "<span class='BRtoolbarRight'>"

    +       "<span class='BRtoolbarSection tc ph10'>"
    +         "<button class='BRicon full_text js-tooltip'></button>"
    +       "</span>"	  
	  
    +       "<span class='BRtoolbarSection BRtoolbarSectionInfo tc ph10'>"
    +         "<button class='BRicon info js-tooltip'></button>"
    +         "<button class='BRicon share js-tooltip'></button>"
    +         readIcon
    +       "</span>"

    // zoom
    +       "<span class='BRtoolbarSection BRtoolbarSectionZoom tc ph10'>"
    +         "<button class='BRicon zoom_out js-tooltip'></button>"
    +         "<button class='BRicon zoom_in js-tooltip'></button>"
    +       "</span>"

    // Search
    + desktopSearchHtml

    // enable fullscreen button
    +     "<button class='BRicon full'></button>"

    +     "</span>" // end BRtoolbarRight

    +   "</span>" // end desktop-only

    + "</div>"
    /*
    + "<div id='BRzoomer'>"
    +   "<div id='BRzoompos'>"
    +     "<button class='BRicon zoom_out'></button>"
    +     "<div id='BRzoomcontrol'>"
    +       "<div id='BRzoomstrip'></div>"
    +       "<div id='BRzoombtn'></div>"
    +     "</div>"
    +     "<button class='BRicon zoom_in'></button>"
    +   "</div>"
    + "</div>"
    */
    );
}
  
  /**
   * Islandora version of initToolbar function
   *
   * Only exists until IAbookreader fixes a wrong context
   *
   * @param string mode
   *   The way we are paging, 1up, 2up, etc.
   *
   * @return string ui
   *   If we are on full UI mode, etc.
   */
  IslandoraBookReader.prototype.initToolbar = function(mode, ui) {
      if (ui == "embed") {
          return; // No toolbar at top in embed mode
      }
      var self = this;

      $("#BookReader").append(this.buildToolbarElement());

      // Add Mobile navigation
      // ------------------------------------------------------
      if (this.enableMobileNav) {
        $("body").append(this.buildMobileDrawerElement());

        // Render info into mobile info before mmenu
        this.buildInfoDiv($('#mobileInfo'));
        this.buildShareDiv($('#mobileShare'));

        var $mmenuEl = $('nav#BRmobileMenu');
        $mmenuEl.mmenu({
            navbars: [
               { "position": "top" },
            ],
            navbar: {
              add: true,
              title: this.mobileNavTitle,
              titleLink: 'panel'
            },
            extensions: [ "panelshadow" ],
         }, {
            offCanvas: {
              wrapPageIfNeeded: false,
              zposition: 'next',
              pageSelector: '#BookReader',
            }
        });

        var $BRpageviewField = $mmenuEl.find('.BRpageviewValue');
        $mmenuEl.data('mmenu').bind('opened', function() {
            // Update "Link to this page view" link
            if ($BRpageviewField.length) $BRpageviewField.val(window.location.href);
        });
        this.mmenu = $mmenuEl;
      }

      //--------------------------------------------------------


      $('#BRreturn a')
        .addClass('BRTitleLink')
        .attr({'href': self.bookUrl, 'title': self.bookTitle})
        .html('<span class="BRreturnTitle">' + this.bookTitle + '</span>')
        ;

      if (self.bookUrl && self.bookUrlTitle && self.bookUrlText) {
        $('#BRreturn a').append('<br>' + self.bookUrlText)
      }


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
      if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
          jToolbar.find('.one_page_mode').hide();
      }

      // $$$ Don't hardcode ids
      jToolbar.find('.share').colorbox({
          inline: true,
          opacity: "0.5",
          href: "#BRshare",
          onLoad: function() {
              self.autoStop();
              self.ttsStop();
              $('.BRpageviewValue').val(window.location.href);
          }
      });
      	jToolbar.find('.full_text').colorbox({inline: true, opacity: "0.5", href: "#BRfulltext", onLoad: function() {
		self.autoStop(); self.ttsStop();
		self.buildFulltextDiv($('#BRfulltext')); 
	} });	  
      jToolbar.find('.info').colorbox({inline: true,  maxWidth:"80%", maxHeight:"80%", opacity: "0.5", href: "#BRinfo", onLoad: function() { self.autoStop(); self.ttsStop(); } });
      jToolbar.find('.full').bind('click', function() {
        self.toggleFullScreen();
      });
      $(window).keyup(function(e) {
        if(e.keyCode == 27 && self.fullscreen) {
          self.toggleFullScreen();
        }
      });
      $('<div style="display: none;"></div>').append(
        this.blankShareDiv()
      ).append(
        this.blankInfoDiv()
      ).append(
        this.blankFulltextDiv()	      
      ).appendTo($('body'));

      $('#BRinfo .BRfloatTitle a').attr( {'href': this.bookUrl} ).text(this.bookTitle).addClass('title');

      // These functions can be overridden
      this.buildInfoDiv($('#BRinfo'));
      this.buildShareDiv($('#BRshare'));

      // High contrast button
      $('.high-contrast-button').click(function() {
        $('body').toggleClass('high-contrast');
      });

      // Bind mobile switch buttons
      $('.DrawerLayoutButton.one_page_mode').click(function() {
        self.switchMode(self.constMode1up);
      });
      $('.DrawerLayoutButton.two_page_mode').click(function() {
        self.switchMode(self.constMode2up);
      });
      $('.DrawerLayoutButton.thumbnail_mode').click(function() {
        self.switchMode(self.constModeThumb);
      });
      
	  // This tiny little line is the whole reason i had to reimplement this method.
	  var br = this;

      // Bind search form
      if (this.enableSearch) {
          $('.booksearch.desktop').submit(function(e) {
              e.preventDefault();
              var val = $(this).find('.textSrch').val();
              if (!val.length) return false;
              br.search(val);
              return false;
          });
          $('.booksearch.mobile').submit(function(e) {
              e.preventDefault();
              var val = $(this).find('.textSrch').val();
              if (!val.length) return false;
              br.search(val, {
                  disablePopup:true,
                  error: br.BRSearchCallbackErrorMobile,
              });
              $('#mobileSearchResultWrapper').append(
                  '<div class="">Your search results will appear below.</div>'
                  + '<div class="loader tc mt20"></div>'
              );
              return false;
          });
          // Handle clearing the search results
          $(".textSrch").bind('input propertychange', function() {
              if (this.value == "") br.removeSearchResults();
          });
      }
  }

  /**
   * @param JInfoDiv DOM element. Appends info to this element
   * Can be overridden or extended
   */
  IslandoraBookReader.prototype.buildInfoDiv = function(jInfoDiv) {
      // Remove these legacy elements
      jInfoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

      $(this.settings.info).appendTo(jInfoDiv);
  }
  
  IslandoraBookReader.prototype.buildFulltextDiv = function(jFulltextDiv) {

	// Remove these legacy elements
        jFulltextDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

	// clear content
        jFulltextDiv.find('.BRfloatMeta').remove();
	jFulltextDiv.append($("<div class=\"BRfloatMeta\"></div>"));

    	jFulltextDiv.find('.BRfloatMeta').height(600);
    	jFulltextDiv.find('.BRfloatMeta').width(780);
 
   	if (1 == this.mode) {
	      	// Recent fix to correct issue with 2 page books
	      	var hash_arr = this.oldLocationHash.split("/");
	      	var index = hash_arr[1];
	      	var pid = this.getPID(index-1);
	      	$.get(this.getTextURI(pid),
		    	function(data) {
		        jFulltextDiv.find('.BRfloatMeta').html("<a href=\"/islandora/object/" + pid + "\" target=\"_blank\"><img src=\"/islandora/object/" 
			+ pid + "/datastream/TN\" height=\"100\"></a><br><strong>Page " + index + "</strong><HR>" + data);
		});
    	} else if (3 == this.mode) {
      		jFulltextDiv.find('.BRfloatMeta').html('<div><strong>' + Drupal.t('Full text not supported for this view.') + '</strong></div>');
    	} else {
	      	var twoPageText = $([
	      		'<div class="textTop" style="font-size: 1.1em">',
		 	'<div class="textLeft" style="padding: 10px"><p>Left page loading...</p></div>',
		 	'<div class="textRight" style="padding: 10px"><p>Right page loading...</p></div>',
	      		'</div>'].join('\n'));
	      	jFulltextDiv.find('.BRfloatMeta').html(twoPageText);
	      	var indices = this.getSpreadIndices(this.currentIndex());
	      	var left_pid = this.getPID(indices[0]);
	      	var right_pid = this.getPID(indices[1]);
	      	if(left_pid) {
			$.get(this.getTextURI(left_pid),
		      		function(data) {
		        	jFulltextDiv.find('.textLeft').html("<a href=\"/islandora/object/" + left_pid + "\" target=\"_blank\"><img src=\"/islandora/object/" 
				+ left_pid + "/datastream/TN\" height=\"100\"></a><br><strong>Page " + (indices[0]+1) + "</strong><HR>" + data);
		      	});
	      	} else {
			jFulltextDiv.find('.textLeft').html("<HR>");
		}
	      	if(right_pid) {
			$.get(this.getTextURI(right_pid),
		      		function(data) {
		        	jFulltextDiv.find('.textRight').html("<a href=\"/islandora/object/" + right_pid + "\" target=\"_blank\"><img src=\"/islandora/object/" 
				+ right_pid + "/datastream/TN\" height=\"100\" ></a><br><strong>Page " + (indices[1]+1) + "</strong><HR>" + data);
		      	});
	      	} else {
		        jFulltextDiv.find('.textRight').html("<HR>");
		}
	}
  }

  /**
   * override $.fn.colorbox.close() with parent.jQuery.colorbox.close()
   * in blankInfoDiv and blankShareDiv. Could be better than with override?
   */

IslandoraBookReader.prototype.blankInfoDiv = function() {
    return $([
        '<div class="BRfloat" id="BRinfo">',
            '<div class="BRfloatHead">About this book',
                '<button class="floatShut" href="javascript:;" onclick="parent.jQuery.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
            '<div class="BRfloatBody">',
                '<div class="BRfloatCover">',
                '</div>',
                '<div class="BRfloatMeta">',
                    '<div class="BRfloatTitle">',
                        '<h2><a/></h2>',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="BRfloatFoot">',
                '<a href="https://openlibrary.org/dev/docs/bookreader">About the BookReader</a>',
            '</div>',
        '</div>'].join('\n')
    );
}

IslandoraBookReader.prototype.blankShareDiv = function() {
    return $([
        '<div class="BRfloat" id="BRshare">',
            '<div class="BRfloatHead">',
                'Share',
                '<button class="floatShut" href="javascript:;" onclick="parent.jQuery.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
        '</div>'].join('\n')
    );
}
  
IslandoraBookReader.prototype.blankFulltextDiv = function() {
    return $([
        '<div class="BRfloat" id="BRfulltext">',
            '<div class="BRfloatHead">',
                'Full-text',
                '<button class="floatShut" href="javascript:;" onclick="parent.jQuery.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
        '</div>'].join('\n')
    );
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
  IslandoraBookReader.prototype.getImageserverUri = function(resource_uri, reduce, rotate) {
        if (this.settings.imageServer == 'iiif') {
           var base_uri = this.settings.iiifUri;
           if (base_uri.charAt(base_uri.length) != '/') {
                base_uri += '/';
           }

           // image_max_width > 0 => fixed width / thumb = 1/2
	   // image_max_width = 0 => automatic variable width depends on reduce parameter

           if (this.settings.image_max_width > 0) {

                if (this.mode == 3) {
                        var tile_width = Math.ceil(this.settings.image_max_width/2);
                }else {
                        var tile_width = Math.ceil(this.settings.image_max_width);
                }
                var params = '/full/' + tile_width + ',/0/default.jpg';
           }
           else {
                var params = '/full/pct:' + (1.0 / reduce * 100).toFixed(0) + '/0/default.jpg';
           }
           return (base_uri + encodeURIComponent(resource_uri) + params);
        }
        else {

                var base_uri = this.settings.djatokaUri;
                //Do some sanitation on that base uri.
                //Since it comes from an admin form, let's make sure there's a '/' at the
                //end of it.
                if (base_uri.charAt(base_uri.length) != '/') {
                        base_uri += '/';
                }
                var params = $.param({
                  'rft_id': resource_uri,
                  'url_ver': 'Z39.88-2004',
                  'svc_id': 'info:lanl-repo/svc/getRegion',
                  'svc_val_fmt': 'info:ofi/fmt:kev:mtx:jpeg2000',
                  'svc.format': 'image/jpeg',
                  'svc.level': this.settings.compression,
                  'svc.rotate': 0
                });
                return (base_uri + 'resolver?' + params);
        }
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
    if (typeof this.settings.pages[index] != 'undefined') {
      // Using backups? Get the image URI via callback and determine whether to
      // Djatoka-ize it.
      if ((this.settings.imageServer == 'djatoka') && (this.settings.useBackupUri == true)) {
        var callback_uri = null;
        $.ajax({
          url: this.settings.tokenUri.replace('PID', this.settings.pages[index].pid),
          async: false,
          success: function(data, textStatus, jqXHR) {
            callback_uri = data;
          }
        });
        if (callback_uri.indexOf("datastream/JP2/view") != -1) {
          return this.getImageserverUri(callback_uri, reduce, rotate);
        }
        return callback_uri;
      }
      // Not using backups? Just Djatoka-ize the page's image URI.
      else {
        return this.getImageserverUri(this.settings.pages[index].uri, reduce, rotate);
      }
    }
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
   *
   * @see BookReader/BookReaderIA/BookReaderJSIA.php
   */
  IslandoraBookReader.prototype.getPageSide = function(index) {
    if ('rl' != this.pageProgression) {
      // If pageProgression is not set RTL we assume it is LTR
      if (0 == (index & 0x1)) {
        // Even-numbered page
        if (false === this.hasCover) {
          return 'L';
        }
        return 'R';
      }
      else {
        if (false === this.hasCover) {
          return 'R';
        }
        // Odd-numbered page
        return 'L';
      }
    }
    else {
      // RTL
      if (0 == (index & 0x1)) {
        if (false === this.hasCover) {
          return 'R';
        }
        return 'L';
      }
      else {
      if (false === this.hasCover) {
          return 'L';
        }
        return 'R';
      }
    }
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
  IslandoraBookReader.prototype.search = function(term, options) {
    options = options !== undefined ? options : {};
    var that = this;
    var defaultOptions = {
        // {bool} (default=false) goToFirstResult - jump to the first result
        goToFirstResult: false,
        // {bool} (default=false) disablePopup - don't show the modal progress
        disablePopup: false,
        error: that.BRSearchCallbackErrorDesktop,
        success: that.BRSearchCallback,
      };
    var url = this.settings.searchUri.replace('TERM', encodeURI(term));
    term = term.replace(/\//g, ' '); // strip slashes, since this goes in the url
    this.searchTerm = term;
    this.removeSearchResults();
    this.updateLocationHash(true);
    this.showProgressPopup('<img id="searchmarker" src="'+ this.imagesBaseURL + 'marker_srch-on.png'+'">' + Drupal.t('Search results will appear below ...') + '</img>');
   
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
      var errStr  = Drupal.t('No matches were found.');
      var timeout = 1000;
      if (false === results.indexed) {
        errStr  = "<p>" + Drupal.t("This @content_type hasn't been indexed for searching yet. We've just started indexing it, so search should be available soon. Please try again later. Thanks!", {'@content_type': this.content_type}) + "</p>";
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
    var titles = {
      '.logo': Drupal.t('Go to Archive.org'), // $$$ update after getting OL record
      '.zoom_in': Drupal.t('Zoom in'),
      '.zoom_out': Drupal.t('Zoom out'),
      '.onepg': Drupal.t('One-page view'),
      '.twopg': Drupal.t('Two-page view'),
      '.thumb': Drupal.t('Thumbnail view'),
      '.print': Drupal.t('Print this page'),
      '.embed': Drupal.t('Embed BookReader'),
      '.link': Drupal.t('Link to this @content_type (and page)', {'@content_type': this.content_type}),
      '.bookmark': Drupal.t('Bookmark this page'),
      '.read': Drupal.t('Read this @content_type aloud', {'@content_type': this.content_type}),
      '.share': Drupal.t('Share this @content_type', {'@content_type': this.content_type}),
      '.info': Drupal.t('Info'),
      '.full': Drupal.t('Show fullscreen'),
      '.book_up': Drupal.t('Page up'),
      '.book_down': Drupal.t('Page down'),
      '.play': Drupal.t('Play'),
      '.pause': Drupal.t('Pause'),
      '.BOOKREADERdn': Drupal.t('Show/hide nav bar'),
      '.BOOKREADERup': Drupal.t('Show/hide nav bar'),
      '.book_top': Drupal.t('First page'),
      '.book_bottom': Drupal.t('Last page'),
      '.full_text' : Drupal.t('View full Text')
    };
    if ('rl' == this.pageProgression) {
      titles['.book_leftmost'] = Drupal.t('Last page');
      titles['.book_rightmost'] = Drupal.t('First page');
      titles['.book_left'] = Drupal.t('Next Page');
      titles['.book_right'] = Drupal.t('Previous Page');
    } else { // LTR
      titles['.book_leftmost'] = Drupal.t('First page');
      titles['.book_rightmost'] = Drupal.t('Last page');
      titles['.book_left'] = Drupal.t('Previous Page');
      titles['.book_right'] = Drupal.t('Next Page');
    }
    for (var icon in titles) {
      if (titles.hasOwnProperty(icon)) {
        $('#BookReader').find(icon).attr('title', titles[icon]);
      }
    }
  }
 
  /**
   * Toggle fullscreen viewer.
   */
  IslandoraBookReader.prototype.toggleFullScreen = function() {
    this.fullscreen = (this.fullscreen ? false : true);
    if(this.fullscreen) {
      var top = '0';
      if ( $("#admin-menu").length) {
        var admin_bar_height = $("#admin-menu").height();
        top = admin_bar_height + "px";
      }
      $('div#book-viewer').css({
        'position': 'fixed',
        'width': '100%',
        'height': '100%',
        'left': '0',
        'top': top,
        'z-index': '700'
      });
      $('div#BookReader').css({
        'height': '100%'
      });

      this.resize();
    }
    else {

      $('div#book-viewer').css({
      'position': 'relative',
      'z-index': '0'
      });
      $('div#BookReader').css({
        'height': ''
      });

      this.resize();
    }
  }

  /**
   * Go Fullscreen regardless of current state.
   */
  IslandoraBookReader.prototype.goFullScreen = function() {
    this.fullscreen = true;
    var top = 0;
    if ( $("#admin-menu").length) {
      var admin_bar_height = $("#admin-menu").height();
      top = admin_bar_height + "px";
    }
    $('div#book-viewer').css({
        'position': 'fixed',
        'width': '100%',
        'height': '100%',
        'left': '0',
        'top': top,
        'margin': '0',
        'padding': '0',
        'z-index': '1'
      });
      $('div#BookReader').css({
        'height': '100%'
      });
      this.resize();
  }

  /**
   * Window resize event callback, handles admin menu
   * in Drupal.
   */
  IslandoraBookReader.prototype.windowResize = function() {
    if (this.fullscreen && $("#admin-menu").length) {
      var top = 0;
      var height = '100%';
      var admin_bar_height = $("#admin-menu").height();
      top = admin_bar_height + "px";
      height = ($(window).height() - admin_bar_height) + "px";
      $('div#book-viewer').css({
        'position': 'fixed',
        'width': '100%',
        'height': height,
        'left': '0',
        'top': top,
        'z-index': '700'
      });

      this.resize();
    }
  }
  
  // Resizes the inner container to fit within the visible space to prevent
  // the top toolbar and bottom navbar from clipping the visible book
  IslandoraBookReader.prototype.resizeBRcontainer = function() {
    // Runs only if promise was fullfilled, so we are safe here
	if ($('#BRnavCntlBtm').hasClass('BRup')) {
		$('#BookReader').css({ overflow : 'hidden',
		});	
	} else {
		$('#BookReader').css({ overflow : 'visible',
		});	
	}
	$('#BRcontainer').css({
      top: this.getToolBarHeight(),
      bottom: this.getNavHeight(),
    });
  }
  
  // setupTooltips()
  //______________________________________________________________________________
  IslandoraBookReader.prototype.setupTooltips = function() {
      $('.js-tooltip').bt(
        {
          positions: ['auto', 'bottom'],
          shrinkToFit: true,
          spikeGirth: 5,
          spikeLength: 3,
          fill: '#4A90E2',
          cornerRadius: 2,
          strokeWidth: 0,
          cssStyles: {
            color: 'white',
            fontSize: '1.25em',
            whiteSpace: 'nowrap'
          },
        }
      );
  }
  // Overrides paramsFromFragment().
  //______________________________________________________________________________
  IslandoraBookReader.prototype.paramsFromFragment = function(urlFragment) {
     if (/#overlay=/.test(urlFragment)) {
       // We are on the Drupal Admin overlay. return instead of processing the Params.
       return;
     }
     // Call the original Method.
     return BookReader.prototype.paramsFromFragment.call(this, urlFragment);
   }
  // Overrides buildShareDiv().
   IslandoraBookReader.prototype.buildShareDiv = function(jShareDiv) {
     BookReader.prototype.buildShareDiv.call(this, jShareDiv);
     var finishedDiv = jShareDiv.find("button.share-finished");
     if (finishedDiv.length > 0) {
       finishedDiv[0].setAttribute('onclick', "parent.jQuery.colorbox.close();");
     }
     // No embed for us.
     jShareDiv.find('fieldset.fieldset-embed').remove();
   }

})(jQuery);
