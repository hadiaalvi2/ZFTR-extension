// Background service worker for ZTR extension

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('ZTR Extension Installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({
    transfers: [],
    settings: {
      theme: '#f5f5dc',
      notifications: true,
      maxHistory: 100
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'uploadFiles':
      handleFileUpload(request.data);
      sendResponse({ success: true });
      break;
      
    case 'getTransfers':
      chrome.storage.local.get(['transfers'], (result) => {
        sendResponse({ transfers: result.transfers || [] });
      });
      return true; // Keep channel open for async response
      
    case 'clearHistory':
      chrome.storage.local.set({ transfers: [] }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'openPopup':
      chrome.action.openPopup();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Handle file upload logic
function handleFileUpload(data) {
  chrome.storage.local.get(['transfers', 'settings'], (result) => {
    const transfers = result.transfers || [];
    const settings = result.settings || {};
    const maxHistory = settings.maxHistory || 100;
    
    // Add new transfer
    transfers.unshift({
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last N transfers
    if (transfers.length > maxHistory) {
      transfers.splice(maxHistory);
    }
    
    chrome.storage.local.set({ transfers }, () => {
      // Show notification if enabled
      if (settings.notifications) {
        showNotification(data);
      }
    });
  });
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Show notification
function showNotification(data) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/logo.svg',
    title: 'ZTR - Upload Complete',
    message: `${data.fileCount || 0} file(s) uploaded successfully`,
    priority: 1
  });
}

// Context menu for quick upload
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ztrUpload',
    title: 'Upload with ZTR',
    contexts: ['page', 'selection', 'link', 'image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ztrUpload') {
    chrome.action.openPopup();
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-ztr') {
    chrome.action.openPopup();
  }
});

// Clean up old transfers periodically (keep last 30 days)
setInterval(() => {
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = transfers.filter(t => {
      const timestamp = new Date(t.timestamp).getTime();
      return timestamp > thirtyDaysAgo;
    });
    
    if (filtered.length < transfers.length) {
      chrome.storage.local.set({ transfers: filtered });
      console.log(`Cleaned up ${transfers.length - filtered.length} old transfers`);
    }
  });
}, 24 * 60 * 60 * 1000); // Run once per day