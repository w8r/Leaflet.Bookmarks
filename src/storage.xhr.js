/**
 * XHR storage
 * @param {Object}  getUrl
 *
 * @constructor
 */
var XHR = function(options) {

  /**
   * @type {*}
   */
  this._transport = this.createTransport(options);

  /**
   * @type {Object}
   */
  this.options = options;
};

/**
 * Create transport
 * @return {*}
 */
XHR.prototype.createTransport = function() {};

/**
 * Create request url
 * @param  {String} requestType
 * @param  {String} type
 * @param  {String} key
 * @return {String}
 */
XHR.prototype.getUrl = function(requestType, type, key) {},

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  XHR.prototype.getItem = function(key, callback) {
    this._transport.get(this._getUrl, {
      key: key
    }, callback);
  };

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
XHR.prototype.setItem = function(key, item, callback) {
  this._transport.post(this._postUrl, {
    key: item
  }, callback);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
XHR.prototype.removeItem = function(key, callback) {
  this._transport.delete(this._deleteUrl, {
    key: key
  }, callback);
};

/**
 * @param  {String=}  prefix
 * @param  {Function} callback
 */
XHR.prototype.getAllItems = function(callback) {
  this._transport.get(this._getUrl, null, callback);
};

module.exports = XHR;
