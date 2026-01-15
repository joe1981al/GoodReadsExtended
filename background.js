// Goodreads Series Manager - Background Script

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Goodreads Series Manager installed');
    
    // Set default settings
    chrome.storage.sync.set({
      defaultShelf: 'to-read',
      autoSort: true,
      rateLimit: 1000 // ms between requests
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'addBookToShelf':
      handleAddBookToShelf(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'getSettings':
      getSettings(sendResponse);
      return true;
      
    case 'saveSettings':
      saveSettings(request.data, sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

async function handleAddBookToShelf(data, sendResponse) {
  try {
    const { bookId, shelfName } = data;
    
    // Get current settings
    const settings = await getStoredSettings();
    
    // Simulate API call to Goodreads
    // In a real implementation, this would make actual HTTP requests
    // to Goodreads API or simulate form submissions
    
    await delay(settings.rateLimit);
    
    // For now, just log the action
    console.log(`Adding book ${bookId} to shelf ${shelfName}`);
    
    sendResponse({ success: true, bookId, shelfName });
  } catch (error) {
    console.error('Error adding book to shelf:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function getSettings(sendResponse) {
  chrome.storage.sync.get(['defaultShelf', 'autoSort', 'rateLimit'], (result) => {
    sendResponse({
      defaultShelf: result.defaultShelf || 'to-read',
      autoSort: result.autoSort !== false,
      rateLimit: result.rateLimit || 1000
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

function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['defaultShelf', 'autoSort', 'rateLimit'], (result) => {
      resolve({
        defaultShelf: result.defaultShelf || 'to-read',
        autoSort: result.autoSort !== false,
        rateLimit: result.rateLimit || 1000
      });
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('goodreads.com')) {
    
    // Content script should already be injected via manifest
    // This is just for additional initialization if needed
    console.log('Goodreads page loaded:', tab.url);
  }
});