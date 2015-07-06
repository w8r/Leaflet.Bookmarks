var L = global.L || require('leaflet');
var Storage = require('./storage');
var FormPopup = require('./formpopup');
var substitute = require('./string').substitute;
require('./leaflet.delegate');

// expose
L.Util._template = L.Util._template || substitute;

/**
 * Bookmarks control
 * @class  L.Control.Bookmarks
 * @extends {L.Control}
 */
var Bookmarks = L.Control.extend( /**  @lends Bookmarks.prototype */ {

  statics: {
    Storage: Storage,
    FormPopup: FormPopup
  },

  /**
   * @type {Object}
   */
  options: {
    localStorage: true,

    /* you can provide access to your own storage,
     * xhr for example, but make sure it has all
     * required endpoints:
     *
     * .getItem(id, callback)
     * .setItem(id, callback)
     * .getAllItems(callback)
     * .removeItem(id, callback)
     */
    storage: null,
    name: 'leaflet-bookmarks',
    position: 'topright', // chose your own if you want

    containerClass: 'leaflet-bar leaflet-bookmarks-control',
    expandedClass: 'expanded',
    headerClass: 'bookmarks-header',
    listClass: 'bookmarks-list',
    iconClass: 'bookmarks-icon',
    iconWrapperClass: 'bookmarks-icon-wrapper',
    listWrapperClass: 'bookmarks-list-wrapper',
    listWrapperClassAdd: 'list-with-button',
    wrapperClass: 'bookmarks-container',
    addBookmarkButtonCss: 'add-bookmark-button',

    animateClass: 'bookmark-added-anim',
    animateDuration: 150,

    formPopup: {
      popupClass: 'bookmarks-popup'
    },

    bookmarkTemplate: '<li class="{{ itemClass }}" data-id="{{ data.id }}">' +
      '<span class="{{ removeClass }}">&times;</span>' +
      '<span class="{{ nameClass }}">{{ data.name }}</span>' +
      '<span class="{{ coordsClass }}">{{ data.coords }}</span>' +
      '</li>',

    emptyTemplate: '<li class="{{ itemClass }} {{ emptyClass }}">' +
      '{{ data.emptyMessage }}</li>',

    dividerTemplate: '<li class="divider"></li>',

    bookmarkTemplateOptions: {
      itemClass: 'bookmark-item',
      nameClass: 'bookmark-name',
      coordsClass: 'bookmark-coords',
      removeClass: 'bookmark-remove',
      emptyClass: 'bookmarks-empty'
    },

    defaultBookmarkOptions: {
      editable: true,
      removable: true
    },

    title: 'Bookmarks',
    emptyMessage: 'No bookmarks yet',
    addBookmarkMessage: 'Add new bookmark',
    collapseOnClick: true,
    scrollOnAdd: true,
    scrollDuration: 1000,
    popupOnShow: true,
    addNewOption: true,

    /**
     * This you can change easily to output
     * whatever you have stored in bookmark
     *
     * @type {String}
     */
    popupTemplate: '<div><h3>{{ name }}</h3><p>{{ latlng }}, {{ zoom }}</p></div>',

    /**
     * Prepare your bookmark data for template.
     * If you don't change it, the context of this
     * function will be bookmarks control, so you can
     * access the map or other things from here
     *
     * @param  {Object} bookmark
     * @return {Object}
     */
    getPopupContent: function(bookmark) {
      return substitute(this.options.popupTemplate, {
        latlng: this.formatCoords(bookmark.latlng),
        name: bookmark.name,
        zoom: this._map.getZoom()
      });
    }
  },

  /**
   * @param  {Object} options
   * @constructor
   */
  initialize: function(options) {

    options = options || {};

    /**
     * Bookmarks array
     * @type {Array}
     */
    this._data = [];

    /**
     * @type {Element}
     */
    this._list = null;

    /**
     * @type {L.Marker}
     */
    this._marker = null;

    /**
     * @type {Element}
     */
    this._icon = null;

    /**
     * @type {Boolean}
     */
    this._isCollapsed = true;

    L.Util.setOptions(this, options);

    /**
     * @type {Storage}
     */
    this._storage = options.storage ||
      (this.options.localStorage ?
        new Storage(this.options.name, Storage.engineType.LOCALSTORAGE) :
        new Storage(this.options.name, Storage.engineType.GLOBALSTORAGE));

    L.Control.prototype.initialize.call(this, this.options);
  },

  /**
   * @param {L.Map} map
   */
  onAdd: function(map) {
    var container = this._container = L.DomUtil.create('div',
      this.options.containerClass
    );

    L.DomEvent
      .disableClickPropagation(container)
      .disableScrollPropagation(container);
    container.innerHTML = '<div class="' + this.options.headerClass +
      '"><span class="' + this.options.iconWrapperClass + '">' +
      '<span class="' + this.options.iconClass + '"></span></span>';

    this._icon = container.querySelector('.' + this.options.iconClass);
    this._icon.title = this.options.title;

    this._createList(this.options.bookmarks);

    var wrapper = L.DomUtil.create('div',
      this.options.wrapperClass, this._container);
    wrapper.appendChild(this._listwrapper);

    this._initLayout();

    L.DomEvent
      .on(container, 'click', this._onClick, this)
      .on(container, 'contextmenu', L.DomEvent.stopPropagation);

    map
      .on('bookmark:new', this._onBookmarkAddStart, this)
      .on('bookmark:add', this._onBookmarkAdd, this)
      .on('bookmark:edited', this._onBookmarkEdited, this)
      .on('bookmark:show', this._onBookmarkShow, this)
      .on('bookmark:edit', this._onBookmarkEdit, this)
      .on('bookmark:options', this._onBookmarkOptions, this)
      .on('bookmark:remove', this._onBookmarkRemove, this)
      .on('resize', this._initLayout, this);

    return container;
  },

  /**
   * @param  {L.Map} map
   */
  onRemove: function(map) {
    map
      .off('bookmark:new', this._onBookmarkAddStart, this)
      .off('bookmark:add', this._onBookmarkAdd, this)
      .off('bookmark:edited', this._onBookmarkEdited, this)
      .off('bookmark:show', this._onBookmarkShow, this)
      .off('bookmark:edit', this._onBookmarkEdit, this)
      .off('bookmark:options', this._onBookmarkOptions, this)
      .off('bookmark:remove', this._onBookmarkRemove, this)
      .off('resize', this._initLayout, this);

    if (this._marker) {
      this._marker._popup_._close();
    }

    if (this.options.addNewOption) {
      L.DomEvent.off(this._container.querySelector('.' +
          this.options.addBookmarkButtonCss), 'click',
        this._onAddButtonPressed, this);
    }

    this._marker = null;
    this._popup = null;
    this._container = null;
  },

  /**
   * @return {Array.<Object>}
   */
  getData: function() {
    return this._filterBookmarksOutput(this._data);
  },

  /**
   * @param  {Array.<Number>|Function|null} bookmarks
   */
  _createList: function(bookmarks) {
    this._listwrapper = L.DomUtil.create(
      'div', this.options.listWrapperClass, this._container);
    this._list = L.DomUtil.create(
      'ul', this.options.listClass, this._listwrapper);

    // select bookmark
    L.DomEvent.delegate(
      this._list,
      '.' + this.options.bookmarkTemplateOptions.itemClass,
      'click',
      this._onBookmarkClick,
      this
    );

    this._setEmptyListContent();

    if (L.Util.isArray(bookmarks)) {
      this._appendItems(bookmarks);
    } else if (typeof bookmarks === 'function') {
      this._appendItems(bookmarks());
    } else {
      var self = this;
      this._storage.getAllItems(function(bookmarks) {
        self._appendItems(bookmarks);
      });
    }
  },

  /**
   * Empty list
   */
  _setEmptyListContent: function() {
    this._list.innerHTML = substitute(this.options.emptyTemplate,
      L.Util.extend(this.options.bookmarkTemplateOptions, {
        data: {
          emptyMessage: this.options.emptyMessage
        }
      }));
  },

  /**
   * Sees that the list size is not too big
   */
  _initLayout: function() {
    var size = this._map.getSize();
    this._listwrapper.style.maxHeight =
      Math.min(size.y * 0.6, size.y - 100) + 'px';

    if (this.options.position === 'topleft') {
      L.DomUtil.addClass(this._container, 'leaflet-bookmarks-to-right');
    }
    if (this.options.addNewOption) {
      var addButton = L.DomUtil.create('div',
        this.options.addBookmarkButtonCss,
        this._listwrapper.parentNode);

      this._listwrapper.parentNode
        .classList.add(this.options.listWrapperClassAdd);
      addButton.innerHTML = '<span class="plus">+</span>' +
        '<span class="content">' +
        this.options.addBookmarkMessage + '</span>';
      L.DomEvent.on(addButton, 'click', this._onAddButtonPressed, this);
    }
  },

  /**
   * @param  {MouseEvent} evt
   */
  _onAddButtonPressed: function(evt) {
    L.DomEvent.stop(evt);
    this.collapse();
    this._map.fire('bookmark:new', {
      latlng: this._map.getCenter()
    });
  },

  /**
   * I don't care if they're unique or not,
   * if you do - handle this
   *
   * @param {Array.<Object>} bookmarks
   * @return {Array.<Object>}
   */
  _filterBookmarks: function(bookmarks) {
    if (this.options.filterBookmarks) {
      return this.options.filterBookmarks.call(this, bookmarks);
    } else {
      return bookmarks;
    }
  },

  /**
   * Filter bookmarks for output. This one allows you to save dividers as well
   *
   * @param {Array.<Object>} bookmarks
   * @return {Array.<Object>}
   */
  _filterBookmarksOutput: function(bookmarks) {
    if (this.options.filterBookmarksOutput) {
      return this.options.filterBookmarksOutput.call(this, bookmarks);
    } else {
      return bookmarks;
    }
  },

  /**
   * Append list items(render)
   * @param  {Array.<Object>} bookmarks
   */
  _appendItems: function(bookmarks) {
    var html = '';
    var wasEmpty = this._data.length === 0;
    var bookmark;

    // maybe you have something in mind?
    bookmarks = this._filterBookmarks(bookmarks);

    // store
    this._data = this._data.concat(bookmarks);

    for (var i = 0, len = bookmarks.length; i < len; i++) {
      html += this._renderBookmarkItem(bookmarks[i]);
    }

    if (html !== '') {
      // replace `empty` message if needed
      if (wasEmpty) {
        this._list.innerHTML = html;
      } else {
        this._list.innerHTML += html;
      }
    }

    if (this._isCollapsed) {
      var container = this._container,
        className = this.options.animateClass;
      container.classList.add(className);
      window.setTimeout(function() {
        container.classList.remove(className);
      }, this.options.animateDuration);
    } else {
      this._scrollToLast();
    }
  },

  /**
   * Scrolls to last element of the list
   */
  _scrollToLast: function() {
    var listwrapper = this._listwrapper;
    var pos = this._listwrapper.scrollTop;
    var targetVal = this._list.lastChild.offsetTop;
    var start = 0;

    var step = (targetVal - pos) / (this.options.scrollDuration / (1000 / 16));

    function scroll(timestamp) {
      if (!start) {
        start = timestamp
      }
      //var progress = timestamp - start;

      pos = Math.min(pos + step, targetVal);
      listwrapper.scrollTop = pos;
      if (pos !== targetVal) {
        L.Util.requestAnimFrame(scroll);
      }
    }
    L.Util.requestAnimFrame(scroll);
  },

  /**
   * Render single bookmark item
   * @param  {Object} bookmark
   * @return {String}
   */
  _renderBookmarkItem: function(bookmark) {
    if (bookmark.divider) {
      return substitute(this.options.dividerTemplate, bookmark);
    }

    this.options.bookmarkTemplateOptions.data =
      this._getBookmarkDataForTemplate(bookmark);

    return substitute(
      this.options.bookmarkTemplate,
      this.options.bookmarkTemplateOptions
    );
  },

  /**
   * Extracts data and style expressions for item template
   * @param  {Object} bookmark
   * @return {Object}
   */
  _getBookmarkDataForTemplate: function(bookmark) {
      if (this.options.getBookmarkDataForTemplate) {
        return this.options.getBookmarkDataForTemplate.call(this, bookmark);
      } else { 
      return {
        coords: this.formatCoords(bookmark.latlng),
        name: this.formatName(bookmark.name),
        zoom: bookmark.zoom,
        id: bookmark.id
        };
      }
  },

  /**
   * @param  {L.LatLng} latlng
   * @return {String}
   */
  formatCoords: function(latlng) {
    if (this.options.formatCoords) {
      return this.options.formatCoords.call(this, latlng);
    } else {
      return latlng[0].toFixed(4) + ',&nbsp;' + latlng[1].toFixed(4);
    }
  },

  /**
   * @param  {String} name
   * @return {String}
   */
  formatName: function(name) {
    if (this.options.formatName) {
      return this.options.formatName.call(this, name);
    } else {
      return name;
    }
  },

  /**
   * Shows bookmarks list
   */
  expand: function() {
    L.DomUtil.addClass(this._container, this.options.expandedClass);
    this._isCollapsed = false;
  },

  /**
   * Hides bookmarks list and the form
   */
  collapse: function() {
    L.DomUtil.removeClass(this._container, this.options.expandedClass);
    this._isCollapsed = true;
  },

  /**
   * @param  {Event} evt
   */
  _onClick: function(evt) {
    var expanded = L.DomUtil.hasClass(
      this._container, this.options.expandedClass);
    var target = evt.target || evt.srcElement;

    if (expanded) {
      if (target === this._container) {
        return this.collapse();
      }
      // check if it's inside the header
      while (target !== this._container) {
        if (L.DomUtil.hasClass(target, this.options.headerClass) ||
          L.DomUtil.hasClass(target, this.options.listWrapperClass)) {
          this.collapse();
          break;
        }
        target = target.parentNode;
      }
    } else {
      this.expand();
    }
  },

  /**
   * @param  {Object} evt
   */
  _onBookmarkAddStart: function(evt) {
    if (this._marker) {
      this._popup._close();
    }

    this._marker = new L.Marker(evt.latlng, {
      icon: this.options.icon || new L.Icon.Default(),
      draggable: true,
      riseOnHover: true
    }).addTo(this._map);
    this._marker.on('popupclose', this._onPopupClosed, this);

    // open form
    this._popup = new L.Control.Bookmarks.FormPopup(
      L.Util.extend(this.options.formPopup, {
        mode: L.Control.Bookmarks.FormPopup.modes.CREATE
      }),
      this._marker,
      this,
      L.Util.extend({}, evt.data, this.options.defaultBookmarkOptions)
    ).addTo(this._map);
  },

  /**
   * Bookmark added
   * @param  {Object} bookmark
   */
  _onBookmarkAdd: function(bookmark) {
    var self = this;
    var map = this._map;
    bookmark = this._cleanBookmark(bookmark.data);
    this._storage.setItem(bookmark.id, bookmark, function(item) {
      map.fire('bookmark:saved', {
        data: item
      });
      self._appendItems([item]);
    });
    this._showBookmark(bookmark);
  },

  /**
   * Update done
   * @param  {Event} evt
   */
  _onBookmarkEdited: function(evt) {
    var self = this;
    var map = this._map;
    var bookmark = this._cleanBookmark(evt.data);
    this._storage.setItem(bookmark.id, bookmark, function(item) {
      map.fire('bookmark:saved', {
        data: item
      });
      var data = self._data;
      self._data = [];
      for (var i = 0, len = data.length; i < len; i++) {
        if (data[i].id === bookmark.id) {
          data.splice(i, 1, bookmark);
        }
      }
      self._appendItems(data);
    });
    this._showBookmark(bookmark);
  },

  /**
   * Cleans circular reference for JSON
   * @param  {Object} bookmark
   * @return {Object}
   */
  _cleanBookmark: function(bookmark) {
    if (!L.Util.isArray(bookmark.latlng)) {
      bookmark.latlng = [bookmark.latlng.lat, bookmark.latlng.lng];
    }

    return bookmark;
  },

  /**
   * Form closed
   * @param  {Object} evt
   */
  _onPopupClosed: function(evt) {
    this._map.removeLayer(this._marker);
    this._marker = null;
    this._popup = null;
  },

  /**
   * @param  {String} id
   * @return {Object|Null}
   */
  _getBookmark: function(id) {
    for (var i = 0, len = this._data.length; i < len; i++) {
      if (this._data[i].id === id) {
        return this._data[i];
      }
    }
    return null;
  },

  /**
   * @param  {Object} evt
   */
  _onBookmarkShow: function(evt) {
    this._gotoBookmark(evt.data);
  },

  /**
   * Event handler for edit
   * @param  {Object} evt
   */
  _onBookmarkEdit: function(evt) {
    this._editBookmark(evt.data);
  },

  /**
   * Remove bookmark triggered
   * @param  {Event} evt
   */
  _onBookmarkRemove: function(evt) {
    this._removeBookmark(evt.data);
  },

  /**
   * Bookmark options called
   * @param  {Event} evt
   */
  _onBookmarkOptions: function(evt) {
    this._bookmarkOptions(evt.data);
  },

  /**
   * Show menu popup
   * @param  {Object} bookmark
   */
  _bookmarkOptions: function(bookmark) {
    var coords = L.latLng(bookmark.latlng);
    var marker = this._marker = this._createMarker(coords, bookmark);
    // open form
    this._popup = new L.Control.Bookmarks.FormPopup(
      L.Util.extend(this.options.formPopup, {
        mode: L.Control.Bookmarks.FormPopup.modes.OPTIONS
      }),
      this._marker,
      this,
      bookmark
    ).addTo(this._map);
  },

  /**
   * Call edit popup
   * @param  {Object} bookmark
   */
  _editBookmark: function(bookmark) {
    var coords = L.latLng(bookmark.latlng);
    var marker = this._marker = this._createMarker(coords, bookmark);
    marker.dragging.enable();
    // open form
    this._popup = new L.Control.Bookmarks.FormPopup(
      L.Util.extend(this.options.formPopup, {
        mode: L.Control.Bookmarks.FormPopup.modes.UPDATE
      }),
      this._marker,
      this,
      bookmark
    ).addTo(this._map);
  },

  /**
   * Returns a handler that will remove the bookmark from map
   * in case it got removed from the list
   * @param  {Object}   bookmark
   * @param  {L.Marker} marker
   * @return {Function}
   */
  _getOnRemoveHandler: function(bookmark, marker) {
    return function(evt) {
      if (evt.data.id === bookmark.id) {
        marker.clearAllEventListeners();
        if (marker._popup_) {
          marker._popup_._close();
        }
        this.removeLayer(marker);
      }
    };
  },

  /**
   * Creates bookmark marker
   * @param  {L.LatLng} coords
   * @param  {Object}   bookmark
   * @return {L.Marker}
   */
  _createMarker: function(coords, bookmark) {
    var marker = new L.Marker(coords, {
      icon: this.options.icon || new L.Icon.Default(),
      riseOnHover: true
    }).addTo(this._map);
    var removeIfRemoved = this._getOnRemoveHandler(bookmark, marker);
    this._map.on('bookmark:removed', removeIfRemoved);
    marker
      .on('popupclose', function() {
        this._map.removeLayer(this);
      })
      .on('remove', function() {
        this._map.off('bookmark:removed', removeIfRemoved);
      });
    return marker;
  },

  /**
   * Shows bookmark, nothing else
   * @param  {Object} bookmark
   */
  _showBookmark: function(bookmark) {
    if (this._marker) {
      this._marker._popup_._close();
    }
    var coords = L.latLng(bookmark.latlng);
    var marker = this._createMarker(coords, bookmark);
    var popup = new L.Control.Bookmarks.FormPopup(
      L.Util.extend(this.options.formPopup, {
        mode: L.Control.Bookmarks.FormPopup.modes.SHOW
      }),
      marker,
      this,
      bookmark
    );
    if (this.options.popupOnShow) {
      popup.addTo(this._map);
    }
    this._popup = popup;
    this._marker = marker;
  },

  /**
   * @param  {Object} bookmark
   */
  _gotoBookmark: function(bookmark) {
    this._map.setView(bookmark.latlng, bookmark.zoom);
    this._showBookmark(bookmark);
  },

  /**
   * @param  {Object} bookmark
   */
  _removeBookmark: function(bookmark) {
    var remove = function(proceed) {
      if (!proceed) {
        return this._showBookmark(bookmark);
      }

      var self = this;
      this._data.splice(this._data.indexOf(bookmark), 1);
      this._storage.removeItem(bookmark.id, function(bookmark) {
        self._onBookmarkRemoved(bookmark);
      });
    }.bind(this);

    if (typeof this.options.onRemove === 'function') {
      this.options.onRemove(bookmark, remove);
    } else {
      remove(true);
    }
  },

  /**
   * @param  {Object} bookmark
   */
  _onBookmarkRemoved: function(bookmark) {
    var li = this._list.querySelector('.' +
        this.options.bookmarkTemplateOptions.itemClass +
        "[data-id='" + bookmark.id + "']"),
      self = this;

    this._map.fire('bookmark:removed', {
      data: bookmark
    });

    if (li) {
      L.DomUtil.setOpacity(li, 0);
      global.setTimeout(function() {
        if (li.parentNode) {
          li.parentNode.removeChild(li);
        }
        if (self._data.length === 0) {
          self._setEmptyListContent();
        }
      }, 250);
    }
  },

  /**
   * Gets popup content
   * @param  {Object} bookmark
   * @return {String}
   */
  _getPopupContent: function(bookmark) {
    if (this.options.getPopupContent) {
      return this.options.getPopupContent.call(this, bookmark);
    } else {
      return JSON.stringify(bookmark);
    }
  },

  /**
   * @param  {Event} e
   */
  _onBookmarkClick: function(evt) {
    var bookmark = this._getBookmarkFromListItem(evt.delegateTarget);
    if (!bookmark) {
      return;
    }
    L.DomEvent.stopPropagation(evt);

    // remove button hit
    if (L.DomUtil.hasClass(evt.target || evt.srcElement,
        this.options.bookmarkTemplateOptions.removeClass)) {
      this._removeBookmark(bookmark);
    } else {
      this._map.fire('bookmark:show', {
        data: bookmark
      });
      if (this.options.collapseOnClick) {
        this.collapse();
      }
    }
  },

  /**
   * In case you've decided to play with ids - we've got you covered
   * @param  {Element} li
   * @return {Object|Null}
   */
  _getBookmarkFromListItem: function(li) {
    if (this.options.getBookmarkFromListItem) {
      return this.options.getBookmarkFromListItem.call(this, li);
    } else {
      return this._getBookmark(li.getAttribute('data-id'));
    }
  },

  /**
   * GeoJSON feature out of a bookmark
   * @param  {Object} bookmark
   * @return {Object}
   */
  bookmarkToFeature: function(bookmark) {
    var coords = this._getBookmarkCoords(bookmark);
    bookmark = JSON.parse(JSON.stringify(bookmark)); // quick copy
    delete bookmark.latlng;

    return L.GeoJSON.getFeature({
      feature: {
        type: 'Feature',
        id: bookmark.id,
        properties: bookmark
      }
    }, {
      type: 'Point',
      coordinates: coords
    });
  },

  /**
   * @param  {Object} bookmark
   * @return {Array.<Number>}
   */
  _getBookmarkCoords: function(bookmark) {
    if (bookmark.latlng instanceof L.LatLng) {
      return [bookmark.latlng.lat, bookmark.latlng.lng];
    } else {
      return bookmark.latlng.reverse();
    }
  },

  /**
   * Read bookmarks from GeoJSON FeatureCollectio
   * @param  {Object} geojson
   * @return {Object}
   */
  fromGeoJSON: function(geojson) {
    var bookmarks = [];
    for (var i = 0, len = geojson.features.length; i < len; i++) {
      var bookmark = geojson.features[i];
      if (!bookmark.properties.divider) {
        bookmark.properties.latlng = bookmark.geometry
          .coordinates.concat().reverse();
      }
      bookmarks.push(bookmark.properties);
    }
    return bookmarks;
  },

  /**
   * @return {Object}
   */
  toGeoJSON: function() {
    var control = this;
    return {
      type: 'FeatureCollection',
      features: (function(data) {
        var result = [];
        for (var i = 0, len = data.length; i < len; i++) {
          if (!data[i].divider) {
            result.push(control.bookmarkToFeature(data[i]));
          }
        }
        return result;
      })(this._data)
    };
  }
});

module.exports = Bookmarks;
