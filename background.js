// Background service worker for ZTR extension

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('ZTR Extension Installed');
  
  // Initialize storage
  chrome.storage.local.set({
    transfers: [],
    settings: {
      theme: 'beige',
      notifications: true
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'uploadFiles') {
    handleFileUpload(request.data);
    sendResponse({ success: true });
  }
  
  if (request.action === 'getTransfers') {
    chrome.storage.local.get(['transfers'], (result) => {
      sendResponse({ transfers: result.transfers || [] });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'clearHistory') {
    chrome.storage.local.set({ transfers: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle file upload logic
function handleFileUpload(data) {
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    transfers.unshift({
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 transfers
    if (transfers.length > 100) {
      transfers.splice(100);
    }
    
    chrome.storage.local.set({ transfers });
  });
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Context menu for quick upload
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ztrUpload',
    title: 'Upload with ZTR',
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ztrUpload') {
    chrome.action.openPopup();
  }
});