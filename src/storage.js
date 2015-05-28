var unique = require('./string').unique;

/**
 * Persistent storage, depends on engine choice: localStorage/ajax
 * @param {String} name
 */
var Storage = function(name, engineType) {

  if (typeof name !== 'string') {
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
  this._engine = Storage.createEngine(engineType,
    this._name, Array.prototype.slice.call(arguments, 2));
};

/**
 * @const
 * @enum {Number}
 */
Storage.engineType = {
  // XHR: 1, // we don't have it included
  GLOBALSTORAGE: 2,
  LOCALSTORAGE: 3
};

/**
 * @constructor
 * @typedef {Storage.Engine}
 */
Storage.Engine = {
  //XHR: require('./storage.xhr'),
  Global: require('./storage.global'),
  LocalStorage: require('./storage.localstorage')
};

/**
 * Engine factory
 * @param  {Number} type
 * @param  {String} prefix
 * @return {Storage.Engine}
 */
Storage.createEngine = function(type, prefix, args) {
  if (type === Storage.engineType.GLOBALSTORAGE) {
    return new Storage.Engine.Global(prefix);
  } else if (type === Storage.engineType.LOCALSTORAGE) {
    return new Storage.Engine.LocalStorage(prefix);
  }
};

/**
 * @param {String}   key
 * @param {*}        item
 * @param {Function} callback
 */
Storage.prototype.setItem = function(key, item, callback) {
  this._engine.setItem(key, item, callback);
  return this;
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
Storage.prototype.getItem = function(key, callback) {
  this._engine.getItem(key, callback);
  return this;
};

/**
 * @param  {Function} callback
 */
Storage.prototype.getAllItems = function(callback) {
  this._engine.getAllItems(callback);
};

/**
 * @param  {String}   key
 * @param  {Function} callback
 */
Storage.prototype.removeItem = function(key, callback) {
  this._engine.removeItem(key, callback);
};

module.exports = global.Storage = Storage;
