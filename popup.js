document.addEventListener('DOMContentLoaded', () => {
  restoreOptions()

  const copyButton = document.getElementById('copy-button')
  const regenButton = document.getElementById('regenerate-button')
  const textarea = document.getElementById('content-area')
  const paragraphCount = document.getElementById('paragraph-count')
  const paragraphLength = document.getElementById('paragraph-length')
  const paragraphType = document.getElementById('paragraph-type')

  if (paragraphCount)
    handleChange(paragraphCount)

  if (paragraphLength)
    handleChange(paragraphLength)

  if (paragraphType)
    handleChange(paragraphType)

  if (copyButton && textarea) {
    copyButton.onclick = function () {
      textarea.select()
      navigator.clipboard.writeText(textarea.value).then(() => {
        this.textContent = 'Copied!'
        setTimeout(() => {
          this.textContent = 'Copy'
        }, 1200)
      })
    }
  }

  if (regenButton)
    regenButton.onclick = createContent

  if (textarea)
    textarea.onclick = () => textarea.select()
})

// Generate and append lorem ipsum content
function appendContent(content) {
  const paragraphCount = parseInt(document.getElementById('paragraph-count').value, 10)
  const paragraphLength = parseInt(document.getElementById('paragraph-length').value, 10)
  const paragraphType = document.getElementById('paragraph-type').value
  let text = ''

  for (let paragraphIndex = 0; paragraphIndex < paragraphCount; paragraphIndex++) {
    if (paragraphType === 'Yes')
      text += '&lt;p&gt;'

    for (let sentenceIndex = 0; sentenceIndex < paragraphLength; sentenceIndex++) {
      const random = Math.floor(Math.random() * content.length)
      const sentence = content[random]
      text += sentence + (sentenceIndex === paragraphLength - 1 || paragraphType === 'Yes' ? '.' : '. ')
    }

    if (paragraphType === 'Yes')
      text += '&lt;/p&gt;'

    if (paragraphIndex !== paragraphCount - 1)
      text += paragraphType === 'Yes' ? "\n<br/>\n" : "\n\n"
  }

  document.getElementById('content-area').value = text
}

// Generate lorem ipsum text
function createContent() {
  const textArray = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
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

  appendContent(textArray)
}

// Save user options to chrome storage
function saveOptions() {
  const keys = ['paragraph-count', 'paragraph-length', 'paragraph-type']
  const formValues = {}

  keys.forEach(key => {
    formValues[key] = document.getElementById(key).value
  })

  chrome.storage.sync.set({ form_values: formValues })
}

// Restore user options from chrome storage
function restoreOptions() {
  chrome.storage.sync.get('form_values', settings => {
    const defaults = {
      'paragraph-count': '1',
      'paragraph-length': '10',
      'paragraph-type': 'No'
    }
    const values = settings.form_values || defaults

    Object.keys(defaults).forEach(key => {
      document.getElementById(key).value = values[key] || defaults[key]
    })

    createContent()
  })
}

function handleChange(element) {
  element.onchange = () => {
    saveOptions()
    createContent()
  }
}
