// DOM Elements
const dropOverlay = document.getElementById('dropOverlay');
const titleInput = document.getElementById('title');
const noteInput = document.getElementById('note');
const historyBtn = document.getElementById('historyBtn');
const colorBtn = document.getElementById('colorBtn');
const uploadSection = document.getElementById('uploadSection');
const termsLink = document.getElementById('termsLink');
const privacyLink = document.getElementById('privacyLink');

// Character counter for title
titleInput.addEventListener('input', (e) => {
  const len = e.target.value.length;
  e.target.placeholder = `${len}/30`;
});

// Initialize placeholder
titleInput.placeholder = '0/30';

// Drag and drop handlers
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    dropOverlay.classList.add('active');
  }
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropOverlay.classList.remove('active');
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('active');
  
  const files = Array.from(e.dataTransfer.files);
  const items = Array.from(e.dataTransfer.items);
  
  handleFiles(files, items);
});

// Click to upload
uploadSection.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  
  // Add folder support
  const folderInput = document.createElement('input');
  folderInput.type = 'file';
  folderInput.webkitdirectory = true;
  
  // Show modal to choose files or folders
  const choice = confirm('Click OK to upload FILES, or Cancel to upload FOLDERS');
  
  if (choice) {
    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFiles(files);
    });
    input.click();
  } else {
    folderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFiles(files);
    });
    folderInput.click();
  }
});

// Handle file uploads
function handleFiles(files, items = null) {
  if (files.length === 0) return;
  
  console.log('Files to upload:', files);
  
  // Determine if folders are included
  let hasFolder = false;
  if (items && items.length > 0) {
    hasFolder = items.some(item => {
      const entry = item.webkitGetAsEntry();
      return entry && entry.isDirectory;
    });
  }
  
  // Store file information
  const fileData = {
    title: titleInput.value || 'Untitled Transfer',
    note: noteInput.value || '',
    files: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      path: f.webkitRelativePath || f.name
    })),
    hasFolder: hasFolder,
    fileCount: files.length,
    timestamp: new Date().toISOString(),
    id: generateId()
  };
  
  // Save to storage
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    transfers.unshift(fileData);
    
    // Keep only last 100 transfers
    if (transfers.length > 100) {
      transfers.splice(100);
    }
    
    chrome.storage.local.set({ transfers }, () => {
      showNotification(`Successfully uploaded ${files.length} file(s)!`);
      
      // Reset form
      titleInput.value = '';
      titleInput.placeholder = '0/30';
    });
  });
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    color: #fff;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 11px;
    letter-spacing: 1px;
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// History button
historyBtn.addEventListener('click', () => {
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    
    if (transfers.length === 0) {
      showNotification('No transfer history yet!');
      return;
    }
    
    // Create history view
    const historyHTML = `
      <div style="padding: 20px;">
        <h3 style="margin-bottom: 15px; font-size: 14px; letter-spacing: 2px;">TRANSFER HISTORY (${transfers.length})</h3>
        <div style="max-height: 400px; overflow-y: auto;">
          ${transfers.map(t => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px 0; font-size: 11px;">
              <div style="font-weight: 600; margin-bottom: 5px;">${t.title}</div>
              <div style="color: #666;">${t.fileCount} file(s) - ${new Date(t.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
        <button id="clearHistoryBtn" style="margin-top: 15px; padding: 8px 16px; background: #000; color: #fff; border: none; cursor: pointer; font-size: 10px; letter-spacing: 1px;">CLEAR HISTORY</button>
      </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #f5f5dc;
      z-index: 9999;
      overflow-y: auto;
    `;
    modal.innerHTML = historyHTML;
    document.body.appendChild(modal);
    
    modal.querySelector('#clearHistoryBtn').addEventListener('click', () => {
      if (confirm('Clear all transfer history?')) {
        chrome.storage.local.set({ transfers: [] }, () => {
          modal.remove();
          showNotification('History cleared!');
        });
      }
    });
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  });
});

// Color theme button
const themes = ['#f5f5dc', '#e8f4f8', '#fef5e7', '#f0f0f0', '#fff'];
let currentThemeIndex = 0;

colorBtn.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const newColor = themes[currentThemeIndex];
  
  document.body.style.backgroundColor = newColor;
  document.querySelector('.container').style.backgroundColor = newColor;
  
  // Save theme preference
  chrome.storage.local.set({ theme: newColor });
});

// Load theme preference
chrome.storage.local.get(['theme'], (result) => {
  if (result.theme) {
    document.body.style.backgroundColor = result.theme;
    document.querySelector('.container').style.backgroundColor = result.theme;
    currentThemeIndex = themes.indexOf(result.theme);
  }
});

// Footer links
termsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://example.com/terms' });
});

privacyLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://example.com/privacy' });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
console.log('ZTR Extension Loaded - Popup Ready');