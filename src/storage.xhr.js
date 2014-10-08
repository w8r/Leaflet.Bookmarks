/**
 * XHR storage
 * @param {String}  getUrl
 * @param {String=} postUrl
 * @param {String=} deleteUrl
 *
 * @constructor
 */
var XHR = function(getUrl, postUrl, deleteUrl) {

    /**
     * @type {String}
     */
    this._getUrl = getUrl;

    /**
     * @type {String}
     */
    this._postUrl = postUrl || getUrl;

    /**
     * @type {String}
     */
    this._deleteUrl = deleteUrl || getUrl;
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
XHR.prototype.getItem = function(key, callback) {
    ajax.get(this._getUrl, {
        key: key
    }, callback);
};

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
XHR.prototype.setItem = function(key, item, callback) {
    ajax.post(this._postUrl, {
        key: item
    }, callback);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
XHR.prototype.removeItem = function(key, callback) {
    ajax.delete(this._deleteUrl, {
        key: key
    }, callback);
};

/**
 * @param  {String=}  prefix
 * @param  {Function} callback
 */
XHR.prototype.getAllItems = function(callback) {
    ajax.get(this._getUrl, null, callback);
};

module.exports = XHR;
