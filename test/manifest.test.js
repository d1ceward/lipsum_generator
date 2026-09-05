import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

function read(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

// Reads width and height straight out of the PNG IHDR chunk.
function pngSize(relativePath) {
  const header = readFileSync(new URL(relativePath, import.meta.url)).subarray(0, 24)

  assert.equal(header.subarray(1, 4).toString('ascii'), 'PNG', `${relativePath} is not a PNG`)

  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

const manifest = readJson('../manifest.json')
const locales = readdirSync(new URL('../_locales', import.meta.url))

describe('manifest', () => {
  it('is manifest v3 with a semver-ish version', () => {
    assert.equal(manifest.manifest_version, 3)
    assert.match(manifest.version, /^\d+(\.\d+){1,3}$/)
  })

  it('requests storage and nothing else', () => {
    assert.deepEqual(manifest.permissions, ['storage'])
    assert.equal(manifest.host_permissions, undefined)
    assert.equal(manifest.content_scripts, undefined)
  })

  it('declares icons that exist and match their declared size', () => {
    for (const [size, path] of Object.entries(manifest.icons)) {
      assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} is missing`)

      const { width, height } = pngSize(`../${path}`)

      assert.equal(width, Number(size), `${path} declared as ${size} but is ${width}px wide`)
      assert.equal(height, Number(size), `${path} declared as ${size} but is ${height}px tall`)
    }
  })

  it('keeps the manifest version in step with package.json', () => {
    assert.equal(manifest.version, readJson('../package.json').version)
  })

  it('points at files that exist', () => {
    assert.ok(existsSync(new URL(`../${manifest.action.default_popup}`, import.meta.url)))
  })
})

describe('localization', () => {
  it('declares a default locale that exists', () => {
    assert.ok(locales.includes(manifest.default_locale))
  })

  it('resolves every __MSG_key__ used in the manifest', () => {
    const messages = readJson(`../_locales/${manifest.default_locale}/messages.json`)
    const used = JSON.stringify(manifest).match(/__MSG_(\w+)__/g) || []

    assert.ok(used.length > 0)
    for (const token of used) {
      const key = token.slice(6, -2)

      assert.ok(messages[key], `manifest uses ${token} but ${key} is not defined`)
    }
  })

  it('resolves every data-i18n key used in the popup', () => {
    const messages = readJson(`../_locales/${manifest.default_locale}/messages.json`)
    const html = read('../popup.html')

    for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g))
      assert.ok(messages[key], `popup.html uses data-i18n="${key}" which is not defined`)
  })

  // The popup ships the default-locale text inline so the UI is never blank and
  // reads correctly if i18n ever fails. That fallback has to stay in step.
  it('matches the inline fallback text with the default locale', () => {
    const messages = readJson(`../_locales/${manifest.default_locale}/messages.json`)
    const html = read('../popup.html')
    const tags = html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)

    for (const [, key, fallback] of tags)
      assert.equal(fallback, messages[key].message, `popup.html fallback for ${key} has drifted`)
  })

  it('resolves every t() key used in the popup script', () => {
    const messages = readJson(`../_locales/${manifest.default_locale}/messages.json`)

    for (const [, key] of read('../popup.js').matchAll(/\bt\('([^']+)'\)/g))
      assert.ok(messages[key], `popup.js uses t('${key}') which is not defined`)
  })

  it('keeps every locale in sync with the default one', () => {
    const reference = Object.keys(
      readJson(`../_locales/${manifest.default_locale}/messages.json`)
    ).sort()

    for (const locale of locales) {
      const keys = Object.keys(readJson(`../_locales/${locale}/messages.json`)).sort()

      assert.deepEqual(keys, reference, `_locales/${locale} does not match the default locale`)
    }
  })

  it('gives every message a translator description', () => {
    for (const locale of locales) {
      const messages = readJson(`../_locales/${locale}/messages.json`)

      for (const [key, entry] of Object.entries(messages)) {
        assert.equal(typeof entry.message, 'string', `${locale}/${key} has no message`)
        assert.ok(entry.description, `${locale}/${key} has no description`)
      }
    }
  })
})

describe('packaging', () => {
  const buildScript = read('../build')

  it('ships every file the extension loads at runtime', () => {
    const required = [
      'manifest.json',
      'popup.html',
      'popup.css',
      'popup.js',
      'browser.js',
      'generator.js',
      ...Object.values(manifest.icons),
      ...locales.map(locale => `_locales/${locale}/messages.json`)
    ]

    for (const path of required)
      assert.ok(buildScript.includes(path), `build does not package ${path}`)
  })

  it('ships nothing that does not exist', () => {
    for (const [, path] of buildScript.matchAll(/^\.\/(\S+)$/gm))
      assert.ok(existsSync(new URL(path, `file://${root}`)), `build packages missing file ${path}`)
  })
})
