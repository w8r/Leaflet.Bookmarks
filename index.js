/**
 * Leaflet bookmarks plugin
 * @license MIT
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */
var L = global.L || require('leaflet');

L.Control.Bookmarks = module.exports = require('./src/bookmarks');
