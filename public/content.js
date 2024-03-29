/*global chrome*/
var API_KEY = "";
var API_TYPE = "";
var isMeetingRoom = false;
var blocklist = [];
let _url = window.location.href;
let _host = window.location.hostname
if (_url.includes('meet.google') || _url.includes('teams.live') || _url.includes('teams.microsoft')) {
  isMeetingRoom = true;
}
document.addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: 'setPage', url: _host });
});

chrome.runtime.onMessage.addListener((event) => {
  if (event) {
    switch (event.action) {
      case 'storage.set':
        if (event.key)
          API_KEY = event.key
        if (event.type)
          API_TYPE = event.type
        break
      case 'storage.delete':
        API_KEY = ''
        break
    }
  }
})
//Get Blocklist and run
chrome.runtime.sendMessage({ action: 'storage.get', type: 'blocklist' }, (ev) => {
  console.log(ev)
  if (ev && ev.length > 0 &&
    ev.filter((item) => {
      return _url.includes(item);
    }).length != 0) {
    return
  }
  run()
})

let firstActivation = true;
let history = new Map();
let printHistory = [];
let selectedHistory = [];
let myActors = new Set();
let text = [];
let selectedActor = '';
let myRequest = ``;
let myResposes = new Map();
let selection = '';
var alertType = {
  success: 'green',
  warning: 'yellow',
  error: 'red'
}

function makeElementDraggable(element, draggableArea) {
  let offsetX, offsetY, isDragging = false;

  draggableArea.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    element.style.cursor = 'grabbing'; // Set cursor to grabbing during drag
  });

  // Attach event listeners directly to the document
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  function handleMouseMove(e) {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    }
  }

  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'grab';
    }
  }
}

