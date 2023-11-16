

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

let teller;
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
  var stringSize = 10000;
  function addToHistory(teller, nt) {
    if (nt.trim('') === '') return
    let actual = history.get(teller);
    let newValue = []

    if (actual) {
      let lastHistory = actual[actual.length - 1];
      if (nt.indexOf(lastHistory) > -1) {
        history.get(teller).pop();
      }
    }

    let nextIndex;
    while (nt.length > stringSize) {
      nextIndex = stringSize + nt.substring(stringSize).indexOf(' ');
      newValue.push(nt.substring(0, nextIndex));
      nt = nt.substring(nextIndex);
    }
    newValue.push(nt);

    if (!actual) {
      history.set(teller, newValue);
      return;
    }
    history.get(teller).push(...newValue);
  }

  function readText() {
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
      teller = extractTextFromSpans(tellerElements[0]);

      // Check if at least one subtitle element is found
      if (subtitleElements.length > 0) {
        let nt = extractTextFromSpans(subtitleElements);
        text.push(teller, nt);
        addToHistory(teller, nt)
        getView().innerHTML = Array.from(history).map(([key, value]) => key + '\n' + value.join(''));
        getView().scrollTop = getView().scrollHeight;
      }
    }
    setTimeout(readText, 2000);
  }

  function getView() {
    let myView = document.getElementById('myView');
    if (!myView) {
      let myMainView = document.createElement('div');
      myView = document.createElement('div');
      myView.id = 'myView'
      myView.classList.add('my-view')
      myMainView.classList.add('my-main-view')
      myMainView.append(myView)
      myMainView.append(createRequester())
      myMainView.append(createClear())
      document.body.appendChild(myMainView)
    }
    return myView
  }
  function createRequester() {
    let myBtn = document.createElement('div');
    myBtn.id = 'myBtn'
    myBtn.innerHTML = 'Send to AI'
    myBtn.onclick = () => sendMessage(history.get('You'))
    myBtn.classList.add('my-btn')
    return myBtn
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

  function sendMessage(message) {
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
            "role": "user",
            "content": `<p>I need your help respond to the interviewer for a job interview. Assume I'm being interviewed for a role right now. Please provide tips on the following topics:</p>
            <ol>
            <li>Effective Communication:</li>
            <li>Problem-Solving:</li>
            <li>Leadership:</li>
            <li>Adaptability:</li>
            <li>Company Knowledge:</li>
            </ol>
            <p>Remember to use simple language, be specific, concise, and convey a sense of seniority. Format your responses in HTML for easy integration into innerHTML.</p> `
          },
          {
            "role": "user",
            "content": `Here is a text from the meeting:
            <p>${message}</p>`
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
