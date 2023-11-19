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
let text = [];
function run() {
  chrome.runtime.sendMessage({ action: 'storage.get' }, (ev) => {
    OPENAI_API_KEY = ev
  })

  function extractTextFromSpans(elements) {
    return Array.from(elements).map(element => element.innerText).join(' ');
  }

  function extractTellersFromSpans(elements) {
    Array.from(elements).forEach(element => tellers.add(element.innerText));
  }
  // Function to clean up the history array
  function cleanUpHistory(history) {
    // Remove empty entries
    let filteredHistory = history.filter(entry => entry.trim() !== '');

    // Remove consecutive duplicate entries
    let deduplicatedHistory = filteredHistory.filter((entry, index, array) => {
      return index === 0 || entry !== array[index - 1];
    });

    return deduplicatedHistory;
  }
  var stringSize = 450;
  function addToHistory(teller, nt) {
    if (nt.trim('') === '') return
    let actual = history.get(teller) ?? '';
    let newValue = new Set()
    let selected = false

    if (actual) {
      let treating = actual[actual.length - 1];
      history.get(teller).pop()
      nt = `${treating.value} ${nt.replace(treating.value, '')}`;
    }

    let nextIndex;
    while (nt.length > stringSize) {
      nextIndex = nt.substring(stringSize).indexOf('.') + 1;
      if (nextIndex > 0) {
        newValue.add({ selected: selected, printed: false, value: nt.substring(0, nextIndex + stringSize ) });
      } else {
        newValue.add({ selected: selected, printed: false, value: nt.substring(0) });
      }
      nt = nt.substring(nextIndex + stringSize);
    }
    if (nt.length > 0)
      newValue.add({ selected: selected, printed: false, value: nt });

    if (!history.get(teller)) {
      history.set(teller, Array.from(newValue));
    } else {
      history.get(teller).push(...Array.from(newValue));
    }
  }

  function selectItem(key, index) {
    const historyEntry = history.get(key);

    if (historyEntry && historyEntry[index]) {
      historyEntry[index].selected = !historyEntry[index].selected;
    } else {
      console.error("Invalid key or index provided.");
    }
  }

  var inputBox = (item, key, index) => {
    let inp = document.createElement('input')
    let par = document.createElement('p')
    let lab = document.createElement('label')
    lab.classList.add('label-history')
    par.classList.add('p-history')


    inp.classList.add('my-checkbox')
    inp.type = 'checkbox'
    if (item.selected) inp.checked = true;

    lab.innerHTML = item.value + '<br>';

    par.append(inp)
    par.append(lab)

    return par
  }
  function printText() {
    let view = getView();
    let ret = ''
    view.innerHTML = ''
    Array.from(history).forEach(
      ([key, value]) => {
        let res = document.createElement('div')
        res.classList.add('container-history')
        let nam = document.createElement('span')
        nam.innerHTML = key;
        res.append(nam)
        value.forEach((item, index) => {
          res.append(inputBox(item, key, index));
          res.onclick = () => { selectItem(key, index) }
        })
        view.append(res)
      }
    );
    view.scrollTop = getView().scrollHeight;
  }
  function readText() {
    try {
      if (firstActivation) {
        document.querySelector('.juFBl').querySelector('[aria-pressed=false]').click();
        firstActivation = false
      } else {
        if (document.querySelector('.juFBl').querySelector('[aria-pressed=false]')) {
          updateAlert('Activate Subtitle to start.')
        } else {
          updateAlert('')
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
  function updateAlert(text, time) {
    let alert = document.getElementsByClassName('alert-msg')[0];
    alert.innerHTML = text;
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
    let message = Array.from(history).map(([key, value]) => value.filter((e) => e.selected).map(val => val.value)).join('');
    if (!message || message.length == '') {
      updateAlert('Select a message!', 15)
      return
    }

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
            "content": `Return as Website in HTML following: ${prompt}`
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
        const chatbotMessage = data.choices[0].message.content;
        getBotView().innerHTML = chatbotMessage;
      })
      .catch(error => console.error(error));

  }

  // Call readText initially and then use setInterval for repeated calls
  setTimeout(readText, 2000);

}