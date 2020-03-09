"use strict";

var L = require('leaflet');
var Bookmarks = require('../dist/Leaflet.Bookmarks.js');
var { assert } = require('chai');

describe('L.Bookmarks.FormPopup', () => {

  const container = L.DomUtil.create('div', 'map', document.body);
  L.Icon.Default.imagePath = "http://cdn.leafletjs.com/leaflet-0.7/images";

  var map = new L.Map(container, {}).setView([22.2670, 114.188], 13);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; ' +
      '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  function getCoord() {
    var bounds = map.getBounds();
    var sw = bounds._southWest;
    var ne = bounds._northEast;
    return new L.LatLng(
      sw.lat + (ne.lat - sw.lat) * Math.random(),
      sw.lng + (ne.lng - sw.lng) * Math.random()
    );
  }

  function getBookmark() {
    var coord = getCoord();
    var id = uid();
    return {
      latlng: coord,
      id: id,
      name: 'Bookmark ' + id,
      custom_key: 'custom value ' + id
    };
  }

  function uid() {
    return Math.round(Math.random() * 100000).toString(36);
  }

  map.whenReady(function() {

    var bookmarksControl = new L.Control.Bookmarks({
      position: 'topright'
    });
    map.addControl(bookmarksControl);

    it('constructor', () => {
      var coord = getCoord();
      map.fire('bookmark:new', { latlng: coord });

      assert.ok(bookmarksControl._marker, 'marker is present');
      assert.ok(bookmarksControl._popup, 'popup is present');
      assert.ok(coord.equals(bookmarksControl._marker.getLatLng()), 'marker on right coordinate');
      assert.ok(coord.equals(bookmarksControl._popup.getLatLng()), 'popup on right coordinate');
      bookmarksControl._popup._close();
    });

    it('add bookmark', () => {
      var bookmark = getBookmark();
      var coord = bookmark.latlng;
      var id = bookmark.id;
      map.fire('bookmark:add', { data: bookmark });

      assert.ok(bookmarksControl._popup, 'showed popup');
      assert.equal(bookmarksControl._popup._bookmark, bookmark, 'popup linked to bookmark');
      assert.ok(bookmarksControl._list.querySelector("[data-id='" + id + "']"), 'in list')
      assert.equal(bookmarksControl.getData().filter((b) => b.id === id).length, 1, 'in data');
      bookmarksControl._storage.getItem(id, function(item) {
        assert.ok(item, 'in storage');
        assert.equal(item.name, 'Bookmark ' + id, 'correct name');
        assert.equal(item.custom_key, 'custom value ' + id, 'custom value stored');
      });
    });

    it('remove bookmark', () => {
      var bookmark = getBookmark();
      map.fire('bookmark:add', { data: bookmark });
      assert.notEqual(bookmarksControl.getData().indexOf(bookmark), -1, 'stored');
      assert.ok(bookmarksControl._popup, 'popup on the map');

      map.fire('bookmark:remove', { data: bookmark });

      assert.notOk(map.hasLayer(bookmarksControl._marker), 'marker hidden');
      assert.notOk(map.hasLayer(bookmarksControl._popup), 'popup hidden');

      assert.equal(bookmarksControl.getData().indexOf(bookmark), -1, 'removed from data');
      bookmarksControl._storage.getItem(bookmark.id, (item) => {
        assert.notOk(item, 'removed from storage');
      });
    });

    it('edit bookmark', () => {
      var bookmark = getBookmark();
      var coords = new L.LatLng(bookmark.latlng.lat, bookmark.latlng.lng);
      var name = bookmark.name.toString();
      var id = bookmark.id;
      map.fire('bookmark:add', { data: bookmark });
      map.fire('bookmark:edit', { data: bookmark });
      var input = bookmarksControl._popup
        ._contentNode.querySelector('input[type=text]');
      var suffix = ' ' + uid();
      input.value = input.value + suffix;
      var newCoord = getCoord();
      bookmarksControl._marker.setLatLng(newCoord);
      bookmarksControl._marker.fire('dragstart').fire('dragend');

      var form = bookmarksControl._popup._contentNode.querySelector('form');
      map.once('bookmark:saved', (evt) => {
        var item = evt.data;
        assert.notEqual(item.name, name, 'name changed');
        assert.equal(item.name, name + suffix, 'name stored correctly');
        assert.equal(id, item.id, 'same id');
        assert.ok(item.custom_key, 'other keys not lost');
        assert.ok(newCoord.lng === item.latlng[1] &&
          newCoord.lat === item.latlng[0], 'new coord saved');
      });

      bookmarksControl._popup._onSubmit({});
    });

    if (localStorage) localStorage.clear();
  });
});
