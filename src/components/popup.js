/*global chrome*/
import React, { useState, useEffect } from 'react';
import './popup.scss'; // Import the SCSS file

function Popup() {
  const [aiKey, setAiKey] = useState('');
  const [savedAiKey, setSavedAiKey] = useState('');
  const [aiType, setAiType] = useState('');

  useEffect(() => {
    // Fetch the initial values from storage when the component mounts
    chrome.runtime.sendMessage({ action: 'storage.get', type: 'apiType' }, (ev) => {
      console.log('Type', ev)
      setAiType(ev || ''); // Ensure a default value is set
    });

    chrome.runtime.sendMessage({ action: 'storage.get', type: 'apiKey' }, (ev) => {
      console.log('Key', ev)
      setSavedAiKey(ev); // Ensure a default value is set
    });
  }, []);

  const handleInputChange = (event) => {
    setAiKey(event.target.value);
  };

  const saveAiKey = () => {
    setSavedAiKey(aiKey);
    chrome.runtime.sendMessage({ action: 'storage.set', key: aiKey });
  };

  const clearAiKey = () => {
    setAiKey('');
    setSavedAiKey('');
    chrome.runtime.sendMessage({ action: 'storage.delete' });
  };

  const handleAiTypeChange = (event) => {
    const newAiType = event.target.id;
    setAiType(newAiType);
    chrome.runtime.sendMessage({ action: 'storage.set', type: newAiType });
  };

  return (
    <div>
      {savedAiKey ? (
        <div className='allset--container'>
          <h1>You're all set!</h1>
          <h4>{aiType}</h4>
          <button onClick={clearAiKey}>Clear AI Key</button>
        </div>
      ) : (
        <div className='insert--container'>
          <h1>Please insert your AI Key:</h1>
          <div className='insert--content'>
            <label htmlFor="aiKeyInput">AI Key:</label>
            <input
              type="text"
              id="aiKeyInput"
              value={aiKey}
              onChange={handleInputChange}
            />
            <div>
              <div class="insert--radio">
                <input
                  type="radio"
                  id="googleAi"
                  name="contact"
                  value="Google Gemni"
                  checked={aiType === 'googleAi'}
                  onChange={handleAiTypeChange}
                />
                <label htmlFor="googleAi">Google Gemni</label>
              </div>
              <div class="insert--radio">
                <input
                  type="radio"
                  id="openAi"
                  name="contact"
                  value="OpenAi"
                  checked={aiType === 'openAi'}
                  onChange={handleAiTypeChange}
                />
                <label htmlFor="openAi">OpenAi</label>
              </div>
            </div>
            <button onClick={saveAiKey}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Popup;
