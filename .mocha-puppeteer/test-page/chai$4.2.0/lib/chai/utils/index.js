$_mod.def("/chai$4.2.0/lib/chai/utils/index", function(require, exports, module, __filename, __dirname) { /*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Dependencies that are used for multiple exports are required here only once
 */

var pathval = require('/pathval$1.1.0/index'/*'pathval'*/);

/*!
 * test utility
 */

exports.test = require('/chai$4.2.0/lib/chai/utils/test'/*'./test'*/);

/*!
 * type utility
 */

exports.type = require('/type-detect$4.0.8/type-detect'/*'type-detect'*/);

/*!
 * expectTypes utility
 */
exports.expectTypes = require('/chai$4.2.0/lib/chai/utils/expectTypes'/*'./expectTypes'*/);

/*!
 * message utility
 */

exports.getMessage = require('/chai$4.2.0/lib/chai/utils/getMessage'/*'./getMessage'*/);

/*!
 * actual utility
 */

exports.getActual = require('/chai$4.2.0/lib/chai/utils/getActual'/*'./getActual'*/);

/*!
 * Inspect util
 */

exports.inspect = require('/chai$4.2.0/lib/chai/utils/inspect'/*'./inspect'*/);

/*!
 * Object Display util
 */

exports.objDisplay = require('/chai$4.2.0/lib/chai/utils/objDisplay'/*'./objDisplay'*/);

/*!
 * Flag utility
 */

exports.flag = require('/chai$4.2.0/lib/chai/utils/flag'/*'./flag'*/);

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('/chai$4.2.0/lib/chai/utils/transferFlags'/*'./transferFlags'*/);

/*!
 * Deep equal utility
 */

exports.eql = require('/deep-eql$3.0.1/index'/*'deep-eql'*/);

/*!
 * Deep path info
 */

exports.getPathInfo = pathval.getPathInfo;

/*!
 * Check if a property exists
 */

exports.hasProperty = pathval.hasProperty;

/*!
 * Function name
 */

exports.getName = require('/get-func-name$2.0.0/index'/*'get-func-name'*/);

/*!
 * add Property
 */

exports.addProperty = require('/chai$4.2.0/lib/chai/utils/addProperty'/*'./addProperty'*/);

/*!
 * add Method
 */

exports.addMethod = require('/chai$4.2.0/lib/chai/utils/addMethod'/*'./addMethod'*/);

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('/chai$4.2.0/lib/chai/utils/overwriteProperty'/*'./overwriteProperty'*/);

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('/chai$4.2.0/lib/chai/utils/overwriteMethod'/*'./overwriteMethod'*/);

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('/chai$4.2.0/lib/chai/utils/addChainableMethod'/*'./addChainableMethod'*/);

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('/chai$4.2.0/lib/chai/utils/overwriteChainableMethod'/*'./overwriteChainableMethod'*/);

/*!
 * Compare by inspect method
 */

exports.compareByInspect = require('/chai$4.2.0/lib/chai/utils/compareByInspect'/*'./compareByInspect'*/);

/*!
 * Get own enumerable property symbols method
 */

exports.getOwnEnumerablePropertySymbols = require('/chai$4.2.0/lib/chai/utils/getOwnEnumerablePropertySymbols'/*'./getOwnEnumerablePropertySymbols'*/);

/*!
 * Get own enumerable properties method
 */

exports.getOwnEnumerableProperties = require('/chai$4.2.0/lib/chai/utils/getOwnEnumerableProperties'/*'./getOwnEnumerableProperties'*/);

/*!
 * Checks error against a given set of criteria
 */

exports.checkError = require('/check-error$1.0.2/index'/*'check-error'*/);

/*!
 * Proxify util
 */

exports.proxify = require('/chai$4.2.0/lib/chai/utils/proxify'/*'./proxify'*/);

/*!
 * addLengthGuard util
 */

exports.addLengthGuard = require('/chai$4.2.0/lib/chai/utils/addLengthGuard'/*'./addLengthGuard'*/);

/*!
 * isProxyEnabled helper
 */

exports.isProxyEnabled = require('/chai$4.2.0/lib/chai/utils/isProxyEnabled'/*'./isProxyEnabled'*/);

/*!
 * isNaN method
 */

exports.isNaN = require('/chai$4.2.0/lib/chai/utils/isNaN'/*'./isNaN'*/);

});