/**
 * @type {Object}
 */
const data = {};

/**
 * Object based storage
 * @class Storage.Engine.Global
 * @constructor
 */
export default class GlobalStorage {
  constructor(prefix) {
    /**
     * @type {String}
     */
    this._prefix = prefix;
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  getItem(key, callback) {
    callback(data[this._prefix + key]);
  }

  /**
   * @param {String}   key
   * @param {*}        item
   * @param {Function} callback
   */
  setItem(key, item, callback) {
    data[this._prefix + key] = item;
    callback(item);
  }

  /**
   * @param  {Function} callback
   */
  getAllItems(callback) {
    const items = [];
    for (const key in data) {
      if (data.hasOwnProperty(key) && key.indexOf(this_prefix) === 0) {
        items.push(data[key]);
      }
    }
    callback(items);
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  removeItem(key, callback) {
    this.getItem(key, (item) => {
      if (item) {
        delete data[this._prefix + key];
      } else {
        item = null;
      }
      if (callback) callback(item);
    });
  }
}
