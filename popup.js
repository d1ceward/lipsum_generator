restore_options();

// ==> Handler functions
// Handle paragraph count changes
document.getElementById('paragraph-count').onchange = () => {
  createContent()
  save_options()
}

// Handle sentence count changes
document.getElementById('paragraph-length').onchange = () => {
  createContent()
  save_options()
}

// Handle paragraph type changes
document.getElementById('paragraph-type').onchange = () => {
  createContent()
  save_options()
}

// ==> Text generation functions
function appendContent(content) {
  var text = ''
  var paragraphCount = document.getElementById('paragraph-count').value
  var paragraphLength = document.getElementById('paragraph-length').value
  var paragraphType = document.getElementById('paragraph-type').value

  // Paragraph
  for (var paragraphIndex = 0; paragraphIndex < paragraphCount; paragraphIndex++) {
    if (paragraphType == 'Yes')
      text = text + '&lt;p&gt;'

    // Sentence
    for (var sentenceIndex = 0; sentenceIndex < paragraphLength; sentenceIndex++) {
      var random = Math.floor(Math.random() * 19)
      var sentence = content[random]

      // Append space after punctuation if not last
      if (sentenceIndex == paragraphLength - 1 || paragraphType == 'Yes')
        text += sentence + '.'
      else
        text += sentence + '. '
    }

    if (paragraphType == 'Yes')
      text = text + '&lt;/p&gt;'

    if (paragraphIndex != paragraphCount - 1)
      if (paragraphType == 'Yes')
        text += "\n<br/>\n"
      else
        text += "\n\n"
  }

  document.getElementById('content-area').innerHTML = text
}

// Get example lorem text
function createContent() {
  var textArray = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    'Curabitur aliquet quam id dui posuere blandit',
    'Cras ultricies ligula sed magna dictum porta',
    'Sed porttitor lectus nibh',
    'Nulla porttitor accumsan tincidunt',
    'Vivamus suscipit tortor eget felis porttitor volutpat',
    'Quisque velit nisi, pretium ut lacinia in, elementum id enim',
    'Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem',
    'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit ' +
      'neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula',
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

// ==> Settings function
function save_options() {
  var defaults = {
    'form_values': {
      'paragraph-count': '1',
      'paragraph-length': '10',
      'paragraph-type': 'No'
    }
  }
  var settings = { 'form_values': {} }

  for (var key in defaults.form_values)
    settings['form_values'][key] = document.getElementById(key).value

  chrome.storage.sync.set(settings)
}

function restore_options() {
  chrome.storage.sync.get('form_values', (settings) => {
    for (var key in settings.form_values)
      document.getElementById(key).value = settings.form_values[key]

    createContent()
  })
}
