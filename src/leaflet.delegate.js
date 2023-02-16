import L from "leaflet";

/**
 * Courtesy of https://github.com/component/matches-selector
 */
const matchesSelector = ((ElementPrototype) => {
  const matches =
    ElementPrototype.matches ||
    ElementPrototype.webkitMatchesSelector ||
    ElementPrototype.mozMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    ElementPrototype.oMatchesSelector ||
    // hello IE
    function (selector) {
      var node = this,
        parent = node.parentNode || node.document,
        nodes = parent.querySelectorAll(selector);

      for (var i = 0, len = nodes.length; i < len; ++i) {
        if (nodes[i] == node) return true;
      }
      return false;
    };

  /**
   * @param  {Element} element
   * @param  {String} selector
   * @return {Boolean}
   */
  return function (element, selector) {
    return matches.call(element, selector);
  };
})(Element.prototype);

/**
 * Courtesy of https://github.com/component/closest
 *
 * @param  {Element} element
 * @param  {String}  selector
 * @param  {Boolean} checkSelf
 * @param  {Element} root
 *
 * @return {Element|Null}
 */
function closest(element, selector, checkSelf, root) {
  element = checkSelf
    ? {
        parentNode: element,
      }
    : element;

  root = root || document;

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matchesSelector(element, selector)) return element;
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root) return null;
  }
}

/**
 * Based on https://github.com/component/delegate
 *
 * @param  {Element}  el
 * @param  {String}   selector
 * @param  {String}   type
 * @param  {Function} fn
 *
 * @return {Function}
 */
L.DomEvent.delegate = function (el, selector, type, fn, bind) {
  return L.DomEvent.on(el, type, (evt) => {
    const target = evt.target || evt.srcElement;
    evt.delegateTarget = closest(target, selector, true, el);
    if (evt.delegateTarget && !evt.propagationStopped) {
      fn.call(bind || el, evt);
    }
  });
};