function run() {
  chrome.runtime.sendMessage({ action: 'storage.get', type: 'apiKey' }, (ev) => {
    API_KEY = ev
  })
  chrome.runtime.sendMessage({ action: 'storage.get', type: 'apiType' }, (ev) => {
    API_TYPE = ev
  })

  // Function to log selected text to console
  function logSelectedText(selectedText) {
    let inp = document.getElementById('txtSelectedInput');
    selection = selectedText;
    if (inp) { inp.innerHTML = selectedText == '' ? `Select something to use in the request...` : selectedText }
  }

  // Function to add event listener to the specified element by ID
  function addTextSelectionListener(elementId) {
    const element = document.getElementById(elementId);

    if (element) {
      element.addEventListener('mouseup', function () {
        const selectedText = window.getSelection().toString().trim();
        logSelectedText(selectedText);
      });
    } else {
      console.error(`Element with ID '${elementId}' not found.`);
    }
  }

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

    inp.onclick = () => {
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

  function createInput() {
    let input = document.createElement(`input`)
    input.type = `text`
    input.id = `txtInput`
    input.classList.add(`my-input`)
    input.addEventListener(`keyup`, ev => myRequest = ev.target.value)
    input.placeholder = `Additional details (e.g., Language, Key Topics, Context, Tone, Audience)`
    return input
  }

  function createSelectedInput() {
    let input = document.createElement(`div`)
    input.id = `txtSelectedInput`
    input.contentEditable = false;
    input.classList.add(`my-selected-input`)
    input.innerText = `Select something to use in the request...`
    return input
  }

  function getView() {
    let myView = document.getElementById('myView');
    if (!myView) {
      let myButtonsView = document.createElement('div');
      let myMainView = document.createElement('div');
      myMainView.draggable = true;
      myView = document.createElement('div');
      myView.id = 'myView'
      myView.contentEditable = true;
      myView.classList.add('my-view')
      myButtonsView.classList.add('my-btn-view')
      myMainView.classList.add('my-main-view')
      let header = document.createElement(`div`)
      header.classList.add(`my-header`)
      header.append(actors())
      header.append(exporter())
      if (isMeetingRoom) {
        myMainView.append(header)
        myMainView.append(myView)
      }
      myMainView.append(blocker())
      myMainView.append(collapseView(myMainView))
      myMainView.classList.add('collapsed')
      myMainView.style.width = '0';
      myMainView.append(createAlert())
      myMainView.append(createInput())
      myMainView.append(createSelectedInput())
      if (isMeetingRoom)
        myButtonsView.append(createRequester())
      myButtonsView.append(createSend())
      myMainView.append(myButtonsView)
      document.body.appendChild(myMainView)
      addTextSelectionListener('myView');
      makeElementDraggable(myMainView, header);
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
    collapseView.classList.add('collapsed')
    if (isMeetingRoom) collapseView.classList.add('chat')
    let collapseViewIc = document.createElement('div');
    collapseViewIc.classList.add('collapse-button-ic');
    collapseViewIc.innerHTML = '>';

    collapseView.onclick = (ev) => {
      let toCollapse = document.querySelector('.my-bot-view')
      if (toCollapse) {
        if (toCollapse.className.includes('collapsed')) {
          toCollapse.classList.remove('collapsed')
          toCollapse.style.width = '380px';
          toCollapse.style.left = 'auto';
          toCollapse.style.bottom = 'auto';
          toCollapse.style.top = '5px';
          toCollapse.style.right = '5px';
        }
        else {
          toCollapse.classList.add('collapsed')
          toCollapse.style.width = '0';
        }
      }
      if (view.className.includes('collapsed')) {
        view.classList.remove('collapsed')
        view.style.width = '450px';
        view.style.bottom = '5px';
        view.style.right = '5px';
        view.style.top = 'auto';
        view.style.left = 'auto';
      }
      else {
        view.classList.add('collapsed')
        view.style.width = '0';
      }
    }
    collapseView.append(collapseViewIc)
    return collapseView
  }

  function createRequester() {
    let myBtns = document.createElement('div');
    myBtns.classList.add('my-btns');
    [
      { text: 'Get Insights', id: 'insightsBtn', prompt: 'Tell more about.' },
      { text: 'Explore More', id: 'explainBtn', prompt: 'What is cool about?' },
      { text: 'Simply Explain', id: 'simpleBtn', prompt: "Explain me easily." },
      { text: 'Tips & Tricks', id: 'tipsBtn', prompt: "Gimme some tips and tricks." },
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
  function exportToText() {
    // Create a Blob with the content
    var blob = new Blob([printHistory.map((i) => { return `${i.key} (${formatTime(i.time)}): ${i.value}` }).join(`,\n`)], { type: 'text/plain' });
    // Create a link element
    var link = document.createElement('a');

    // Set the link's attributes
    link.href = window.URL.createObjectURL(blob);
    link.download = 'exported.txt';

    // Append the link to the document
    document.body.appendChild(link);

    // Trigger a click on the link to initiate the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  }

  function exporter() {
    let myBtn = document.createElement('div');
    myBtn.id = 'myExportBtn';
    myBtn.innerHTML = `<svg fill="#000000" height="28px" width="51px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
      viewBox="0 0 493.525 493.525" xml:space="preserve">
      <g id="XMLID_30_">
      <path id="XMLID_32_" d="M430.557,79.556H218.44c21.622,12.688,40.255,29.729,54.859,49.906h157.258
       c7.196,0,13.063,5.863,13.063,13.06v238.662c0,7.199-5.866,13.064-13.063,13.064H191.894c-7.198,0-13.062-5.865-13.062-13.064
       V222.173c-6.027-3.1-12.33-5.715-18.845-7.732c-3.818,11.764-12.105,21.787-23.508,27.781c-2.39,1.252-4.987,2.014-7.554,2.844
       v136.119c0,34.717,28.25,62.971,62.968,62.971h238.663c34.718,0,62.969-28.254,62.969-62.971V142.522
       C493.525,107.806,465.275,79.556,430.557,79.556z"/>
      <path id="XMLID_31_" d="M129.037,175.989c51.419,1.234,96.388,28.283,122.25,68.865c2.371,3.705,6.434,5.848,10.657,5.848
       c1.152,0,2.322-0.162,3.46-0.486c5.377-1.545,9.114-6.418,9.179-12.006c0-0.504,0-1.01,0-1.51
       c0-81.148-64.853-147.023-145.527-148.957V64.155c0-5.492-3.038-10.512-7.879-13.078c-2.16-1.139-4.533-1.707-6.889-1.707
       c-2.94,0-5.848,0.88-8.35,2.584L5.751,120.526C2.162,122.98,0.018,127.041,0,131.394c-0.017,4.338,2.113,8.418,5.687,10.902
       l100.17,69.451c2.518,1.753,5.459,2.631,8.414,2.631c2.355,0,4.696-0.553,6.857-1.676c4.855-2.549,7.909-7.6,7.909-13.092V175.989z
       "/>
      </g>
      </svg>`;
    myBtn.onclick = () => {
      exportToText()
    }
    return myBtn
  }

  function blocker() {
    let myBtn = document.createElement('div');
    myBtn.classList.add("blBtn");
    if (isMeetingRoom) myBtn.classList.add('bl-chat')
    let blLabel = document.createElement('label');
    blLabel.classList.add("blLabel");
    blLabel.innerHTML = "Blackist this page"
    myBtn.append(blLabel)

    myBtn.id = 'myBlBtn';
    myBtn.innerHTML += ` <svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
    width="18px" height="18px" viewBox="0 0 28.331 28.331"
    xml:space="preserve">
 <g>
   <path d="M25.098,0.586h-0.734v2.02c0,0.67-0.545,1.212-1.213,1.212s-1.211-0.542-1.211-1.212v-2.02H19.87v2.02
     c0,0.67-0.544,1.212-1.212,1.212c-0.669,0-1.211-0.542-1.211-1.212v-2.02h-2.07v2.02c0,0.67-0.543,1.212-1.212,1.212
     s-1.212-0.542-1.212-1.212v-2.02h-2.07v2.02c0,0.67-0.542,1.212-1.211,1.212c-0.668,0-1.212-0.542-1.212-1.212v-2.02H6.39v2.02
     c0,0.67-0.542,1.212-1.211,1.212c-0.668,0-1.212-0.542-1.212-1.212v-2.02H3.232C1.449,0.586,0,2.036,0,3.82v20.691
     c0,1.784,1.449,3.234,3.232,3.234H25.1c1.782,0,3.231-1.45,3.231-3.234V3.82C28.33,2.036,26.881,0.586,25.098,0.586z M8.06,19.666
     c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S8.888,19.666,8.06,19.666z M8.06,15.666
     c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S8.888,15.666,8.06,15.666z M8.06,11.666
     c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S8.888,11.666,8.06,11.666z M20.768,19.166H12.56
     c-0.552,0-1-0.447-1-1s0.448-1,1-1h8.208c0.553,0,1,0.447,1,1S21.32,19.166,20.768,19.166z M20.768,15.166H12.56
     c-0.552,0-1-0.447-1-1s0.448-1,1-1h8.208c0.553,0,1,0.447,1,1S21.32,15.166,20.768,15.166z M20.768,11.166H12.56
     c-0.552,0-1-0.447-1-1s0.448-1,1-1h8.208c0.553,0,1,0.447,1,1S21.32,11.166,20.768,11.166z"/>
 </g>
 </svg>`;
    myBtn.onclick = () => {
      blockPage()
    }
    return myBtn
  }

  function blockPage() {
    chrome.runtime.sendMessage({ action: 'storage.set', blocklist: [_host] });
    let mv = document.getElementsByClassName('my-bot-view')[0]
    if (mv) mv.remove();
    mv = document.getElementsByClassName('my-main-view')[0]
    if (mv) mv.remove();
  }

  function createSend() {
    let myBtn = document.createElement('div');
    myBtn.id = 'myClrBtn'
    myBtn.innerHTML = 'Send'
    myBtn.onclick = () => {
      if (myRequest == '') return
      sendMessage()
    }
    myBtn.classList.add('my-btn')
    return myBtn
  }
  var actualPage = 0;
  function pageUp() {
    if (actualPage >= myResposes.size - 1) return
    actualPage = actualPage + 1
    let pages = document.getElementById('myPages');
    pages.innerHTML = `${actualPage + 1} / ${myResposes.size}`;
    getBotView(true).innerHTML = myResposes.get(actualPage)
  }
  function pageDown() {
    if (actualPage <= 0) return
    actualPage = actualPage - 1
    let pages = document.getElementById('myPages');
    pages.innerHTML = `${actualPage + 1} / ${myResposes.size}`;
    getBotView(true).innerHTML = myResposes.get(actualPage)
  }
  function updatePagination() {
    let myPagination = document.getElementById('myPagination');

    if (!myPagination) {
      let pages = myPagination = document.createElement('div');
      let arrR = myPagination = document.createElement('div');
      let arrL = myPagination = document.createElement('div');
      arrR.innerHTML = '>';
      arrL.innerHTML = '<';
      arrL.onclick = () => { pageDown() }
      arrR.onclick = () => { pageUp() }
      myPagination = document.createElement('div');
      myPagination.append(arrL)
      myPagination.append(pages)
      myPagination.append(arrR)
      pages.id = 'myPages';
      myPagination.id = 'myPagination';
      myPagination.classList.add(['my-paginator-view'])
      arrL.classList.add(['btn'])
      arrR.classList.add(['btn'])
      getBotView().prepend(myPagination)
    }
    actualPage = myResposes.size - 1
    let pages = document.getElementById('myPages');
    pages.innerHTML = `${actualPage + 1} / ${myResposes.size}`;

    getBotView(true).innerHTML = myResposes.get(myResposes.size - 1)
  }

  function getBotView(inside = false) {
    let myBotView = document.getElementById('myBotView');
    let myBotContentView = document.getElementById('myBotContentView');
    if (!myBotView) {
      let header = document.createElement(`div`)
      header.classList.add(`my-bot-header`)
      myBotContentView = document.createElement('div');
      myBotContentView.id = 'myBotContentView'
      myBotContentView.classList.add(['my-content-bot-view'])
      myBotContentView.contentEditable = true;
      myBotView = document.createElement('div');
      myBotView.id = 'myBotView'
      myBotView.classList.add('my-bot-view')
      myBotView.appendChild(header)
      myBotView.appendChild(myBotContentView)
      document.body.appendChild(myBotView)
      addTextSelectionListener('myBotView');
      makeElementDraggable(myBotView, header);
    }
    return inside ? myBotContentView : myBotView
  }

  getView().innerHTML = ''

  function sendMessage(prompt, message = '', inital = false) {
    if (API_TYPE == 'openAi') sendMessageOpenAi(prompt, message = '', inital = false)
    else sendMessageGoogle(prompt, message = '', inital = false)
  }

  function sendMessageOpenAi(prompt, message = '', inital = false) {
    let historyMessage;
    if (printHistory && printHistory.length > 0) {
      historyMessage = printHistory.filter(item => item.selected).map((item) => item.value).join('');
      if (historyMessage && historyMessage.length != 0) message = historyMessage
    }

    let messages = [];
    if (prompt)
      messages.push
        ({
          "role": "system",
          "content": `${prompt}. Your response have to be clean and concise, 
        as a Website HTML to be injected on innerHtml,
        divide by sections, and topics, with HTML tags.`
        })


    if (message.length > 0) {
      messages.push(
        {
          "role": "user",
          "content":
            `${message}`
        }
      )
    }

    if (myRequest) {
      messages.push(
        {
          "role": "user",
          "content":
            `${myRequest}`
        }
      )
    }

    if (selection) {
      messages.push(
        {
          "role": "user",
          "content":
            `${selection}`
        }
      )
    }

    if (messages.filter(m => m.role === 'user').length == 0) {
      updateAlert('Please select or insert some content...!', null, alertType.warning)
      return;
    }

    updateAlert('Requesting to OpenAi...!', null, alertType.success)
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
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
        myResposes.set(myResposes.size, chatbotMessage)
        updatePagination()
        updateAlert('')
      })
      .catch(error => {
        console.error(error);
        updateAlert('Error requesting!', 15, alertType.error)
      });

  }
  function sendMessageGoogle(prompt, message = '', inital = false) {
    let historyMessage;
    if (printHistory && printHistory.length > 0) {
      historyMessage = printHistory.filter(item => item.selected).map((item) => item.value).join('');
      if (historyMessage && historyMessage.length != 0) message = historyMessage
    }

    async function runGoog() {
      // For text-only input, use the gemini-pro model
      let parts = [{
        "text": prompt + ". Your response should be clean and concise, formatted as a website HTML to be injected into innerHTML. It should be divided into sections and topics using HTML tags."
      }]

      if (message && message != '') {
        parts.push({ 'text': message })
      }

      if (myRequest) {
        parts.push({ 'text': myRequest })
      }

      if (selection) {
        parts.push({ 'text': selection })
      }

      // Send the request to Gemini, ensuring proper JSON parsing
      updateAlert('Requesting to Google...!', null, alertType.success)
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' +
        API_KEY,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "contents": [{
              "role": "user",
              "parts": parts
            }]
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        updateAlert('Error requesting on Google!', 15, alertType.error)
        console.error("Gemini API Error:", data.error);
      } else {
        const extractedText = (data.candidates || [])
          .map(candidate => candidate.content?.parts?.[0]?.text)
          .filter(text => text !== undefined);

        // Process the generated HTML here
        myResposes.set(myResposes.size, extractedText.toString().replace('```html', ''))
        updatePagination()
        updateAlert('')
      }
    }
    runGoog();
  }
  // Call readText initially and then use setInterval for repeated calls
  setTimeout(readText, 2000);
}
