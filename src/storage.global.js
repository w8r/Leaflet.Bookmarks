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
