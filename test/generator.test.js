import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { clamp, generate, LIMITS, OPENER, SENTENCES } from '../generator.js'

// Deterministic stand-in for Math.random, cycling through fixed values.
function seeded(values) {
  let index = 0

  return () => values[index++ % values.length]
}

function sentencesOf(paragraph) {
  return paragraph
    .replace(/<\/?p>/g, '')
    .replace(/\.$/, '')
    .split('. ')
}

describe('generate', () => {
  it('starts with the canonical lorem ipsum opener', () => {
    for (let run = 0; run < 50; run++)
      assert.ok(generate({ count: 2, length: 3 }).startsWith(OPENER))
  })

  it('never repeats a sentence while the pool has unused ones', () => {
    for (let run = 0; run < 200; run++) {
      const parts = sentencesOf(generate({ count: 1, length: SENTENCES.length }))

      assert.equal(new Set(parts).size, SENTENCES.length)
    }
  })

  it('gives every paragraph its own bag instead of sharing one', () => {
    const length = SENTENCES.length - 5

    for (let run = 0; run < 200; run++) {
      const paragraphs = generate({ count: 3, length }).split('\n\n')

      for (const paragraph of paragraphs) assert.equal(new Set(sentencesOf(paragraph)).size, length)
    }
  })

  it('reshuffles instead of running dry when more sentences are asked for', () => {
    const text = generate({ count: 1, length: SENTENCES.length + 5 })

    assert.equal(sentencesOf(text).length, SENTENCES.length + 5)
    assert.ok(!text.includes('undefined'))
  })

  it('produces the requested number of paragraphs and sentences', () => {
    const text = generate({ count: 4, length: 3 })
    const paragraphs = text.split('\n\n')

    assert.equal(paragraphs.length, 4)
    for (const paragraph of paragraphs) assert.equal(sentencesOf(paragraph).length, 3)
  })

  it('ends every paragraph with a single full stop', () => {
    generate({ count: 3, length: 2 })
      .split('\n\n')
      .forEach(paragraph => {
        assert.match(paragraph, /[^.]\.$/)
      })
  })

  it('wraps each paragraph in a p tag in html mode', () => {
    const lines = generate({ count: 3, length: 2, html: true }).split('\n')

    assert.equal(lines.length, 3)
    for (const line of lines) assert.match(line, /^<p>.+<\/p>$/)
  })

  it('separates plain paragraphs with a blank line and html ones with a newline', () => {
    assert.ok(generate({ count: 2, length: 1 }).includes('\n\n'))
    assert.ok(!generate({ count: 2, length: 1, html: true }).includes('\n\n'))
  })

  it('counts words exactly in word mode', () => {
    for (const length of [3, 7, 40, 137]) {
      const words = generate({ count: 1, length, unit: 'words' }).split(/\s+/)

      assert.equal(words.length, length)
    }
  })

  it('applies the word count to every paragraph', () => {
    generate({ count: 3, length: 12, unit: 'words' })
      .split('\n\n')
      .forEach(paragraph => {
        assert.equal(paragraph.split(/\s+/).length, 12)
      })
  })

  it('does not leave a dangling comma before a full stop', () => {
    for (let run = 0; run < 200; run++) {
      assert.doesNotMatch(generate({ count: 2, length: 9, unit: 'words' }), /[,;]\./)
      assert.doesNotMatch(generate({ count: 2, length: 4 }), /[,;]\./)
    }
  })

  it('clamps out-of-range and malformed input', () => {
    assert.equal(generate({ count: 0, length: 1 }).split('\n\n').length, LIMITS.count.min)
    assert.equal(generate({ count: 999, length: 1 }).split('\n\n').length, LIMITS.count.max)
    assert.equal(sentencesOf(generate({ count: 1, length: -4 })).length, LIMITS.sentences.min)
    assert.equal(
      sentencesOf(generate({ count: 1, length: 'abc' })).length,
      LIMITS.sentences.default
    )
  })

  it('falls back to the unit default when length is omitted', () => {
    assert.equal(sentencesOf(generate({ count: 1 })).length, LIMITS.sentences.default)
    assert.equal(generate({ count: 1, unit: 'words' }).split(/\s+/).length, LIMITS.words.default)
  })

  it('treats an unknown unit as sentences', () => {
    assert.equal(sentencesOf(generate({ count: 1, length: 5, unit: 'pages' })).length, 5)
  })

  it('is deterministic for a given random source', () => {
    const run = () =>
      generate({
        count: 3,
        length: 6,
        random: seeded([0.1, 0.9, 0.42, 0.7, 0.05])
      })

    assert.equal(run(), run())
    assert.notEqual(run(), generate({ count: 3, length: 6, random: seeded([0.8, 0.2, 0.6]) }))
  })

  it('leaves the caller pool untouched', () => {
    const pool = SENTENCES.slice()

    generate({ count: 2, length: 30, sentences: pool })
    assert.deepEqual(pool, SENTENCES)
  })

  it('honours a custom pool without the opener', () => {
    const text = generate({ count: 1, length: 2, sentences: ['Alpha beta', 'Gamma delta'] })

    assert.ok(!text.includes(OPENER))
    assert.match(text, /^(Alpha beta|Gamma delta)\. (Alpha beta|Gamma delta)\.$/)
  })

  it('returns an empty string for an empty pool', () => {
    assert.equal(generate({ sentences: [] }), '')
  })

  it('works with no arguments at all', () => {
    assert.ok(generate().startsWith(OPENER))
  })
})

describe('clamp', () => {
  const limits = { min: 2, max: 8, default: 5 }

  it('keeps in-range values', () => {
    assert.equal(clamp(4, limits), 4)
    assert.equal(clamp('4', limits), 4)
  })

  it('pins values to the bounds', () => {
    assert.equal(clamp(0, limits), 2)
    assert.equal(clamp(99, limits), 8)
  })

  it('falls back to the default for anything unparseable', () => {
    assert.equal(clamp(undefined, limits), 5)
    assert.equal(clamp(null, limits), 5)
    assert.equal(clamp('', limits), 5)
    assert.equal(clamp('nope', limits), 5)
  })
})
