// Pure lorem ipsum generation. No DOM, no extension APIs, so it can be unit tested.

export const OPENER = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'

export const SENTENCES = [
  OPENER,
  'Curabitur aliquet quam id dui posuere blandit',
  'Cras ultricies ligula sed magna dictum porta',
  'Sed porttitor lectus nibh',
  'Nulla porttitor accumsan tincidunt',
  'Vivamus suscipit tortor eget felis porttitor volutpat',
  'Quisque velit nisi, pretium ut lacinia in, elementum id enim',
  'Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem',
  'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula',
  'Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a',
  'Proin eget tortor risus',
  'Praesent sapien massa, convallis a pellentesque nec, egestas non nisi',
  'Donec rutrum congue leo eget malesuada',
  'Nulla quis lorem ut libero malesuada feugiat',
  'Curabitur non nulla sit amet nisl tempus convallis quis ac lectus',
  'Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui',
  'Pellentesque in ipsum id orci porta dapibus',
  'Donec sollicitudin molestie malesuada',
  'Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus',
  'Duis volutpat fringilla risus, et vulputate lorem tempor sed'
]

export const UNITS = ['sentences', 'words']

export const LIMITS = {
  count: { min: 1, max: 50, default: 1 },
  sentences: { min: 1, max: 50, default: 10 },
  words: { min: 3, max: 1000, default: 75 }
}

// Fisher-Yates on a copy, so the caller's pool is untouched.
function shuffle(items, random) {
  const copy = items.slice()

  for (let index = copy.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1))

    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }

  return copy
}

// Draws sentences without replacement, reshuffling once the bag runs dry, so a paragraph never repeats itself
//  until every sentence has been used.
function createDraw(pool, random, startWithOpener) {
  let bag = []
  let first = true

  return () => {
    if (bag.length === 0) bag = shuffle(pool, random)

    if (first) {
      first = false

      if (startWithOpener) {
        const index = bag.indexOf(OPENER)

        if (index !== -1) {
          bag.splice(index, 1)

          return OPENER
        }
      }
    }

    return bag.pop()
  }
}

// A truncated sentence can end on a comma or semicolon, which reads badly right before the full stop that
// joins it to the next one.
function trimPunctuation(sentence) {
  return sentence.replace(/[,;]+$/, '')
}

function buildBySentences(draw, length) {
  const parts = []

  for (let index = 0; index < length; index++) parts.push(trimPunctuation(draw()))

  return `${parts.join('. ')}.`
}

function buildByWords(draw, length) {
  const parts = []
  let total = 0

  while (total < length) {
    const words = draw()
      .split(' ')
      .slice(0, length - total)

    total += words.length
    parts.push(trimPunctuation(words.join(' ')))
  }

  return `${parts.join('. ')}.`
}

export function clamp(value, { min, max, default: fallback }) {
  const number = Number.parseInt(value, 10)

  if (Number.isNaN(number)) return fallback

  return Math.min(Math.max(number, min), max)
}

/**
 * @param {object} options
 * @param {number} options.count       Number of paragraphs.
 * @param {number} options.length      Sentences or words per paragraph, unit default when omitted.
 * @param {string} options.unit        'sentences' or 'words'.
 * @param {boolean} options.html       Wrap each paragraph in a <p> tag.
 * @param {string[]} options.sentences Sentence pool to draw from.
 * @param {() => number} options.random Source of randomness, injectable for tests.
 * @returns {string}
 */
export function generate({
  count = LIMITS.count.default,
  length = null,
  unit = 'sentences',
  html = false,
  sentences = SENTENCES,
  random = Math.random
} = {}) {
  if (sentences.length === 0) return ''

  const limits = LIMITS[unit] || LIMITS.sentences
  const paragraphCount = clamp(count, LIMITS.count)
  const paragraphLength = clamp(length === null ? limits.default : length, limits)
  const draw = createDraw(sentences, random, sentences.includes(OPENER))
  const build = unit === 'words' ? buildByWords : buildBySentences
  const paragraphs = []

  for (let index = 0; index < paragraphCount; index++) {
    const body = build(draw, paragraphLength)

    paragraphs.push(html ? `<p>${body}</p>` : body)
  }

  return paragraphs.join(html ? '\n' : '\n\n')
}
