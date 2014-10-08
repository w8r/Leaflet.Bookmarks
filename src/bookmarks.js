var L = global.L || require('leaflet');
var Storage = require('./storage');
var FormPopup = require('./formpopup');
var substitute = require('./string').substitute;


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
        name: 'leaflet-bookmarks',
        position: 'topright', // chose your own if you want
        containerClass: 'leaflet-bar leaflet-bookmarks-control',
        expandedClass: 'expanded',

        formPopup: {
            popupClass: 'bookmarks-popup'
        },

        bookmarkTemplate: '<li class="{{ itemClass }}">' +
            '<span class="{{ removeClass }}">&times;</span>' +
            '<span class="{{ nameClass }}">{{ data.name }}</span>' +
            '<span class="{{ coordsClass }}">{{ data.coords }}</span>' +
            '</li>',

        bookmarkTemplateOptions: {
            itemClass: 'bookmark-item',
            nameClass: 'bookmark-name',
            coordsClass: 'bookmark-coords',
            removeClass: 'bookmark-remove'
        },
        listClass: 'bookmarks-list',
        iconClass: 'icon',
        title: 'Bookmarks'
    },

    /**
     * @param  {Object} options
     * @constructor
     */
    initialize: function(options) {

        /**
         * @type {Element}
         */
        this._list = null;

        /**
         * @type {L.Marker}
         */
        this._marker = null;

        /**
         * @type {Storage}
         */
        this._storage = this.options.localStorage ?
            new Storage(this.options.name, Storage.engineType.LOCALSTORAGE) :
            new Storage(this.options.name,
                Storage.engineType.XHR,
                this.options.storageUrl);

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
        container.innerHTML = '<span class="' +
            this.options.iconClass + '"></span>';
        container.title = this.options.title;

        this._createList(this.options.bookmarks);

        L.DomEvent.on(container, 'click', this._onClick, this);
        L.DomEvent.on(container, 'contextmenu', L.DomEvent.stopPropagation);

        map.on('bookmark:new', this._onBookmarkAddStart, this);
        map.on('bookmark:add', this._onBookmarkAdd, this);

        return container;
    },

    /**
     * @param  {L.Map} map
     */
    onRemove: function(map) {
        map.off('bookmark:new', this._onBookmark, this);
        map.off('bookmark:add', this._onBookmarkAdd, this);
        L.DomEvent.off(this._container, 'click', this._onClick, this);

        this._marker = null;
        this._popup = null;
        this._container = null;
    },

    /**
     * @param  {Array.<Number>|Function|null} bookmarks
     */
    _createList: function(bookmarks) {
        this._list = L.DomUtil.create('ul', this.options.listClass, this._container);
        if (L.Util.isArray(bookmarks)) {
            this._appendItems(bookmarks);
        } else if (typeof bookmarks === 'function') {
            this._appendItems(bookmarks());
        } else {
            this._storage.getAllItems(this._appendItems.bind(this));
        }
    },

    /**
     * Append list items(render)
     * @param  {Array.<Object>} bookmarks
     */
    _appendItems: function(bookmarks) {
        console.log(bookmarks);
        var html = '',
            bookmark;
        for (var i = 0, len = bookmarks.length; i < len; i++) {
            bookmark = bookmarks[i];

            this.options.bookmarkTemplateOptions.data = {
                coords: this.formatCoords(bookmark.latlng),
                name: this.formatName(bookmark.name)
            };

            html += substitute(
                this.options.bookmarkTemplate,
                this.options.bookmarkTemplateOptions
            );
        }
        this._list.innerHTML += html;
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
        if (L.DomUtil.hasClass(this._container, this.options.expandedClass)) {
            this.collapse();
        } else {
            this.expand();
        }
    },

    /**
     * @param  {Object} evt
     */
    _onBookmarkAddStart: function(evt) {
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
        this._storage.setItem(bookmark.name, bookmark, function(item) {
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
    }
});

module.exports = Bookmarks;
