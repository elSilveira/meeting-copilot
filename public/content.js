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
let myRequest = ``;
let history = new Map();
let myActors = new Set();
let printHistory = [];
let selectedHistory = [];
let text = [];
let selectedActor = '';
const alertType = {
  success: 'green',
  warning: 'yellow',
  error: 'red'
}

function run() {
  chrome.runtime.sendMessage({ action: 'storage.get' }, (ev) => {
    OPENAI_API_KEY = ev
  })

  function extractTextFromSpans(elements) {
    return elements.innerText;
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
    let time;

    if (actual && actual.length > 0) {
      let treating = actual[actual.length - 1];
      time = treating.time;
      history.get(teller).pop()
      nt = mergeStringsRemoveDuplicates(treating.value, nt)
    }
    nt = removeDuplicateContexts(nt)

    setHistory = (hist) => {
      if (history.get(teller)) {
        history.get(teller).push({ printed: false, value: hist, time: time ?? Date.now() });
      }
      else
        history.set(teller, [{ printed: false, value: hist, time: time ?? Date.now() }]);
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
    Array.from(history).forEach(([key, items]) => {
      if (selectedActor && selectedActor != key) return
      Array.from(items).forEach(value => {
        const chunks = breakText(value.value);
        chunks.forEach((chunk) => {
          printHistory.push({ key, selected: selectedHistory.indexOf(index) > -1, value: chunk, time: value.time });
          index++
        });
      });
    })
  }

  function selectItem(key) {
    if (selectedHistory.indexOf(key) > -1)
      selectedHistory = selectedHistory.filter(i => i != key)
    else
      selectedHistory.push(key)
    setPrintHistory();
  }

  function formatTime(timestamp) {
    // Create a Date object from the timestamp
    let date = new Date(timestamp);

    // Extract hours, minutes, and seconds
    const components = ['getHours', 'getMinutes'];
    let formattedTime = components.map(component => date[component]().toString().padStart(2, '0')).join(':');

    return formattedTime;
  }

  function inputBox(selected, value, index, time, myHash) {
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

    lab.innerHTML = `${formatTime(time)}.${myHash}: ${value}`;
    par.append(inp, lab);
    return par;
  }

  function printText() {
    let newHash = 0;
    const view = getView();
    view.innerHTML = '';
    let last;
    let nextTime;
    let myHash = 1;
    printHistory.forEach(({ key, selected, value, time }, index) => {
      if (nextTime != time) {
        nextTime = time;
        myHash = 1;
      }
      const res = document.createElement('div');
      res.classList.add('container-history');

      const nam = document.createElement('span');
      nam.innerHTML = key;
      if (last != key)
        res.append(nam, inputBox(selected, value, index, time, myHash));
      else
        res.append(inputBox(selected, value, index, time, myHash));
      last = key;
      myHash++;

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
      tellerElements.forEach((el, index) => {
        teller = el.innerText
        myActors.add(teller)
        // Check if at least one subtitle element is found
        if (subtitleElements.length > 0) {
          let extactedText = extractTextFromSpans(subtitleElements[index]);
          // text.push(teller, extactedText);
          addToHistory(teller, extactedText)
        }
      })
      printText()
      // Use the first teller element as the single teller

    }
    setTimeout(readText, 3000);
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

  let initialHtml = `<div>
                      <h1>Initial Context</h1>
                      <p>Insert the initial context that you can use during your meeting. This could be from an email, meeting notes, job post, etc.</p>
                    </div>
                    <div>
                    <h2>Job Post</h2>
                    <div>
                        Position: Productivity Specialist<br>
                        Company: ABC Company<br>
                        Location: New York, NY<br><br>

                        We are seeking a dynamic individual to join our team as a Productivity Specialist. The ideal candidate will have experience in optimizing meeting processes and introducing innovative tools. Familiarity with "ProductivityPro" is a plus.
                        <br><br>
                        Responsibilities:<br>
                        - Implementing and promoting the use of "ProductivityPro"<br>
                        - Conducting training sessions for team members<br>
                        - Monitoring and evaluating the impact on productivity<br><br>
                    </div>
                    </div>`;
  function createInitialContext() {
    let element = document.createElement(`div`)
    let editableElement = document.createElement(`div`)
    let buttons = document.createElement(`div`)
    buttons.style.display = 'flex';
    editableElement.contentEditable = true;
    element.id = `txtInitiaInput`
    element.classList.add(`my-initial-input`)
    editableElement.classList.add(`my-editable-input`)
    editableElement.innerHTML = initialHtml;
    element.append(editableElement)
    Array.from([{ name: `Recruiter`, type: myInitialPrompts.recruiter },
    { name: `Candidate`, type: myInitialPrompts.recruiter }]).forEach(
      item => {
        buttons.append(createInitialButton(editableElement, item.name, item.type))
      }
    )
    element.append(buttons)
    return element
  }
  function createInitialButton(element, name, type) {
    let button = document.createElement(`button`)
    button.innerHTML = `Generate Guide as (${name})`
    button.onclick = (ev) => {
      sendMessage(type, element.innerText, true)
    }
    return button
  }

  function createInput() {
    let input = document.createElement(`input`)
    input.type = `text`
    input.id = `txtInput`
    input.classList.add(`my-input`)
    input.addEventListener(`keyup`, ev => myRequest = ev.target.value)
    input.placeholder = `Additional details (e.g., Language, Key Topics, Context, Tone, Audience)`
    return input
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
      let header = document.createElement(`div`)
      header.classList.add(`my-header`)
      header.append(actors())
      header.append(collapseView(myMainView))
      myMainView.append(header)
      myMainView.append(myView)
      myMainView.append(createAlert())
      myMainView.append(createInput())
      myButtonsView.append(createRequester())
      myButtonsView.append(createClear())
      myMainView.append(myButtonsView)
      document.body.appendChild(myMainView)
      document.body.append(createInitialContext())
    }
    return myView
  }

  function actors() {
    let container = document.createElement(`div`);
    let dropdown = document.createElement(`div`);
    let selected = document.createElement(`div`);
    container.classList.add(`my-actors`)
    selected.innerHTML = 'All Actors'
    dropdown.classList.add(`my-dropdown`)
    dropdown.style.display = 'none';
    container.onclick = (ev) => {
      if (dropdown.style.display == 'flex')
        dropdown.style.display = 'none';
      else {
        dropdown.innerHTML = Array.from(myActors).map(it => `<span>${it}</span>`).join('')
        dropdown.innerHTML += `<span>All Actors</span>`
        dropdown.style.display = 'flex';
      }
    }
    dropdown.onclick = (ev) => {
      let actor = ev.target.innerText;
      if (history.get(actor)) selectedActor = actor;
      else selectedActor = null;
      selected.innerHTML = selectedActor ?? 'All Actors'
      setPrintHistory()
      printText();
    }
    container.append(dropdown)
    container.append(selected)
    return container
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

  let myInitialPrompts = {
    recruiter: `You are the recruiter interviewig the candidate and the context on following is the role description. 
      create questions as an interviewer for the following context focusing on technical skills 
      going deeper responding as a pro, then creating answers and hits that differentiate a senior, 
      then responding with just the answers and hits.
      Show it like a website, Split into topics, add hints and bullet points, easy and short and simple and clear.`,
    candidate: `You are being interviewed and the context on following is the role description, 
      create questions as an interviewer for the following context focusing on technical skills 
      going deeper responding as a pro, then creating answers and hits that differentiate a senior, 
      then responding with just the answers and hits.      
      Show it like a website, Split into topics, add hints and bullet points, easy and short and simple and clear.`
  };

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
      selectedHistory = [];
    }
    myBtn.classList.add('my-btn')
    return myBtn
  }

  function getBotView() {
    let myBotView = document.getElementById('myBotView');
    if (!myBotView) {
      myBotView = document.createElement('div');
      myBotView.id = 'myBotView'
      myBotView.classList.add(['my-bot-view'])
      document.body.appendChild(myBotView)
    }
    return myBotView
  }

  getView().innerHTML = ''

  function sendMessage(prompt, message = '', inital = false) {
    let historyMessage = printHistory.filter(item => item.selected).map((item) => item.value).join('');
    if (historyMessage && historyMessage.length != 0) message = historyMessage

    if (message.length == 0) {
      updateAlert('Select a message!', 15, alertType.warning)
      return
    }

    let messages = [
      {
        "role": "system",
        "content": `Return as Website in HTML with sections spliting in topics, following: ${prompt}`
      },
      {
        "role": "user",
        "content":
          `${message}`
      }
    ]
    if (myRequest) {
      messages.push(
        {
          "role": "user",
          "content":
            `${myRequest}`
        }
      )
    }
    updateAlert('Requesting...!', null, alertType.success)
    updateAlert('Requesting...!', null, alertType.success)
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages
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
        if (inital)
          document.querySelector('.my-editable-input').innerHTML = chatbotMessage
        else
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