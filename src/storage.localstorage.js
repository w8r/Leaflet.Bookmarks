/**
 * LocalStoarge based storage
 * @constructor
 */
var LocalStorage = function(prefix) {
  /**
   * @type {String}
   */
  this._prefix = prefix;

  /**
   * @type {LocalStorage}
   */
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
    if (this._storage.getItem(key) !== null &&
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
  this.getItem(key, function(item) {
    self._storage.removeItem(self._prefix + key);
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
