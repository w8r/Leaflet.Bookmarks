import L from "leaflet";
import { unique, substitute } from "./string";

const modes = {
  CREATE: 1,
  UPDATE: 2,
  SHOW: 3,
  OPTIONS: 4,
};

/**
 * New bookmark form popup
 *
 * @class  FormPopup
 * @extends {L.Popup}
 */
export default L.Popup.extend(
  /** @lends FormPopup.prototype */ {
    statics: { modes },

    /**
     * @type {Object}
     */
    options: {
      mode: modes.CREATE,
      className: "leaflet-bookmarks-form-popup",
      templateOptions: {
        formClass: "leaflet-bookmarks-form",
        inputClass: "leaflet-bookmarks-form-input",
        inputErrorClass: "has-error",
        idInputClass: "leaflet-bookmarks-form-id",
        coordsClass: "leaflet-bookmarks-form-coords",
        submitClass: "leaflet-bookmarks-form-submit",
        inputPlaceholder: "Bookmark name",
        removeClass: "leaflet-bookmarks-form-remove",
        editClass: "leaflet-bookmarks-form-edit",
        cancelClass: "leaflet-bookmarks-form-cancel",
        editableClass: "editable",
        removableClass: "removable",
        menuItemClass: "nav-item",
        editMenuText: "Edit",
        removeMenuText: "Remove",
        cancelMenuText: "Cancel",
        submitTextCreate: "+",
        submitTextEdit: '<span class="icon-checkmark"></span>',
      },
      generateNames: false,
      minWidth: 160,
      generateNamesPrefix: "Bookmark ",
      template:
        '<form class="{{ formClass }}">' +
        '<div class="input-group"><input type="text" name="bookmark-name" ' +
        'placeholder="{{ inputPlaceholder }}" class="form-control {{ inputClass }}" value="{{ name }}">' +
        '<input type="hidden" class={{ idInputClass }} value="{{ id }}">' +
        '<button type="submit" class="input-group-addon {{ submitClass }}">' +
        "{{ submitText }}</button></div>" +
        '<div class="{{ coordsClass }}">{{ coords }}</div>' +
        "</form>",
      menuTemplate:
        '<ul class="nav {{ mode }}" role="menu">' +
        '<li class="{{ editClass }}"><a href="#" class="{{ menuItemClass }}">{{ editMenuText }}</a></li>' +
        '<li class="{{ removeClass }}"><a href="#" class="{{ menuItemClass }}">{{ removeMenuText }}</a></li>' +
        '<li><a href="#" class="{{ menuItemClass }} {{ cancelClass }}">{{ cancelMenuText }}</a></li>' +
        "</ul>",
    },

    /**
     * @param  {Object}  options
     * @param  {L.Layer} source
     * @param  {Object=} bookmark
     *
     * @constructor
     */
    initialize: function (options, source, control, bookmark) {
      /**
       * @type {Object}
       */
      this._bookmark = bookmark;

      /**
       * @type {L.Control.Bookmarks}
       */
      this._control = control;

      /**
       * @type {L.LatLng}
       */
      this._latlng = source.getLatLng();

      /**
       * For dragging purposes we're not maintaining the usual
       * link between the marker and Popup, otherwise it will simply be destroyed
       */
      source._popup_ = this;

      L.Popup.prototype.initialize.call(this, options, source);
    },

    /**
     * Add menu button
     */
    _initLayout: function () {
      L.Popup.prototype._initLayout.call(this);

      if (
        this.options.mode === modes.SHOW &&
        (this._bookmark.editable || this._bookmark.removable)
      ) {
        const menuButton = (this._menuButton = L.DomUtil.create(
          "a",
          "leaflet-popup-menu-button"
        ));
        this._container.insertBefore(menuButton, this._closeButton);
        menuButton.href = "#menu";
        menuButton.innerHTML = '<span class="menu-icon"></span>';
        L.DomEvent.disableClickPropagation(menuButton);
        L.DomEvent.on(menuButton, "click", this._onMenuButtonClick, this);
      }
    },

    /**
     * Show options menu
     */
    _showMenu: function () {
      this._map.fire("bookmark:options", { data: this._bookmark });
    },

    /**
     * @param  {MouseEvent} evt
     */
    _onMenuButtonClick: function (evt) {
      L.DomEvent.preventDefault(evt);
      this._showMenu();
      this.close();
    },

    /**
     * Renders template only
     * @override
     */
    _updateContent: function () {
      let content;
      if (this.options.mode === modes.SHOW) {
        content = this._control._getPopupContent(this._bookmark);
      } else {
        let template = this.options.template;
        let submitText = this.options.templateOptions.submitTextCreate;
        if (this.options.mode === modes.OPTIONS) {
          template = this.options.menuTemplate;
        }
        if (this.options.mode === modes.UPDATE) {
          submitText = this.options.templateOptions.submitTextEdit;
        }
        const modeClass = [];
        if (this._bookmark.editable) {
          modeClass.push(this.options.templateOptions.editableClass);
        }
        if (this._bookmark.removable) {
          modeClass.push(this.options.templateOptions.removableClass);
        }
        content = substitute(
          template,
          L.Util.extend(
            {},
            this._bookmark || {},
            this.options.templateOptions,
            {
              submitText: submitText,
              coords: this.formatCoords(
                this._source.getLatLng(),
                this._map.getZoom()
              ),
              mode: modeClass.join(" "),
            }
          )
        );
      }
      this._content = content;
      L.Popup.prototype._updateContent.call(this);
      this._onRendered();
    },

    /**
     * Form rendered, set up create or edit
     */
    _onRendered: function () {
      if (
        this.options.mode === modes.CREATE ||
        this.options.mode === modes.UPDATE
      ) {
        const form = this._contentNode.querySelector(
          "." + this.options.templateOptions.formClass
        );
        const input = form.querySelector(
          "." + this.options.templateOptions.inputClass
        );

        L.DomEvent.on(form, "submit", this._onSubmit, this);
        setTimeout(this._setFocus.bind(this), 250);
      } else if (this.options.mode === modes.OPTIONS) {
        L.DomEvent.delegate(
          this._container,
          "." + this.options.templateOptions.editClass,
          "click",
          this._onEditClick,
          this
        );
        L.DomEvent.delegate(
          this._container,
          "." + this.options.templateOptions.removeClass,
          "click",
          this._onRemoveClick,
          this
        );
        L.DomEvent.delegate(
          this._container,
          "." + this.options.templateOptions.cancelClass,
          "click",
          this._onCancelClick,
          this
        );
      }
    },

    /**
     * Set focus at the end of input
     */
    _setFocus: function () {
      const input = this._contentNode.querySelector(
        "." + this.options.templateOptions.inputClass
      );
      // Multiply by 2 to ensure the cursor always ends up at the end;
      // Opera sometimes sees a carriage return as 2 characters.
      const strLength = input.value.length * 2;
      input.focus();
      input.setSelectionRange(strLength, strLength);
    },

    /**
     * Edit button clicked
     * @param  {Event} evt
     */
    _onEditClick: function (evt) {
      L.DomEvent.preventDefault(evt);
      this._map.fire("bookmark:edit", { data: this._bookmark });
      this.close();
    },

    /**
     * Remove button clicked
     * @param  {Event} evt
     */
    _onRemoveClick: function (evt) {
      L.DomEvent.preventDefault(evt);
      this._map.fire("bookmark:remove", { data: this._bookmark });
      this.close();
    },

    /**
     * Back from options view
     * @param  {Event} evt
     */
    _onCancelClick: function (evt) {
      L.DomEvent.preventDefault(evt);
      this._map.fire("bookmark:show", { data: this._bookmark });
      this.close();
    },

    /**
     * Creates bookmark object from form data
     * @return {Object}
     */
    _getBookmarkData: function () {
      const options = this.options;
      if (options.getBookmarkData) {
        return options.getBookmarkData.call(this);
      }
      const input = this._contentNode.querySelector(
        "." + options.templateOptions.inputClass
      );
      const idInput = this._contentNode.querySelector(
        "." + options.templateOptions.idInputClass
      );
      return {
        latlng: this._source.getLatLng(),
        zoom: this._map.getZoom(),
        name: input.value,
        id: idInput.value || unique(),
      };
    },

    /**
     * Form submit, dispatch eventm close popup
     * @param {Event} evt
     */
    _onSubmit: function (evt) {
      L.DomEvent.stop(evt);

      const input = this._contentNode.querySelector(
        "." + this.options.templateOptions.inputClass
      );
      input.classList.remove(this.options.templateOptions.inputErrorClass);

      if (input.value === "" && this.options.generateNames) {
        input.value = unique(this.options.generateNamesPrefix);
      }

      const validate = this.options.validateInput || (() => true);

      if (input.value !== "" && validate.call(this, input.value)) {
        const bookmark = L.Util.extend(
          {},
          this._bookmark,
          this._getBookmarkData()
        );
        const map = this._map;

        this.close();
        if (this.options.mode === modes.CREATE) {
          map.fire("bookmark:add", { data: bookmark });
        } else {
          map.fire("bookmark:edited", { data: bookmark });
        }
      } else {
        input.classList.add(this.options.templateOptions.inputErrorClass);
      }
    },

    /**
     * @param  {L.LatLng} coords
     * @param  {Number=}  zoom
     * @return {String}
     */
    formatCoords: function (coords, zoom) {
      if (this.options.formatCoords) {
        return this.options.formatCoords.call(this, coords, zoom);
      }
      return [coords.lat.toFixed(4), coords.lng.toFixed(4), zoom].join(
        ",&nbsp;"
      );
    },

    /**
     * Hook to source movements
     * @param  {L.Map} map
     * @return {Element}
     */
    onAdd: function (map) {
      this._source.on("dragend", this._onSourceMoved, this);
      this._source.on("dragstart", this._onSourceMoveStart, this);
      return L.Popup.prototype.onAdd.call(this, map);
    },

    /**
     * @param  {L.Map} map
     */
    onRemove: function (map) {
      this._source.off("dragend", this._onSourceMoved, this);
      L.Popup.prototype.onRemove.call(this, map);
    },

    /**
     * Marker drag
     */
    _onSourceMoveStart: function () {
      // store
      this._bookmark = L.Util.extend(
        this._bookmark || {},
        this._getBookmarkData()
      );
      this._container.style.display = "none";
    },

    /**
     * Marker moved
     * @param  {Event} e
     */
    _onSourceMoved: function (e) {
      this._latlng = this._source.getLatLng();
      this._container.style.display = "";
      this._source.openPopup();
      this.update();
    },
  }
);
