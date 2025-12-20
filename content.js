// Content script for ZTR extension
// This runs on all web pages

// Create floating upload button
const createFloatingButton = () => {
  const button = document.createElement('div');
  button.id = 'ztr-floating-btn';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
  createFloatingButton();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlightDropZone') {
    document.body.style.outline = '3px dashed #000';
    setTimeout(() => {
      document.body.style.outline = '';
    }, 2000);
  }
  
  sendResponse({ success: true });
});