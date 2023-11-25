/*global chrome*/
var OPENAI_API_KEY = "";

const languages = {
  "Afrikaans": { "value": "Afrikaans", "country": "south-africa" },
  "Albanian": { "value": "Shqip", "country": "albania" },
  "Amharic": { "value": "አማርኛ", "country": "ethiopia" },
  "Arabic": { "value": "العربية", "country": "arab-world" },
  "Armenian": { "value": "հայերեն", "country": "armenia" },
  "Azerbaijani": { "value": "Azərbaycan", "country": "azerbaijan" },
  "Basque": { "value": "Euskara", "country": "basque-country" },
  "Belarusian": { "value": "Беларуская", "country": "belarus" },
  "Bengali": { "value": "বাংলা", "country": "bangladesh" },
  "Bosnian": { "value": "Bosanski", "country": "bosnia-and-herzegovina" },
  "Bulgarian": { "value": "Български", "country": "bulgaria" },
  "Catalan": { "value": "Català", "country": "catalonia" },
  "Cebuano": { "value": "Cebuano", "country": "philippines" },
  "Chichewa": { "value": "Chichewa", "country": "malawi" },
  "Chinese (Simplified)": { "value": "中文（简体）", "country": "china" },
  "Chinese (Traditional)": { "value": "中文（繁體）", "country": "taiwan" },
  "Corsican": { "value": "Corsu", "country": "corsica" },
  "Croatian": { "value": "Hrvatski", "country": "croatia" },
  "Czech": { "value": "Čeština", "country": "czech-republic" },
  "Danish": { "value": "Dansk", "country": "denmark" },
  "Dutch": { "value": "Nederlands", "country": "netherlands" },
  "English": { "value": "English", "country": "united-kingdom" },
  "Esperanto": { "value": "Esperanto", "country": "constructed-international" },
  "Estonian": { "value": "Eesti", "country": "estonia" },
  "Filipino": { "value": "Filipino", "country": "philippines" },
  "Finnish": { "value": "Suomi", "country": "finland" },
  "French": { "value": "Français", "country": "france" },
  "Frisian": { "value": "Frysk", "country": "frisia" },
  "Galician": { "value": "Galego", "country": "galicia" },
  "Georgian": { "value": "ქართული", "country": "georgia" },
  "German": { "value": "Deutsch", "country": "germany" },
  "Greek": { "value": "Ελληνικά", "country": "greece" },
  "Gujarati": { "value": "ગુજરાતી", "country": "india" },
  "Haitian Creole": { "value": "Kreyòl Ayisyen", "country": "haiti" },
  "Hausa": { "value": "Hausa", "country": "nigeria" },
  "Hawaiian": { "value": "ʻŌlelo Hawaiʻi", "country": "hawaii" },
  "Hebrew": { "value": "עברית", "country": "israel" },
  "Hindi": { "value": "हिन्दी", "country": "india" },
  "Hmong": { "value": "Hmong", "country": "china" },
  "Hungarian": { "value": "Magyar", "country": "hungary" },
  "Icelandic": { "value": "Íslenska", "country": "iceland" },
  "Igbo": { "value": "Igbo", "country": "nigeria" },
  "Indonesian": { "value": "Bahasa Indonesia", "country": "indonesia" },
  "Irish": { "value": "Gaeilge", "country": "ireland" },
  "Italian": { "value": "Italiano", "country": "italy" },
  "Japanese": { "value": "日本語", "country": "japan" },
  "Javanese": { "value": "Jawa", "country": "java" },
  "Kannada": { "value": "ಕನ್ನಡ", "country": "india" },
  "Kazakh": { "value": "Қазақша", "country": "kazakhstan" },
  "Khmer": { "value": "ភាសាខ្មែរ", "country": "cambodia" },
  "Kinyarwanda": { "value": "Kinyarwanda", "country": "rwanda" },
  "Korean": { "value": "한국어", "country": "south-korea" },
  "Kurdish (Kurmanji)": { "value": "Kurdî (Kurmancî)", "country": "kurdistan" },
  "Kyrgyz": { "value": "Кыргызча", "country": "kyrgyzstan" },
  "Lao": { "value": "ລາວ", "country": "laos" },
  "Latin": { "value": "Latine", "country": "ancient-rome" },
  "Latvian": { "value": "Latviešu", "country": "latvia" },
  "Lithuanian": { "value": "Lietuvių", "country": "lithuania" },
  "Luxembourgish": { "value": "Lëtzebuergesch", "country": "luxembourg" },
  "Macedonian": { "value": "Македонски", "country": "north-macedonia" },
  "Malagasy": { "value": "Malagasy", "country": "madagascar" },
  "Malay": { "value": "Bahasa Melayu", "country": "malaysia" },
  "Malayalam": { "value": "മലയാളം", "country": "india" },
  "Maltese": { "value": "Malti", "country": "malta" },
  "Maori": { "value": "Māori", "country": "new-zealand" },
  "Marathi": { "value": "मराठी", "country": "india" },
  "Mongolian": { "value": "Монгол", "country": "mongolia" },
  "Myanmar (Burmese)": { "value": "မြန်မာဘာသာ", "country": "myanmar" },
  "Nepali": { "value": "नेपाली", "country": "nepal" },
  "Norwegian": { "value": "Norsk", "country": "norway" },
  "Odia (Oriya)": { "value": "ଓଡ଼ିଆ", "country": "india" },
  "Pashto": { "value": "پښتو", "country": "afghanistan" },
  "Persian": { "value": "فارسی", "country": "iran" },
  "Polish": { "value": "Polski", "country": "poland" },
  "Portuguese": { "value": "Português", "country": "portugal" },
  "Punjabi": { "value": "ਪੰਜਾਬੀ", "country": "india" },
  "Romanian": { "value": "Română", "country": "romania" },
  "Russian": { "value": "Русский", "country": "russia" },
  "Samoan": { "value": "Gagana Samoa", "country": "samoa" },
  "Scots Gaelic": { "value": "Gàidhlig", "country": "scotland" },
  "Serbian": { "value": "Српски", "country": "serbia" },
  "Sesotho": { "value": "Sesotho", "country": "lesotho" },
  "Shona": { "value": "Shona", "country": "zimbabwe" },
  "Sindhi": { "value": "سنڌي", "country": "pakistan" },
  "Sinhala": { "value": "සිංහල", "country": "sri-lanka" },
  "Slovak": { "value": "Slovenčina", "country": "slovakia" },
  "Slovenian": { "value": "Slovenščina", "country": "slovenia" },
  "Somali": { "value": "Soomaali", "country": "somalia" },
  "Spanish": { "value": "Español", "country": "spain" },
  "Sundanese": { "value": "Basa Sunda", "country": "sunda" },
  "Swahili": { "value": "Kiswahili", "country": "tanzania" },
  "Swedish": { "value": "Svenska", "country": "sweden" },
  "Tajik": { "value": "Тоҷикӣ", "country": "tajikistan" },
  "Tamil": { "value": "தமிழ்", "country": "india" },
  "Telugu": { "value": "తెలుగు", "country": "india" },
  "Thai": { "value": "ไทย", "country": "thailand" },
  "Turkish": { "value": "Türkçe", "country": "turkey" },
  "Ukrainian": { "value": "Українська", "country": "ukraine" },
  "Urdu": { "value": "اردو", "country": "pakistan" },
  "Uzbek": { "value": "Oʻzbekcha", "country": "uzbekistan" },
  "Vietnamese": { "value": "Tiếng Việt", "country": "vietnam" },
  "Welsh": { "value": "Cymraeg", "country": "wales" },
  "Xhosa": { "value": "isiXhosa", "country": "south-africa" },
  "Yiddish": { "value": "ייִדיש", "country": "israel" },
  "Yoruba": { "value": "Yorùbá", "country": "nigeria" },
  "Zulu": { "value": "isiZulu", "country": "south-africa" }
}

