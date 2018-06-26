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
// Split text by punctuation
function textArray(text) {
  text = text.split(/[.?!]+ /)
  text.pop()
  return text
}

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

// Get example lorem text by xhr
function createContent() {
  var req = new XMLHttpRequest()

  req.open('GET', chrome.extension.getURL('loremIpsum.txt'), true)
  req.onreadystatechange = () => {
    if (req.readyState == 4 && req.responseText) {
      appendContent(textArray(req.responseText))
      return req.responseText
    }
  }
  req.send(null)
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
