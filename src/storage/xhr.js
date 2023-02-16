/**
 * XHR storage
 * @param {Object}  getUrl
 *
 * @constructor
 */
export default class XHR {
  constructor(options) {
    /**
     * @type {*}
     */
    this._transport = this.createTransport(options);

    /**
     * @type {Object}
     */
    this.options = options;
  }

  /**
   * Create transport
   * @return {*}
   */
  createTransport() {}

  /**
   * Create request url
   * @param  {String} requestType
   * @param  {String} type
   * @param  {String} key
   * @return {String}
   */
  getUrl(requestType, type, key) {}

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  getItem(key, callback) {
    this._transport.get(
      this._getUrl,
      {
        key: key,
      },
      callback
    );
  }

  /**
   * @param {String}   key
   * @param {*}        item
   * @param {Function} callback
   */
  setItem(key, item, callback) {
    this._transport.post(
      this._postUrl,
      {
        key: item,
      },
      callback
    );
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  removeItem(key, callback) {
    this._transport.delete(
      this._deleteUrl,
      {
        key: key,
      },
      callback
    );
  }

  /**
   * @param  {String=}  prefix
   * @param  {Function} callback
   */
  getAllItems(callback) {
    this._transport.get(this._getUrl, null, callback);
  }
}
