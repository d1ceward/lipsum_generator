restore_options();

// ==> Handler functions
// Handle paragraph count changes
document.getElementById('pCountId').onchange = () => {
  createContent()
  save_options()
}

// Handle sentence count changes
document.getElementById('pLengthId').onchange = () => {
  createContent()
  save_options()
}

// Handle paragraph type changes
document.getElementById('pTypeId').onchange = () => {
  createContent()
  save_options()
}

// ==> Text generation functions
function appendContent(content) {
  var text = ''
  var loopCount = document.getElementById('pLengthId').value
  var pNum = document.getElementById('pCountId').value
  var pType = document.getElementById('pTypeId').value

  // Paragraph
  for (var pCount = 0; pCount < pNum; pCount++) {
    if (pType == 'Yes')
      text = text + '&lt;p&gt;'
    // Sentence
    for (var sCount = 0; sCount < loopCount; sCount++) {
      var rand = Math.floor((Math.random()*19))
      var sentence = content[rand]

      // Append space after punctuation if not last
      if (sCount == loopCount - 1 || pType == 'Yes')
        text += sentence + '.'
      else
        text += sentence + '. '
    }
    if (pType == 'Yes')
      text = text + '&lt;/p&gt;'
    if (pCount != pNum - 1)
      if (pType == 'Yes')
        text += "\n<br/>\n"
      else
        text += "\n\n"

  }
  document.getElementById('contGenId').innerHTML = text
}

// Get example lorem text
function createContent() {
  var textArray = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Curabitur aliquet quam id dui posuere blandit.',
    'Cras ultricies ligula sed magna dictum porta.',
    'Sed porttitor lectus nibh.',
    'Nulla porttitor accumsan tincidunt.',
    'Vivamus suscipit tortor eget felis porttitor volutpat.',
    'Quisque velit nisi, pretium ut lacinia in, elementum id enim.',
    'Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem.',
    'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit ' +
      'neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.',
    'Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.',
    'Proin eget tortor risus.',
    'Praesent sapien massa, convallis a pellentesque nec, egestas non nisi.',
    'Donec rutrum congue leo eget malesuada.',
    'Nulla quis lorem ut libero malesuada feugiat.',
    'Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.',
    'Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui.',
    'Pellentesque in ipsum id orci porta dapibus.',
    'Donec sollicitudin molestie malesuada.',
    'Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.',
    'Duis volutpat fringilla risus, et vulputate lorem tempor sed.'
  ]

  appendContent(textArray)
}

// ==> Settings function
function save_options() {
  var defaults = { 'form_values': { pCountId: '1', pLengthId: '10' } }
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
