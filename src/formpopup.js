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
    generateNamesPrefix: 'Bookmark ',
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
    options.offset = this._calculateOffset(source, {});

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
        coords: this.formatCoords(
          this._source.getLatLng(),
          this._map.getZoom()
        )
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
   * Creates bookmark object from form data
   * @return {Object}
   */
  _getBookmarkData: function() {
    if (this.options.getBookmarkData) {
      return this.options.getBookmarkData.call(this);
    } else {
      var input = this._contentNode.querySelector('.' +
        this.options.templateOptions.inputClass);

      return {
        latlng: this._source.getLatLng(),
        zoom: this._map.getZoom(),
        name: input.value,
        id: unique()
      };
    }
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
      input.value = unique(this.options.generateNamesPrefix);
    }

    if (input.value !== '') {
      var bookmark = this._getBookmarkData(),
        map = this._map;

      this._close();
      map.fire('bookmark:add', {
        data: bookmark
      });
    }
  },

  /**
   * @param  {L.LatLng} coords
   * @param  {Number=}  zoom
   * @return {String}
   */
  formatCoords: function(coords, zoom) {
    if (this.options.formatCoords) {
      return this.options.formatCoords.call(this, coords, zoom);
    } else {
      return [coords.lat.toFixed(4), coords.lng.toFixed(4), zoom]
        .join(',&nbsp;');
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
