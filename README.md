Leaflet.Bookmarks
=================
[![npm version](https://badge.fury.io/js/leaflet-bookmarks.svg)](http://badge.fury.io/js/leaflet-bookmarks)
[![Bower version](https://badge.fury.io/bo/leaflet-bookmarks.svg)](http://badge.fury.io/bo/leaflet-bookmarks) [![CircleCI](https://circleci.com/gh/w8r/Leaflet.Bookmarks.svg?style=shield)](https://circleci.com/gh/w8r/Leaflet.Bookmarks)

Highly customizable Leaflet plugin for user-generated bookmarks, stored locally or on the server.

See [demo and documentation](http://w8r.github.io/Leaflet.Bookmarks/)

## Description

This is a highly customizable plugin for leaflet to allow users to drop bookmarks on your map and to store them locally or on server. It uses localstorage by default, but allows you to implement your own storage solution. You can also redefine the addition of bookmarks, their looks and fields.

Right-click on the map, to add a new bookmark

## Usage

Includes

```html
<script src="/path/to/leaflet.js"></script>
<script src="/path/to/Leaflet.Bookmarks.min.js"></script>
<link type="text/css" rel="stylesheet" href="/path/to/leaflet.bookmarks.css">
```
## Put control on the map

```js
var map = new L.Map(...);
var control = new L.Control.Bookmarks().addTo(map);
```

## Adding a bookmark

How you trigger a bookmark addition is your own choice. For the demo I used the beautiful Leaflet.contextmenu plugin by @aratcliffe, but you are free to take any approach you want - it's based on the event bookmark:new dispatched by the map instance:

```js
map.fire('bookmark:new', {
    latlng: new L.LatLng(..., ...)
});
```

If you want you can omit the naming step and add a bookmark straight to the list using a bookmark:add event.

```js
map.fire('bookmark:add', {
  data: {
    id: 'XXXX' // make sure it's unique,
    name: 'Bookmark name',
    latlng: [lat, lng] // important, we're dealing with JSON here,
    your_key: 'your value'
  }
});
```

## Events

Triggered on **map**:
* `bookmark:removed` - Bookmark has been removed from storage and interface
* `bookmark:show` - bookmark selected from list or just created

## `GeoJSON` support

There are GeoJSON import/export methods provided for convinence and use within the storage methods of your choice

* `.bookmarkToFeature(bookmark)`
Use it on a single bookmark if you want to convert it into geoJSON `Feature` before send
* `.toGeoJSON()`
Exports the whole list into GeoJSON, uses `.bookmarkToFeature`
* `.fromGeoJSON(geojson)`
Uses properties as the bookmark contents, geometry as the location. GeoJSON `Point` expected, you can change it for a different type of geometry, if you want, then you'll have to take care of the centroid routines.

## Customizing

### localStorage or variable storage

The control uses localStorage by default. Your bookmarks will be stored in prefixed key-value pairs. You can customize the prefix if you want to

```js
var control = new L.Control.Bookmarks({
    name: 'your-storage-prefix', // defaults to 'leaflet-bookmarks'
    localStorage: false // if you want to use local variable for storage
});
```

P.S. You can access the storage directly through the control:

```js
control._storage.getItem(key, callback);
control._storage.setItem(key, value, callback);
control._storage.removeItem(key, callback);
control._storage.getAllItems(callback);
```

### Custom storage(e.g AJAX)

I intentionally didn't add an engine for anything else than localStorage and local variable storage, so you could use your own xhr functions. To do that, you have to pass the interface to your storage to the control like this:

```js
var control = new L.Control.Bookmarks({
    storage: {
        getItem: function(id, callback){
            $.ajax({
                url: '/bookmarks/' + id,
                type: 'GET',
                dataType: 'json',
                success: callback
            });
        },
        setItem: function(id, value, callback){
            $.ajax({
                url: '/bookmarks/' + id,
                type: 'PUT',
                data: value,
                dataType: 'json',
                success: callback
            });
        },
        removeItem: function(id, callback){
            $.ajax({
                url: '/bookmarks/' + id,
                type: 'DELETE',
                dataType: 'json',
                success: callback
            });
        },
        getAllItems: function(callback){
            $.ajax({
                url: '/bookmarks/',
                type: 'GET',
                dataType: 'json',
                success: callback
            });
        }
    }
}).addTo(map);
```

### Custom templates

Pass those into the options if you want to customize the popup or list templates. Proceed with caution

```js
{
       // list item MUST contain `data-id` attribute,
       // or provide your own `options.getBookmarkFromListItem(listItem)` method
       bookmarkTemplate: '<li class="{{ itemClass }}" data-id="{{ data.id }}">' +
            '<span class="{{ removeClass }}">&times;</span>' +
            '<span class="{{ nameClass }}">{{ data.name }}</span>' +
            '<span class="{{ coordsClass }}">{{ data.coords }}</span>' +
            '</li>',

        // format list item name
        formatName: function(name){ ... },

        // format coords
        // again, you have access to the control here, so you can
        // output projected coords for example
        formatCoords: function(laltlng){
            var projected = this._map.project(L.latLng(latlng[0], latlng[1]));
            return 'X: ' + projected.x + 'm, Y: ' + projected.y + 'm';
        },

        // no bookmarks yet
        emptyTemplate: '<li class="{{ itemClass }} {{ emptyClass }}">' +
            '{{ data.emptyMessage }}</li>',

        // no bookmarks text
        emptyMessage: "Hell no, I forgot where I've been!",

        // you can change them, but then provide your own styling
        bookmarkTemplateOptions: {
            itemClass: 'bookmark-item',
            nameClass: 'bookmark-name',
            coordsClass: 'bookmark-coords',
            removeClass: 'bookmark-remove',
            emptyClass: 'bookmarks-empty'
        },

        // change that if you have custom fields in your bookmarks
        popupTemplate: '<div><h3>{{ name }}</h3><p>{{ latlng }}</p>',

        // here you extract them for the template.
        // note - you have access to controls methods and fields here
        getPopupContent: function(bookmark) {
            return L.Util.template(this.options.popupTemplate, {
                latlng: this.formatCoords(bookmark.latlng),
                name: bookmark.name
            });
        },

        // here you can filter bookmarks that you get from
        // the storage or a user, make sure it returns an Array
        filterBookmarks: function(bookmarks){ ... },
}
```

You can customize the bookmark add form too, pass that to the control options:

```js
formPopup: {
        className: 'leaflet-bookmarks-form-popup',
        templateOptions: {
            formClass: 'leaflet-bookmarks-form',
            inputClass: 'leaflet-bookmarks-form-input',
            coordsClass: 'leaflet-bookmarks-form-coords',
            submitClass: 'leaflet-bookmarks-form-submit',
            inputPlaceholder: 'Bookmark name',
            submitText: '+'
        },
        getBookmarkData: function(){
            var input = this._contentNode.querySelector('.' +
            this.options.templateOptions.inputClass);
            ...
            return {
                id: 'YOUR_UNIQUE_ID',
                name: 'Bookmark name',
                your_custom_field: ... // get it from the form inputs
                latlng: this._source.getLatLng() // get it from the marker
            };
        },
        onRemove: function(bookmark, callback){
          /* use that to add confirmation menus
             when removing a bookmark */
           },
        generateNames: true, // generate unique name if it's not provided by the user
        generateNamesPrefix: 'Bookmark ',
        template: '<form class="{{ formClass }}">' +
            '<input type="text" name="bookmark-name" ' +
            'placeholder="{{ inputPlaceholder }}" class="{{ inputClass }}">' +
            '<input type="submit" value="{{ submitText }}" ' +
            'class="{{ submitClass }}">' +
            '<div class="{{ coordsClass }}">{{ coords }}</div>' +
            '</form>',
    }
```

### Editing

You can enable bookmarks editing/removal by putting a flag in the bookmark object

```js
{
  name: '',
  id: 'XXX',
  latlng: [lat, lng],
  editable: true,
  removable: true
}
```

This will enable a menu on popup to remove or edit the bookmark.
Presence of menu items will is defined by those params also

![screenshot 2015-05-27 21 32 51](https://cloud.githubusercontent.com/assets/26884/7845663/987abcfa-04b8-11e5-867d-f4ea025b416e.png)

### Removal

You can pass a custom confirm function to the control, so you could handle confirmation menus

```
  onRemove: function(bookmark, callback){
    if(confirm('Are you really sure?')){
      if(bookmark.name === 'Bamby') {
        alert('Keep your hands away!');
        callback(false); // won't be removed
      } else {
        callback(true);  // will be removed
      }
    } else {
      callback(false);
    }
  }
```

### `L.Util._template`

Small template function used by this project. It's a simple implementation of @lodash templates, using mustache interpolation syntax. You get it as a souvenir.

```js
L.Util._template('Whereof one cannot {{ data.action }}, thereof one must keep {{ data.instead }}', { data: { action: 'speak', instead: 'silent' }});
// -> "Whereof one cannot speak, thereof one must keep silent"
```
## Authors and Contributors

Alexander Milevski

## License

MIT

## Changelog
* **0.2.0**
  * Editing/removal funtionality
  * "Add new" button
  * Tests added
* **0.1.5**
  * GeoJSON support
* **0.1.3**
  * Different layout when in `topleft` position
  * Scroll to bookmark on addition
* **0.1.2**
  * Remove marker when bookmark is removed
* **0.1.0**
  * npm & bower packages published
* **0.0.2**
  * Zoom level ztored and used by default
  * Remove button flickering fixed
  * Add bookmark UX: now you can show the newly created bookmark right away
* **0.0.1**
  * Initial release

