// Content script for ZTR extension
// This runs on all web pages

// Create floating upload button
const createFloatingButton = () => {
  // Check if button already exists
  if (document.getElementById('ztr-floating-btn')) return;
  
  const button = document.createElement('div');
  button.id = 'ztr-floating-btn';
  button.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  `;
  button.title = 'Upload with ZTR';
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(button);
};

// Create drop overlay
const createDropOverlay = () => {
  if (document.querySelector('.ztr-drop-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'ztr-drop-overlay';
  overlay.innerHTML = '<div class="ztr-drop-text">DROP FILES HERE</div>';
  document.body.appendChild(overlay);
  
  return overlay;
};

// Drag and drop handlers for entire page
let dragCounter = 0;
let dropOverlay = null;

const handleDragEnter = (e) => {
  e.preventDefault();
  dragCounter++;
  
  if (dragCounter === 1) {
    if (!dropOverlay) {
      dropOverlay = createDropOverlay();
    }
    dropOverlay.classList.add('active');
    document.body.classList.add('ztr-drop-active');
  }
};

const handleDragLeave = (e) => {
  e.preventDefault();
  dragCounter--;
  
  if (dragCounter === 0) {
    if (dropOverlay) {
      dropOverlay.classList.remove('active');
    }
    document.body.classList.remove('ztr-drop-active');
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
};

const handleDrop = (e) => {
  e.preventDefault();
  dragCounter = 0;
  
  if (dropOverlay) {
    dropOverlay.classList.remove('active');
  }
  document.body.classList.remove('ztr-drop-active');
  
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    handleFiles(files);
  }
};

// Handle files dropped on page
const handleFiles = (files) => {
  const fileData = {
    files: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    })),
    fileCount: files.length,
    timestamp: new Date().toISOString()
  };
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: 'uploadFiles',
    data: fileData
  }, (response) => {
    if (response && response.success) {
      showNotification(`Successfully uploaded ${files.length} file(s)!`);
    }
  });
};

// Show notification on page
const showNotification = (message) => {
  const notification = document.createElement('div');
  notification.className = 'ztr-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('ztr-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Initialize
const init = () => {
  createFloatingButton();
  
  // Add drag and drop listeners
  document.addEventListener('dragenter', handleDragEnter);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('drop', handleDrop);
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlightDropZone') {
    if (!dropOverlay) {
      dropOverlay = createDropOverlay();
    }
    dropOverlay.classList.add('active');
    document.body.classList.add('ztr-drop-active');
    
    setTimeout(() => {
      dropOverlay.classList.remove('active');
      document.body.classList.remove('ztr-drop-active');
    }, 2000);
  }
  
  sendResponse({ success: true });
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  document.removeEventListener('dragenter', handleDragEnter);
  document.removeEventListener('dragleave', handleDragLeave);
  document.removeEventListener('dragover', handleDragOver);
  document.removeEventListener('drop', handleDrop);
});