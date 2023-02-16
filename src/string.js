/**
 * Substitutes {{ obj.field }} in strings
 *
 * @param  {String}  str
 * @param  {Object}  object
 * @param  {RegExp=} regexp
 * @return {String}
 */
export function substitute(str, object, regexp) {
  return str.replace(regexp || /{{([\s\S]+?)}}/g, function (match, name) {
    name = trim(name);

    if (name.indexOf(".") === -1) {
      if (match.charAt(0) == "\\") return match.slice(1);
      return object[name] != null ? object[name] : "";
    } else {
      // nested
      let result = object;
      name = name.split(".");
      for (var i = 0, len = name.length; i < len; i++) {
        if (name[i] in result) result = result[name[i]];
        else return "";
      }
      return result;
    }
  });
}

const alpha = "abcdefghijklmnopqrstuvwxyz";
/**
 * Unique string from date. Puts character at the beginning,
 * for the sake of good manners
 *
 * @return {String}
 */
export function unique(prefix) {
  return (
    (prefix || alpha[Math.floor(Math.random() * alpha.length)]) +
    new Date().getTime().toString(16)
  );
}

/**
 * Trim whitespace
 * @param  {String} str
 * @return {String}
 */
export function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

/**
 * Clean and trim
 * @param  {String} str
 * @return {String}
 */
export function clean(str) {
  return trim(str.replace(/\s+/g, " "));
}
