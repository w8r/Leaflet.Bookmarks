import { unique } from "./string";

import XHR from "./storage/xhr";
import GlobalStorage from "./storage/global";
import LocalStorage from "./storage/localstorage";

/**
 * @const
 * @enum {Number}
 */
export const EngineType = {
  // XHR: 1, // we don't have it included, it's a stub
  GLOBALSTORAGE: 2,
  LOCALSTORAGE: 3,
};

/**
 * Persistent storage, depends on engine choice: localStorage/ajax
 * @param {String} name
 */
export default class Storage {
  constructor(name, engineType) {
    if (typeof name !== "string") {
      engineType = name;
      name = unique();
    }

    /**
     * @type {String}
     */
    this._name = name;

    /**
     * @type {Storage.Engine}
     */
    this._engine = Storage.createEngine(
      engineType,
      this._name,
      Array.prototype.slice.call(arguments, 2)
    );
  }

  /**
   * Engine factory
   * @param  {Number} type
   * @param  {String} prefix
   * @return {Storage.Engine}
   */
  static createEngine(type, prefix, args) {
    if (type === EngineType.GLOBALSTORAGE) {
      return new GlobalStorage(prefix);
    }
    if (type === EngineType.LOCALSTORAGE) {
      return new LocalStorage(prefix);
    }
  }

  /**
   * @param {String}   key
   * @param {*}        item
   * @param {Function} callback
   */
  setItem(key, item, callback) {
    this._engine.setItem(key, item, callback);
    return this;
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  getItem(key, callback) {
    this._engine.getItem(key, callback);
    return this;
  }

  /**
   * @param  {Function} callback
   */
  getAllItems(callback) {
    this._engine.getAllItems(callback);
  }

  /**
   * @param  {String}   key
   * @param  {Function} callback
   */
  removeItem(key, callback) {
    this._engine.removeItem(key, callback);
  }
}
