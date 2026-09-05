import { api, localize, storageGet, storageSet, t } from './browser.js'
import { clamp, generate, LIMITS, UNITS } from './generator.js'

const STORAGE_KEY = 'form_values'
const DEFAULTS = {
  count: LIMITS.count.default,
  length: LIMITS.sentences.default,
  unit: 'sentences',
  html: false
}

const elements = {}

document.addEventListener('DOMContentLoaded', () => {
  localize()

  elements.count = document.getElementById('paragraph-count')
  elements.length = document.getElementById('paragraph-length')
  elements.unit = document.getElementById('length-unit')
  elements.html = document.getElementById('html-tags')
  elements.output = document.getElementById('content-area')
  elements.status = document.getElementById('status')
  elements.copy = document.getElementById('copy-button')
  elements.regenerate = document.getElementById('regenerate-button')
  elements.version = document.getElementById('version')

  elements.version.textContent = api.runtime.getManifest().version
  elements.count.min = LIMITS.count.min
  elements.count.max = LIMITS.count.max

  ;[elements.count, elements.length, elements.html].forEach(element => {
    element.addEventListener('change', persistAndRender)
  })

  // Switching unit rescales the meaning of the length field, so it restarts from the new unit's default
  // rather than carrying over a number that made sense in sentences but not in words.
  elements.unit.addEventListener('change', () => {
    elements.length.value = LIMITS[currentUnit()].default
    persistAndRender()
  })

  elements.copy.addEventListener('click', copyToClipboard)
  elements.regenerate.addEventListener('click', render)

  restoreOptions()
})

function currentUnit() {
  return UNITS.includes(elements.unit.value) ? elements.unit.value : DEFAULTS.unit
}

function persistAndRender() {
  saveOptions()
  render()
}

function readOptions() {
  const unit = currentUnit()

  return {
    count: clamp(elements.count.value, LIMITS.count),
    length: clamp(elements.length.value, LIMITS[unit]),
    unit,
    html: elements.html.checked
  }
}

function writeOptions(options) {
  elements.count.value = options.count
  elements.unit.value = options.unit
  elements.html.checked = options.html
  applyLengthLimits()
  elements.length.value = options.length
}

// Sentence and word counts live on very different scales, so the length field follows whichever unit is
// selected.
function applyLengthLimits() {
  const limits = LIMITS[currentUnit()]
  const previous = Number.parseInt(elements.length.value, 10)

  elements.length.min = limits.min
  elements.length.max = limits.max
  elements.length.value = Number.isNaN(previous) ? limits.default : clamp(previous, limits)
}

function render() {
  const options = readOptions()

  writeOptions(options)
  elements.output.value = generate(options)
}

async function saveOptions() {
  try {
    await storageSet({ [STORAGE_KEY]: readOptions() })
  } catch (error) {
    announce(error.message)
  }
}

async function restoreOptions() {
  let stored = null

  try {
    stored = (await storageGet(STORAGE_KEY))?.[STORAGE_KEY]
  } catch (error) {
    announce(error.message)
  }

  const options = migrate(stored)

  writeOptions(options)
  render()

  // Rewrite the record straight away when it came from an older layout, so the legacy keys are not carried
  // around for the life of the profile.
  if (isLegacy(stored)) saveOptions()
}

function isLegacy(stored) {
  return Boolean(stored) && ('paragraph-count' in stored || 'paragraph-type' in stored)
}

// Versions up to 1.4.0 stored hyphenated keys with 'Yes'/'No' for the HTML flag.
function migrate(stored) {
  if (!stored) return { ...DEFAULTS }

  if (isLegacy(stored)) {
    return {
      count: clamp(stored['paragraph-count'], LIMITS.count),
      length: clamp(stored['paragraph-length'], LIMITS.sentences),
      unit: 'sentences',
      html: stored['paragraph-type'] === 'Yes'
    }
  }

  const unit = UNITS.includes(stored.unit) ? stored.unit : DEFAULTS.unit

  return {
    count: clamp(stored.count, LIMITS.count),
    length: clamp(stored.length, LIMITS[unit]),
    unit,
    html: Boolean(stored.html)
  }
}

function copyToClipboard() {
  navigator.clipboard
    .writeText(elements.output.value)
    .then(() => feedback(elements.copy, t('buttonCopied')))
    .catch(() => feedback(elements.copy, t('buttonCopyFailed')))
}

// Briefly swaps a button label and mirrors it to the live region, so the result is announced instead of only
// being visible.
function feedback(button, message) {
  const original = button.dataset.label || button.textContent

  button.dataset.label = original
  button.textContent = message
  announce(message)
  clearTimeout(Number(button.dataset.timer))
  button.dataset.timer = String(
    setTimeout(() => {
      button.textContent = original
    }, 1200)
  )
}

function announce(message) {
  elements.status.textContent = message
}
