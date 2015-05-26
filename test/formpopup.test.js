"use strict";

var L = require('leaflet');
var Bookmarks = require('../index');
var tape = require('tape');

tape.test('L.Bookmarks.FormPopup', function(t) {

  var container = L.DomUtil.create('div', 'map', document.body);
  L.Icon.Default.imagePath = "http://cdn.leafletjs.com/leaflet-0.7/images";

  var map = new L.Map(container, {}).setView([22.2670, 114.188], 13);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; ' +
      '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);



  map.whenReady(function() {

    var bookmarksControl = new L.Control.Bookmarks({
      position: 'topright'
    });
    map.addControl(bookmarksControl);

    t.test('constructor', function(t) {
      var coord = map.getCenter();
      map.fire('bookmark:new', {
        latlng: coord
      });
      t.ok(bookmarksControl._marker, 'marker is present');
      t.ok(bookmarksControl._popup, 'popup is present');
      t.ok(coord.equals(bookmarksControl._marker.getLatLng()), 'marker on right coordinate');
      t.ok(coord.equals(bookmarksControl._popup.getLatLng()), 'popup on right coordinate');
      t.end();
    });



    t.end();
  });
});
