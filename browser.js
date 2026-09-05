// Firefox exposes the promise-based `browser` namespace, Chrome only `chrome`.
// Both accept the callback style used here, so a plain alias is enough.
export const api = globalThis.browser ?? globalThis.chrome

export function t(key) {
  return api.i18n.getMessage(key) || key
}

// Chrome's namespace is callback-based, Firefox's `browser` one returns a promise and ignores the callback.
// Supporting both means arming each path and letting whichever the browser honours settle the promise.
function bridge(method, ...args) {
  return new Promise((resolve, reject) => {
    const settle = result => {
      const error = api.runtime.lastError

      if (error) reject(new Error(error.message))
      else resolve(result)
    }

    const returned = method(...args, settle)

    if (returned && typeof returned.then === 'function') returned.then(resolve, reject)
  })
}

export function storageGet(key) {
  return bridge(api.storage.sync.get.bind(api.storage.sync), key)
}

export function storageSet(values) {
  return bridge(api.storage.sync.set.bind(api.storage.sync), values)
}

// Fills every [data-i18n] node with its translation. `data-i18n-attr` targets an attribute instead of the
// text content, e.g. data-i18n-attr="aria-label".
export function localize(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const message = t(element.dataset.i18n)
    const attribute = element.dataset.i18nAttr

    if (attribute) element.setAttribute(attribute, message)
    else element.textContent = message
  })
}
