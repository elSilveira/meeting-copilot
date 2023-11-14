// background.js
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details);
});

chrome.runtime.onMessage.addListener((event, sender, sendResponse) => {
  if (event) {
    switch (event.action) {
      case 'storage.set':
        chrome.storage.local.set({ openAiKey: event.key }, function () {
          console.log('Data set in local storage');
          sendResponse({ success: true });
        });
        break;
      case 'storage.get':
        chrome.storage.local.get(['openAiKey'], function (result) {
          sendResponse(result.openAiKey);
        });
        // Return true to indicate that you will send a response asynchronously
        return true;
      case 'storage.delete':
        chrome.storage.local.remove(['openAiKey'], function () {
          console.log('Data deleted from local storage');
          sendResponse({ success: true });
        });
        break;
      default:
        sendResponse({ success: false });
    }
  }
});

