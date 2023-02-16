/**
 * @const
 * @type {RegExp}
 */
const JSON_RE = /^[\{\[](.)*[\]\}]$/;

/**
 * LocalStoarge based storage
 */
export default class LocalStorage {
  constructor(prefix) {
    /**
     * @type {String}
     */
    this._prefix = prefix;

    /**
     * @type {LocalStorage}
     */
    this._storage = window.localStorage;
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  getItem(key, callback) {
    let item = this._storage.getItem(this._prefix + key);
    if (item && JSON_RE.test(item)) {
      item = JSON.parse(item);
    }
    callback(item);
  }

  /**
   * @param  {Function} callback
   */
  getAllItems(callback) {
    const items = [];
    const prefixLength = this._prefix.length;
    for (const key in this._storage) {
      if (
        this._storage.getItem(key) !== null &&
        key.indexOf(this._prefix) === 0
      ) {
        this.getItem(key.substring(prefixLength), (item) => items.push(item));
      }
    }
    callback(items);
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  removeItem(key, callback) {
    const self = this;
    this.getItem(key, (item) => {
      this._storage.removeItem(self._prefix + key);
      if (callback) callback(item);
    });
  }

  /**
   * @param  {String}   key
   * @param  {*}        item
   * @param  {Function} callback
   */
  setItem(key, item, callback) {
    let itemStr = item.toString();
    if (itemStr === "[object Object]") {
      itemStr = JSON.stringify(item);
    }
    this._storage.setItem(this._prefix + key, itemStr);
    callback(item);
  }
}
