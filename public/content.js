/*global chrome*/
var OPENAI_API_KEY = "";

let _url = window.location.href;
if (_url.includes('meet.google') || _url.includes('teams.live')) {
  run();
}
chrome.runtime.onMessage.addListener((event) => {
  if (event) {
    switch (event.action) {
      case 'storage.set':
        OPENAI_API_KEY = event.key
        break
      case 'storage.delete':
        OPENAI_API_KEY = ''
        break
    }
  }
})
let firstActivation = true;
let history = new Map();
let printHistory = [];
let selectedHistory = [];
let text = [];

function run() {
  chrome.runtime.sendMessage({ action: 'storage.get' }, (ev) => {
    OPENAI_API_KEY = ev
  })

  function extractTextFromSpans(elements) {
    return Array.from(elements).map(element => element.innerText).join(' ');
  }
  function mergeStringsRemoveDuplicates(str1, str2) {
    // Combine the two strings
    let combinedStr = str1 + " " + str2;

    // Split the combined string into an array of words
    let words = combinedStr.split(/\s+/);

    // Create an object to store unique words
    let uniqueWords = {};

    // Filter out duplicates while preserving order
    let uniqueWordsArray = words.filter(word => {
      if (!uniqueWords[word]) {
        uniqueWords[word] = true;
        return true;
      }
      return false;
    });

    // Join the unique words into a string
    let resultStr = uniqueWordsArray.join(' ');

    return resultStr;
  }

  function removeDuplicateContexts(inputStr) {
    // Split the input string into an array of contexts
    let contexts = inputStr.split(/[.!?]\s+/);

    // Create an object to store unique contexts
    let uniqueContexts = {};

    // Filter out duplicates while preserving order
    let uniqueContextsArray = contexts.filter(context => {
      if (!uniqueContexts[context]) {
        uniqueContexts[context] = true;
        return true;
      }
      return false;
    });

    // Join the unique contexts into a string
    let resultStr = uniqueContextsArray.join('. ');

    return resultStr;
  }

  var stringSize = 850;
  function addToHistory(teller, nt) {
    if (nt.trim('') === '') return
    let actual = history.get(teller) ?? '';

    if (actual && actual.length > 0) {
      let treating = actual[actual.length - 1];
      history.get(teller).pop()
      nt = mergeStringsRemoveDuplicates(treating.value, nt)
    }
    nt = removeDuplicateContexts(nt)

    setHistory = (hist) => {
      if (history.get(teller)) {
        history.get(teller).push({ printed: false, value: hist });
      }
      else
        history.set(teller, [{ printed: false, value: hist }]);
    }

    let nextIndex;
    while (nt.length > stringSize) {
      nextIndex = nt.substring(stringSize).indexOf('.') + 1;
      if (nextIndex == 0) nt.substring(stringSize).indexOf('?') + 1;
      if (nextIndex == 0) nt.substring(stringSize).indexOf(' ') + 1;
      if (nextIndex == 0) {
        setHistory(nt);
        nt = ''
      } else {
        nextIndex += stringSize
        setHistory(nt.substring(0, nextIndex));
        nt = nt.substring(nextIndex);
      }

    }

    if (nt.length > 0)
      setHistory(nt);

    setPrintHistory();
  }

  function setPrintHistory() {
    printHistory = [];

    function breakText(text) {
      const sentenceEnders = new Set(['.', '!', '?']);
      const minChunkLength = 45;
      let result = [];
      let currentChunk = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        currentChunk += char;

        if (currentChunk.length >= minChunkLength && sentenceEnders.has(char) && i < text.length - 1 && text[i + 1] === ' ') {
          result.push(currentChunk.trim());
          currentChunk = '';
          // Skip the space after the sentence end
          i++;
        }
      }

      if (currentChunk.trim() !== '') {
        result.push(currentChunk.trim());
      }

      return result;
    }
    index = 0;
    for (const [key, items] of history.entries()) {
      items.forEach(value => {
        const chunks = breakText(value.value);
        chunks.forEach((chunk) => {
          printHistory.push({ key, selected: selectedHistory.indexOf(index) > -1, value: chunk });
          index++
        });
      });
    }
  }

  function selectItem(key) {
    if (selectedHistory.indexOf(key) > -1)
      selectedHistory = selectedHistory.filter(i => i != key)
    else
      selectedHistory.push(key)
    setPrintHistory();
  }

  function inputBox(selected, value, index) {
    const inp = document.createElement('input');
    const par = document.createElement('p');
    const lab = document.createElement('label');

    lab.classList.add('label-history');
    par.classList.add('p-history');
    inp.classList.add('my-checkbox');

    inp.type = 'checkbox';
    inp.checked = selected;

    par.onclick = () => {
      selectItem(index);
      printText();
    };

    lab.innerHTML = value;
    par.append(inp, lab);
    return par;
  }

  function printText() {
    const view = getView();
    view.innerHTML = '';
    let last;
    printHistory.forEach(({ key, selected, value }, index) => {
      const res = document.createElement('div');
      res.classList.add('container-history');

      const nam = document.createElement('span');
      nam.innerHTML = key;
      if (last != key)
        res.append(nam, inputBox(selected, value, index));
      else
        res.append(inputBox(selected, value, index));
      last = key;

      view.append(res);

    });

    view.scrollTop = view.scrollHeight;
  }

  function readText() {
    try {
      if (firstActivation) {
        document.querySelector('.juFBl').querySelector('[aria-pressed=false]').click();
        firstActivation = false
      } else {
        if (document.querySelector('.juFBl').querySelector('[aria-pressed=false]')) {
          updateAlert('Activate Subtitle to start.', 15, alertType.warning)
        }
      }
    } catch (err) { console.log('not in screen yet') }

    //Google Meeting
    let tellerElements = document.querySelectorAll('.zs7s8d');
    let subtitleElements = document.querySelectorAll('.iTTPOb');

    if (_url.includes('teams.live')) {
      let iframe = document.getElementsByTagName('iframe')[0]
      if (iframe && tellerElements.length == 0 && tellerElements.length == 0) {
        //Teams
        const iframeDocument = iframe?.contentDocument || iframe?.contentWindow.document;
        if (iframeDocument) {
          tellerElements = iframeDocument.querySelectorAll('.ui-chat__message__author');
          subtitleElements = iframeDocument.querySelectorAll('[data-tid="closed-caption-text"]');
        }
      }
    }

    // Check if at least one teller element is found
    if (tellerElements.length > 0) {
      // Use the first teller element as the single teller
      teller = tellerElements[0].innerText;

      // Check if at least one subtitle element is found
      if (subtitleElements.length > 0) {
        let extactedText = extractTextFromSpans(subtitleElements);
        // text.push(teller, extactedText);
        addToHistory(teller, extactedText)
        printText()
      }
    }
    setTimeout(readText, 3000);
  }
  alertType = {
    success: 'green',
    warning: 'yellow',
    error: 'red'
  }
  function updateAlert(text, time, type) {
    let alert = document.getElementsByClassName('alert-msg')[0];
    alert.innerHTML = text;
    alert.style.color = Array.from(alertType).map(([key, value]) => { if (key == type) return value }).join() ?? 'red'

    if (time) {
      setTimeout(() => {
        alert.innerHTML = ' ';
      }, time * 1000);
    }
  }
  function createAlert(text) {
    var alert = document.createElement('div');
    alert.innerHTML = text ?? ' ';
    alert.classList.add('alert-msg')
    return alert
  }
  function getView() {
    let myView = document.getElementById('myView');
    if (!myView) {
      let myButtonsView = document.createElement('div');
      let myMainView = document.createElement('div');
      myView = document.createElement('div');
      myView.id = 'myView'
      myView.contentEditable = true;
      myView.onkeydown = (ev) => { ev.stopPropagation; ev.preventDefault(); }
      myView.classList.add('my-view')
      myButtonsView.classList.add('my-btn-view')
      myMainView.classList.add('my-main-view')

      myMainView.append(collapseView(myMainView))
      myMainView.append(myView)
      myMainView.append(createAlert())
      myButtonsView.append(createRequester())
      myButtonsView.append(createClear())
      myMainView.append(myButtonsView)
      document.body.appendChild(myMainView)
    }
    return myView
  }
  function collapseView(view) {
    let collapseView = document.createElement('div');
    collapseView.classList.add('collapse-button');
    let collapseViewIc = document.createElement('div');
    collapseViewIc.classList.add('collapse-button-ic');
    collapseViewIc.innerHTML = '>'
    collapseView.onclick = (ev) => {
      let toCollapse = document.querySelector('.my-bot-view')
      if (toCollapse) {
        if (toCollapse.className.includes('collapsed')) {
          toCollapse.classList.remove('collapsed')
        }
        else {
          toCollapse.classList.add('collapsed')
        }
      }
      if (view.className.includes('collapsed')) {
        view.classList.remove('collapsed')
      }
      else {
        view.classList.add('collapsed')
      }
    }
    collapseView.append(collapseViewIc)
    return collapseView
  }
  function createRequester() {
    let myBtns = document.createElement('div');
    myBtns.classList.add('my-btns');
    [
      { text: 'Get Insights', id: 'insightsBtn', prompt: 'Tell me more about. Show it like a website, easy and short and simple and clear.' },
      { text: 'Explore More', id: 'explainBtn', prompt: 'Whats cool about? Show it like a website, easy and short and simple and clear.' },
      { text: 'Simply Explain', id: 'simpleBtn', prompt: "Explain easily. Show it like a website, easy and short and simple and clear." },
      { text: 'Tips & Tricks', id: 'tipsBtn', prompt: "Gimme some tips and tricks about. Show it like a website, easy and short and simple and clear." },
    ].map(btn => {
      let myBtn = document.createElement('div');
      myBtn.id = btn.id
      myBtn.innerHTML = btn.text
      myBtn.onclick = () => sendMessage(btn.prompt)
      myBtn.classList.add('my-btn');
      myBtns.append(myBtn)
    })
    return myBtns
  }
  function createClear() {
    let myBtn = document.createElement('div');
    myBtn.id = 'myClrBtn'
    myBtn.innerHTML = 'Clear'
    myBtn.onclick = () => {
      let sbs = document.querySelectorAll('.iTTPOb');
      if (sbs) sbs.forEach(sb => sb.innerHTML = '')
      getView().innerHTML = '';
      history = new Map();
      printHistory = new Map();
      selectedHistory = []
    }
    myBtn.classList.add('my-btn')
    return myBtn
  }
  function getBotView() {
    let myBotView = document.getElementById('myBotView');
    if (!myBotView) {
      myBotView = document.createElement('div');
      myBotView.id = 'myBotView'
      myBotView.classList.add('my-bot-view')
      document.body.appendChild(myBotView)
    }
    return myBotView
  }
  getView().innerHTML = ''

  function sendMessage(prompt) {
    let message = printHistory.filter(item => item.selected).map((item) => item.value).join('');

    if (!message || message.length == '') {
      updateAlert('Select a message!', 15, alertType.warning)
      return
    }

    updateAlert('Requesting...!', null, alertType.success)
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            "role": "system",
            "content": `Return as Website in HTML with sections spliting in topics, following: ${prompt}`
          },
          {
            "role": "user",
            "content":
              `About: ${message}`
          }
        ]
      })
    }).then((response) => response.json())
      .then((data) => {
        if (data.error) {
          switch (data.error.code) {
            case ("invalid_api_key"):
              updateAlert('Invalid OpenAI Key! Click in Extension to update!', 15, alertType.error)
              return
            case ("insufficient_quota"):
              updateAlert('You exceeded your current quota!', 15, alertType.error)
              return
            default:
              updateAlert('Error requesting!', 15, alertType.error)
              return
          }
        }
        const chatbotMessage = data.choices[0].message.content;
        getBotView().innerHTML = chatbotMessage;
        updateAlert('')
      })
      .catch(error => {
        console.error(error);
        updateAlert('Error requesting!', 15, alertType.error)
      });

  }

  // Call readText initially and then use setInterval for repeated calls
  setTimeout(readText, 2000);
}
