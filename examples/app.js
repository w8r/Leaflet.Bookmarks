var L = global.L || require('leaflet');
require('../index');
require('../bower_components/Leaflet.contextmenu/dist/leaflet.contextmenu.js');
require('leaflet-modal');

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

// var bookmarksControl = global.bookmarksControlRight = new L.Control.Bookmarks({
//   position: 'topright'
// });
// map.addControl(bookmarksControl);

bookmarksControl = global.bookmarksControlLeft = new L.Control.Bookmarks({
  position: 'topleft',
  onRemove: function(bookmark, callback) {
    map.fire('modal', {
      title: 'Are you sure?',
      content: '<p>Do you wnat to remove bookmark <strong>' + bookmark.name + '</strong>?</p>',
      template: ['<div class="modal-header"><h2>{title}</h2></div>',
        '<hr>',
        '<div class="modal-body">{content}</div>',
        '<div class="modal-footer">',
        '<button class="topcoat-button--large {OK_CLS}">{okText}</button>',
        '<button class="topcoat-button--large {CANCEL_CLS}">{cancelText}</button>',
        '</div>'
      ].join(''),

      okText: 'Ok',
      cancelText: 'Cancel',
      OK_CLS: 'modal-ok',
      CANCEL_CLS: 'modal-cancel',

      width: 300,

      onShow: function(evt) {
        var modal = evt.modal;
        L.DomEvent
          .on(modal._container.querySelector('.modal-ok'), 'click', function() {
            modal.hide();
            callback(true);
          })
          .on(modal._container.querySelector('.modal-cancel'), 'click', function() {
            modal.hide();
            callback(false)
          });
      }
    });
  },
});
map.addControl(bookmarksControl);
