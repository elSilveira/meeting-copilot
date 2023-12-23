// background.js
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details);
});
chrome.runtime.onMessage.addListener((event, sender, sendResponse) => {
  if (event) {
    switch (event.action) {
      case 'storage.set':
        const setStorage = (key, value) => {
          chrome.storage.local.set({ [key]: value }, function () {
            console.log(`Data set in local storage for key: ${key}`);
            sendResponse({ success: true });
          });
        };

        if (event.key) {
          setStorage('apiKey', event.key);
        }
        if (event.type) {
          setStorage('apiType', event.type);
        }
        break;

      case 'storage.get':
        if (event.type === 'apiKey') {
          chrome.storage.local.get(['apiKey'], function (result) {
            sendResponse(result.apiKey);
          });
        }
        if (event.type === 'apiType') {
          chrome.storage.local.get(['apiType'], function (result) {
            sendResponse(result.apiType || 'openAi');
          });
        }
        break;

      case 'storage.delete':
        chrome.storage.local.remove(['apiKey'], function () {
          console.log(`Data deleted from local storage for key: apiKey`);
          sendResponse({ success: true });
        });
        break;

      default:
        sendResponse({ success: false });
    }
  }

  // To ensure the sendResponse is called asynchronously
  return true;
});