const actualLocale = languages.English;

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
let myActors = new Set();
let text = [];
let selectedActor = '';

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
          printText()
        }
      })
      // Use the first teller element as the single teller

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
      let header = document.createElement(`div`)
      header.classList.add(`my-header`)
      header.append(actors())
      header.append(locale(actualLocale.country))
      header.append(collapseView(myMainView))
      myMainView.append(header)
      myMainView.append(myView)
      myMainView.append(createAlert())
      myButtonsView.append(createRequester())
      myButtonsView.append(createClear())
      myMainView.append(myButtonsView)
      document.body.appendChild(myMainView)
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
    }
    container.append(dropdown)
    container.append(selected)
    return container
  }
  function createImg(src) {
    var img = document.createElement("img");
    img.classList.add('default-img')
    img.setAttribute(
      "src",
      src
    );
    return img;
  }
  function locale(country) {
    let locale = document.createElement('div');
    locale.classList.add(`my-locale`)
    let img = createImg(getFlag(country))
    img.classList.add('my-flag')
    locale.append(img);
    return locale
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

  function getFlag(country) {
    return `https://cdn.countryflags.com/thumbs/united-states-of-america/flag-square-250.png`
  }

  // Call readText initially and then use setInterval for repeated calls
  setTimeout(readText, 2000);
}
