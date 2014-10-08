var L = global.L || require('leaflet');
require('../index');
require('Leaflet.contextmenu');

L.Icon.Default.imagePath = "http://cdn.leafletjs.com/leaflet-0.7/images";

var map = global.map = new L.Map('map', {
    contextmenu: true,
    contextmenuItems: [{
        text: 'Bookmark this position',
        callback: function(evt) {
            this.fire('bookmark:new', {
                latlng: evt.latlng
            });
        }
    }]
}).setView([22.2670, 114.188], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; ' +
        '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var bookmarksControl = new L.Control.Bookmarks();
map.addControl(bookmarksControl);
