// Goodreads Series Manager - Background Script

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Goodreads Series Manager installed');
    
    // Set default settings
    chrome.storage.sync.set({
      defaultShelf: 'to-read',
      autoSort: true,
      rateLimit: 2000 // ms between requests - increased for safety
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      getSettings(sendResponse);
      return true;
      
    case 'saveSettings':
      saveSettings(request.data, sendResponse);
      return true;
      
    case 'logError':
      console.error('Content script error:', request.error);
      sendResponse({ received: true });
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

function getSettings(sendResponse) {
  chrome.storage.sync.get(['defaultShelf', 'autoSort', 'rateLimit'], (result) => {
    sendResponse({
      defaultShelf: result.defaultShelf || 'to-read',
      autoSort: result.autoSort !== false,
      rateLimit: result.rateLimit || 2000
    });
  });
}

function saveSettings(settings, sendResponse) {
  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
    } else {
      sendResponse({ success: true });
    }
  });
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('goodreads.com')) {
    
    // Content script should already be injected via manifest
    console.log('Goodreads page loaded:', tab.url);
  }
});