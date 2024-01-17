// background.js
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details);
});
var page;
chrome.runtime.onMessage.addListener((event, sender, sendResponse) => {
  const setStorage = (key, value) => {
    chrome.storage.local.set({ [key]: value }, function () {
      console.log(`Data set in local storage for key: ${key}`);
      sendResponse({ success: true });
    });
  };

  if (event) {
    switch (event.action) {
      case 'storage.set':
        if (event.key) {
          setStorage('apiKey', event.key);
        }
        if (event.type) {
          setStorage('apiType', event.type);
        }
        if (event.blocklist) {
          setStorage('blocklist', event.blocklist);
        }
        break;

      case 'storage.get':
        if (event.type === 'apiKey') {
          try {
            chrome.storage.local.get(['apiKey'], function (result) {
              if (result.apiKey)
                sendResponse(result.apiKey);
              else {
                chrome.storage.local.get(['openAiKey'], function (openAiResult) {
                  chrome.runtime.sendMessage({ action: 'storage.set', key: openAiResult.openAiKey });
                  chrome.storage.local.remove(['openAiKey'], () => { });
                  sendResponse(openAiResult.openAiKey);
                });
              }
            });
          } catch (err) {
            console.log("Key not found.")
          }
        }
        if (event.type === 'apiType') {
          chrome.storage.local.get(['apiType'], function (result) {
            sendResponse(result.apiType || 'openAi');
          });
        }
        if (event.type === 'blocklist') {
          chrome.storage.local.get(['blocklist'], function (result) {
            sendResponse(result.blocklist || []);
          });
        }
        break;

      case 'storage.delete':
        chrome.storage.local.remove(['openAiKey'], function () {
          console.log(`Data deleted from local storage for key: openAiKey`);
        });
        chrome.storage.local.remove(['apiKey'], function () {
          console.log(`Data deleted from local storage for key: apiKey`);
          sendResponse({ success: true });
        });
        break;

      case 'getPage':
        sendResponse(page);
        break;

      case 'setPage':
        page = event.url
        break;

      case 'unblock':
        let bl = chrome.storage.local.get(['blocklist'],
          function (result) {
            let fr = result.blocklist.filter((url) => url !== event.page);
            setStorage('blocklist', fr)
          });
        break;

      default:
        sendResponse({ success: false });
    }
  }

  // To ensure the sendResponse is called asynchronously
  return true;
});
