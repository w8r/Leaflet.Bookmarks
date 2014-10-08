(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var L = global.L || require('leaflet');

L.Control.Bookmarks = require('./src/bookmarks');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./src/bookmarks":2,"leaflet":undefined}],2:[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./formpopup":3,"./storage":5,"./string":8,"leaflet":undefined}],3:[function(require,module,exports){
(function (global){
var L = global.L || require('leaflet');
var substitute = require('./string').substitute;
var unique = require('./string').unique;

/**
 * New bookmark form popup
 *
 * @class  FormPopup
 * @extends {L.Popup}
 */
var FormPopup = L.Popup.extend( /** @lends FormPopup.prototype */ {

    /**
     * @type {Object}
     */
    options: {
        className: 'leaflet-bookmarks-form-popup',
        templateOptions: {
            formClass: 'leaflet-bookmarks-form',
            inputClass: 'leaflet-bookmarks-form-input',
            coordsClass: 'leaflet-bookmarks-form-coords',
            submitClass: 'leaflet-bookmarks-form-submit',
            inputPlaceholder: 'Bookmark name',
            submitText: '+'
        },
        generateNames: true,
        template: '<form class="{{ formClass }}">' +
            '<input type="text" name="bookmark-name" ' +
            'placeholder="{{ inputPlaceholder }}" class="{{ inputClass }}">' +
            '<input type="submit" value="{{ submitText }}" ' +
            'class="{{ submitClass }}">' +
            '<div class="{{ coordsClass }}">{{ coords }}</div>' +
            '</form>'
    },

    /**
     * @param  {Object} options
     * @param  {L.Layer} source
     *
     * @constructor
     */
    initialize: function(options, source) {
        options.offset = this._calculateOffset(source, options)

        this._latlng = source.getLatLng();
        L.Popup.prototype.initialize.call(this, options, source);
    },

    /**
     * Correct offset from marker
     * @param  {L.Marker} source
     * @param  {Object}   options
     * @return {L.Point}
     */
    _calculateOffset: function(source, options) {
        var anchor = L.point(source.options.icon.options.popupAnchor || [0, 0]);
        anchor = anchor.add(this.options.offset);

        if (options && options.offset) {
            anchor = anchor.add(options.offset);
        }
        return anchor;
    },

    /**
     * Renders template only
     * @override
     */
    _updateContent: function() {
        this._content = substitute(this.options.template,
            L.Util.extend({}, this.options.templateOptions, {
                coords: this.formatCoords(this._source.getLatLng())
            }));
        L.Popup.prototype._updateContent.call(this);

        var form = this._contentNode.querySelector('.' +
                this.options.templateOptions.formClass),
            input = form.querySelector('.' +
                this.options.templateOptions.inputClass);

        L.DomEvent.on(form, 'submit', this._onSubmit, this);

        setTimeout(function() {
            input.focus();
        }, 250);
    },

    /**
     * Form submit, dispatch eventm close popup
     * @param {Event} evt
     */
    _onSubmit: function(evt) {
        L.DomEvent.stop(evt);

        var input = this._contentNode.querySelector('.' +
            this.options.templateOptions.inputClass);

        if (input.value === '' && this.options.generateNames) {
            input.value = unique();
        }

        if (input.value !== '') {
            this._map.fire('bookmark:add', {
                data: {
                    latlng: this._source.getLatLng(),
                    name: input.value
                }
            });
            this._close();
        }
    },

    /**
     * @param  {L.LatLng} coords
     * @return {String}
     */
    formatCoords: function(coords) {
        if (this.options.formatCoords) {
            return this.options.formatCoords.call(this, coords);
        } else {
            return coords.lat.toFixed(4) + ',&nbsp;' + coords.lng.toFixed(4);
        }
    },

    /**
     * Hook to source movements
     * @param  {L.Map} map
     * @return {Element}
     */
    onAdd: function(map) {
        this._source.on('dragend', this._onSourceMoved, this);
        this._source.on('dragstart', this._onSourceMoveStart, this);
        return L.Popup.prototype.onAdd.call(this, map);
    },

    /**
     * @param  {L.Map} map
     */
    onRemove: function(map) {
        this._source.off('dragend', this._onSourceMoved, this);
        L.Popup.prototype.onRemove.call(this, map);
    },

    /**
     * Marker drag
     */
    _onSourceMoveStart: function() {
        this._container.style.display = 'none';
    },

    /**
     * Marker moved
     * @param  {Event} e
     */
    _onSourceMoved: function(e) {
        this._latlng = this._source.getLatLng();
        this._container.style.display = '';
        this.update();
    }
});

module.exports = FormPopup;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./string":8,"leaflet":undefined}],4:[function(require,module,exports){
/**
 * @type {Object}
 */
var data = {};

/**
 * Object based storage
 * @class Storage.Engine.Global
 * @constructor
 */
var GlobalStorage = function(prefix) {

    /**
     * @type {String}
     */
    this._prefix = prefix;
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
GlobalStorage.prototype.getItem = function(key, callback) {
    callback(data[this._prefix + key]);
};

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
GlobalStorage.prototype.setItem = function(key, item, callback) {
    data[this._prefix + key] = item;
    callback(item);
};

/**
 * @param  {Function} callback
 */
GlobalStorage.prototype.getAllItems = function(callback) {
    var items = [];
    for (var key in data) {
        if (data.hasOwnProperty(key) && key.indexOf(this_prefix) === 0) {
            items.push(data[key]);
        }
    }
    callback(items);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
GlobalStorage.prototype.removeItem = function(key, callback) {
    var self = this;
    this.getItem(key, function(item) {
        if (item) {
            delete data[this._prefix + key];
        } else {
            item = null;
        }
        if (callback) {
            callback(item);
        }
    });
};

module.exports = GlobalStorage;

},{}],5:[function(require,module,exports){
(function (global){
var unique = require('./string').unique;

/**
 * Persistent storage, depends on engine choice: localStorage/ajax
 * @param {String} name
 */
var Storage = function(name, engineType) {

    if (typeof name !== 'string') {
        engineType = name;
        name = unique();
    }

    /**
     * @type {String}
     */
    this._name = name;

    /**
     * @type {Storage.Engine}
     */
    this._engine = Storage.createEngine(engineType,
        this._name, Array.prototype.slice.call(arguments, 2));
};

/**
 * @const
 * @enum {Number}
 */
Storage.engineType = {
    GLOBAL: 1,
    LOCALSTORAGE: 2,
    XHR: 3
};

/**
 * @constructor
 * @typedef {Storage.Engine}
 */
Storage.Engine = {
    Global: require('./storage.global'),
    XHR: require('./storage.xhr'),
    LocalStorage: require('./storage.localstorage')
};

/**
 * Engine factory
 * @param  {Number} type
 * @param  {String} prefix
 * @return {Storage.Engine}
 */
Storage.createEngine = function(type, prefix, args) {
    if (type === Storage.engineType.GLOBAL) {
        return new Storage.Engine.Global(prefix);
    } else if (type === Storage.engineType.LOCALSTORAGE) {
        return new Storage.Engine.LocalStorage(prefix);
    } else if (type === Storage.engineType.XHR) {
        return new Storage.Engine.XHR(
            Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
Storage.prototype.setItem = function(key, item, callback) {
    this._engine.setItem(key, item, callback);
    return this;
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
Storage.prototype.getItem = function(key, callback) {
    this._engine.getItem(key, callback);
    return this;
};

/**
 * @param  {Function} callback
 */
Storage.prototype.getAllItems = function(callback) {
    var prefix = this._name;
    this._engine.getAllItems(callback);
};

module.exports = global.Storage = Storage;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./storage.global":4,"./storage.localstorage":6,"./storage.xhr":7,"./string":8}],6:[function(require,module,exports){
/**
 * LocalStoarge based storage
 * @constructor
 */
var LocalStorage = function(prefix) {
    console.log(prefix);
    this._prefix = prefix;

    this._storage = window.localStorage;
};

/**
 * @const
 * @type {RegExp}
 */
LocalStorage.JSON_RE = /^[\{\[](.)*[\]\}]$/;

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
LocalStorage.prototype.getItem = function(key, callback) {
    var item = this._storage.getItem(this._prefix + key);
    if (item && LocalStorage.JSON_RE.test(item)) {
        item = JSON.parse(item);
    }
    callback(item);
};

/**
 * @param  {Function} callback
 */
LocalStorage.prototype.getAllItems = function(callback) {
    var items = [],
        prefixLength = this._prefix.length;
    for (var key in this._storage) {
        if (this._storage.hasOwnProperty(key) &&
            key.indexOf(this._prefix) === 0) {
            this.getItem(key.substring(prefixLength), function(item) {
                items.push(item);
            });
        }
    }
    callback(items);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
LocalStorage.prototype.removeItem = function(key, callback) {
    var self = this;
    this._storage.getItem(key, function(item) {
        self._storage.removeItem(this._prefix + key);
        if (callback) {
            callback(item);
        }
    });
};

/**
 * @param  {String}   key
 * @param  {*}        item
 * @param  {Function} callback
 */
LocalStorage.prototype.setItem = function(key, item, callback) {
    var itemStr = item.toString();
    if (itemStr === '[object Object]') {
        itemStr = JSON.stringify(item)
    }
    this._storage.setItem(this._prefix + key, itemStr);
    callback(item);
};

module.exports = LocalStorage;

},{}],7:[function(require,module,exports){
/**
 * XHR storage
 * @param {String}  getUrl
 * @param {String=} postUrl
 * @param {String=} deleteUrl
 *
 * @constructor
 */
var XHR = function(getUrl, postUrl, deleteUrl) {

    /**
     * @type {String}
     */
    this._getUrl = getUrl;

    /**
     * @type {String}
     */
    this._postUrl = postUrl || getUrl;

    /**
     * @type {String}
     */
    this._deleteUrl = deleteUrl || getUrl;
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
XHR.prototype.getItem = function(key, callback) {
    ajax.get(this._getUrl, {
        key: key
    }, callback);
};

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
XHR.prototype.setItem = function(key, item, callback) {
    ajax.post(this._postUrl, {
        key: item
    }, callback);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
XHR.prototype.removeItem = function(key, callback) {
    ajax.delete(this._deleteUrl, {
        key: key
    }, callback);
};

/**
 * @param  {String=}  prefix
 * @param  {Function} callback
 */
XHR.prototype.getAllItems = function(callback) {
    ajax.get(this._getUrl, null, callback);
};

module.exports = XHR;

},{}],8:[function(require,module,exports){
/**
 * Substitutes {{ obj.field }} in strings
 *
 * @param  {String}  str
 * @param  {Object}  object
 * @param  {RegExp=} regexp
 * @return {String}
 */
function substitute(str, object, regexp) {
    return str.replace(regexp || (/{{([\s\S]+?)}}/g), function(match, name) {
        name = trim(name);

        if (name.indexOf('.') === -1) {
            if (match.charAt(0) == '\\') {
                return match.slice(1);
            }
            return (object[name] != null) ? object[name] : '';

        } else { // nested
            var result = object;
            name = name.split('.');
            for (var i = 0, len = name.length; i < len; i++) {
                if (name[i] in result) {
                    result = result[name[i]];
                } else {
                    return '';
                }
            }
            return result;
        }
    });
}

/**
 * Unique string from date. Puts character at the beginning,
 * for the sake of good manners
 *
 * @return {String}
 */
function unique() {
    var alpha = 'abcdefghijklmnopqrstuvwxyz';
    return alpha[Math.floor(Math.random() * alpha.length)] +
        (new Date()).getTime().toString(16);
}

/**
 * Trim whitespace
 * @param  {String} str
 * @return {String}
 */
function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

/**
 * Clean and trim
 * @param  {String} str
 * @return {String}
 */
function clean(str) {
    return trim(str.replace(/\s+/g, ' '));
}

module.exports = {
    substitute: substitute,
    trim: trim,
    clean: clean,
    unique: unique
};

},{}]},{},[1]);
