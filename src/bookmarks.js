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

        bookmarkTemplateOptions: {
            itemClass: 'bookmark-item',
            nameClass: 'bookmark-name',
            coordsClass: 'bookmark-coords',
            removeClass: 'bookmark-remove',
            emptyClass: 'bookmarks-empty'
        },

        title: 'Bookmarks',
        emptyMessage: 'No bookmarks yet',
        collapseOnClick: true,

        /**
         * This you can change easily to output
         * whatever you have stored in bookmark
         *
         * @type {String}
         */
        popupTemplate: '<div><h3>{{ name }}</h3><p>{{ latlng }}</p>',

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
                name: bookmark.name
            });
        }
    },

    /**
     * @param  {Object} options
     * @constructor
     */
    initialize: function(options) {

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
         * @type {Storage}
         */
        this._storage = options.storage ||
            (this.options.localStorage ?
            new Storage(this.options.name, Storage.engineType.LOCALSTORAGE) :
            new Storage(this.options.name, Storage.engineType.GLOBALSTORAGE));

        L.Util.setOptions(this, options);
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
        this._initLayout();

        L.DomEvent.on(container, 'click', this._onClick, this);
        L.DomEvent.on(container, 'contextmenu', L.DomEvent.stopPropagation);

        map.on('bookmark:new', this._onBookmarkAddStart, this);
        map.on('bookmark:add', this._onBookmarkAdd, this);
        map.on('resize', this._initLayout, this);

        return container;
    },

    /**
     * @param  {L.Map} map
     */
    onRemove: function(map) {
        map.off('bookmark:new', this._onBookmark, this);
        map.off('bookmark:add', this._onBookmarkAdd, this);
        map.off('resize', this._initLayout, this);

        this._marker = null;
        this._popup = null;
        this._container = null;
    },

    /**
     * @return {Array.<Object>}
     */
    getData: function() {
        return this._data;
    },

    /**
     * @param  {Array.<Number>|Function|null} bookmarks
     */
    _createList: function(bookmarks) {
        this._listwrapper = L.DomUtil.create(
            'div', 'bookmarks-list-wrapper', this._container);
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
     * Append list items(render)
     * @param  {Array.<Object>} bookmarks
     */
    _appendItems: function(bookmarks) {
        var html = '',
            wasEmpty = this._data.length === 0,
            bookmark;

        // maybe you have something in mind?
        bookmarks = this._filterBookmarks(bookmarks);

        // store
        this._data = this._data.concat(bookmarks);

        for (var i = 0, len = bookmarks.length; i < len; i++) {
            bookmark = bookmarks[i];

            this.options.bookmarkTemplateOptions.data = {
                coords: this.formatCoords(bookmark.latlng),
                name: this.formatName(bookmark.name),
                id: bookmark.id
            };

            html += substitute(
                this.options.bookmarkTemplate,
                this.options.bookmarkTemplateOptions
            );
        }

        if (html !== '') {
            // replace `empty` message if needed
            if (wasEmpty) {
                this._list.innerHTML = html;
            } else {
                this._list.innerHTML += html;
            }
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
    },

    /**
     * Hides bookmarks list and the form
     */
    collapse: function() {
        L.DomUtil.removeClass(this._container, this.options.expandedClass);
    },

    /**
     * @param  {Event} evt
     */
    _onClick: function(evt) {
        var expanded = L.DomUtil.hasClass(
                this._container, this.options.expandedClass),
            target = evt.target || evt.srcElement;

        if (expanded) {
            // check if it's inside the header
            while (target !== this._container) {
                if (L.DomUtil.hasClass(target, this.options.headerClass)) {
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
            this.options.formPopup,
            this._marker
        ).addTo(this._map);
    },

    /**
     * Bookmark added
     * @param  {Object} bookmark
     */
    _onBookmarkAdd: function(bookmark) {
        var self = this;
        bookmark = this._cleanBookmark(bookmark.data);
        this._storage.setItem(bookmark.id, bookmark, function(item) {
            self._appendItems([item]);
        });
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
     * @param  {Object} bookmark
     */
    _gotoBookmark: function(bookmark) {
        var coords = L.latLng(bookmark.latlng),
            marker = new L.Marker(coords, {
                icon: this.options.icon || new L.Icon.Default(),
                riseOnHover: true
            }).addTo(this._map);

        marker.bindPopup(this._getPopupContent(bookmark));
        marker.on('popupclose', function() {
            this._map.removeLayer(this);
        });
        this._map.setView(coords);

        if (!this.options.popupOnShow) {
            marker.openPopup();
        }
    },

    /**
     * @param  {Object} bookmark
     */
    _removeBookmark: function(bookmark) {
        var self = this;
        this._data.splice(this._data.indexOf(bookmark), 1);
        this._storage.removeItem(bookmark.id, function(bookmark) {
            self._onBookmarkRemoved(bookmark);
        });
    },

    /**
     * @param  {Object} bookmark
     */
    _onBookmarkRemoved: function(bookmark) {
        var li = this._list.querySelector('.' +
                this.options.bookmarkTemplateOptions.itemClass +
                "[data-id='" + bookmark.id + "']"),
            self = this;

        if (li) {
            L.DomUtil.setOpacity(li, 0);
            global.setTimeout(function() {
                li.parentNode.removeChild(li);
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

        // remove button hit
        if (L.DomUtil.hasClass(evt.target,
            this.options.bookmarkTemplateOptions.removeClass)) {
            this._removeBookmark(bookmark);
        } else {
            this._gotoBookmark(bookmark);
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
    }
});

module.exports = Bookmarks;
