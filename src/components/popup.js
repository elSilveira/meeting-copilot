/*global chrome*/
import React, { useState } from 'react';

function Popup() {
  const [openAiKey, setOpenAiKey] = useState('');
  const [savedAiKey, setSavedAiKey] = useState('');
  const [gemniKey, setGemniKey] = useState('');
  const [savedGemniKey, setSavedGemniKey] = useState('');

  chrome.runtime.sendMessage({ action: 'storage.get' }, (ev) => {
    setSavedAiKey(ev)
  })

  const handleInputChange = (event) => {
    setOpenAiKey(event.target.value);
  };

  const saveOpenAiKey = () => {
    setSavedAiKey(openAiKey);
    chrome.runtime.sendMessage({ action: 'storage.set', key: openAiKey });
  };  

  const clearOpenAiKey = () => {
    setOpenAiKey('')
    setSavedAiKey('')
    chrome.runtime.sendMessage({ action: 'storage.delete' })
  };

  const handleGemniInputChange = (event) => {
    setSavedGemniKey(event.target.value);
  };

  const saveGemniKey = () => {
    setSavedGemniKey(gemniKey);
    chrome.runtime.sendMessage({ action: 'storage.set', key: gemniKey });
  };
  
  const clearGemniKey = () => {
    setGemniKey('')
    setSavedGemniKey('')
    chrome.runtime.sendMessage({ action: 'storage.delete' })
  };

  if (savedAiKey) {
    return (
      <div>
        <h1>You're all set!</h1>
        <button onClick={clearOpenAiKey}>Clear OpenAI Key</button>
        <button onClick={clearGemniKey}>Clear Google Key</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Please insert your OpenAiKey:</h1>
      <div>
        <label htmlFor="openAiKeyInput">OpenAiKey:</label>
        <input
          type="text"
          id="openAiKeyInput"
          value={openAiKey}
          onChange={handleInputChange}
        />
        <button onClick={saveOpenAiKey}>Save</button>
      </div>
      <div>
        <label htmlFor="gemniKeyInput">Google Gemni Key:</label>
        <input
          type="text"
          id="gemniKeyInput"
          value={gemniKey}
          onChange={handleGemniInputChange}
        />
        <button onClick={saveGemniKey}>Save</button>
      </div>
    </div>
  );
}

export default Popup;
