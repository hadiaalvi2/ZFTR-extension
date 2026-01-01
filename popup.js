// DOM Elements
const dropOverlay = document.getElementById('dropOverlay');
const titleInput = document.getElementById('title');
const noteInput = document.getElementById('note');
const historyBtn = document.getElementById('historyBtn');
const colorBtn = document.getElementById('colorBtn');
const uploadSection = document.querySelector('.upload-section');
const closeBtn = document.getElementById('closeBtn');

// Character counter for title
titleInput.addEventListener('input', (e) => {
  const len = e.target.value.length;
  if (len > 30) {
    e.target.value = e.target.value.substring(0, 30);
    return;
  }
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

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('active');
  
  const files = [];
  const items = e.dataTransfer.items;
  
  // Process all items (files and folders)
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        await processEntry(item, files);
      }
    }
  } else {
    files.push(...Array.from(e.dataTransfer.files));
  }
  
  if (files.length > 0) {
    handleFiles(files);
  }
});

// Process directory entries recursively
async function processEntry(entry, files, path = '') {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        // Create a new file object with path information
        const fileWithPath = new File([file], file.name, { type: file.type });
        Object.defineProperty(fileWithPath, 'webkitRelativePath', {
          value: path + file.name,
          writable: false
        });
        files.push(fileWithPath);
        resolve();
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      dirReader.readEntries(async (entries) => {
        for (const childEntry of entries) {
          await processEntry(childEntry, files, path + entry.name + '/');
        }
        resolve();
      });
    }
  });
}

// Click to upload
uploadSection.addEventListener('click', () => {
  showUploadModal();
});

// Show upload modal
function showUploadModal() {
  const modal = document.createElement('div');
  modal.className = 'upload-modal';
  modal.innerHTML = `
    <div class="upload-modal-content">
      <h3 style="font-size: 12px; letter-spacing: 2px; margin-bottom: 20px; font-weight: 600;">SELECT UPLOAD TYPE</h3>
      <button class="upload-option-btn" id="uploadFiles">
        <span style="font-size: 20px; margin-bottom: 8px;">📄</span>
        <span>UPLOAD FILES</span>
      </button>
      <button class="upload-option-btn" id="uploadFolder">
        <span style="font-size: 20px; margin-bottom: 8px;">📁</span>
        <span>UPLOAD FOLDER</span>
      </button>
      <button class="upload-cancel-btn" id="cancelUpload">CANCEL</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .upload-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    
    .upload-modal-content {
      background: #fff;
      padding: 30px;
      border-radius: 0;
      text-align: center;
      min-width: 280px;
    }
    
    .upload-option-btn {
      width: 100%;
      padding: 20px;
      margin-bottom: 12px;
      border: 1.5px solid #000;
      background: #fff;
      cursor: pointer;
      font-size: 10px;
      letter-spacing: 1.5px;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s;
      font-family: inherit;
    }
    
    .upload-option-btn:hover {
      background: #000;
      color: #fff;
    }
    
    .upload-cancel-btn {
      width: 100%;
      padding: 12px;
      border: 1px solid #999;
      background: transparent;
      cursor: pointer;
      font-size: 9px;
      letter-spacing: 1.2px;
      font-weight: 600;
      font-family: inherit;
      margin-top: 8px;
      transition: all 0.2s;
    }
    
    .upload-cancel-btn:hover {
      background: #999;
      color: #fff;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Event listeners
  document.getElementById('uploadFiles').addEventListener('click', () => {
    modal.remove();
    triggerFileInput(false);
  });
  
  document.getElementById('uploadFolder').addEventListener('click', () => {
    modal.remove();
    triggerFileInput(true);
  });
  
  document.getElementById('cancelUpload').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Trigger file input
function triggerFileInput(isFolder) {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  
  if (isFolder) {
    input.webkitdirectory = true;
  }
  
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  });
  
  input.click();
}

// Handle file uploads
function handleFiles(files) {
  if (files.length === 0) return;
  
  console.log('Processing files:', files);
  
  // Determine if folders are included
  const hasFolder = files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
  
  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  // Store file information
  const fileData = {
    title: titleInput.value.trim() || 'Untitled Transfer',
    note: noteInput.value.trim() || '',
    files: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      lastModified: f.lastModified,
      path: f.webkitRelativePath || f.name
    })),
    hasFolder: hasFolder,
    fileCount: files.length,
    totalSize: totalSize,
    timestamp: new Date().toISOString(),
    id: generateId()
  };
  
  // Show upload progress
  showUploadProgress(fileData);
  
  // Simulate upload (in real implementation, this would upload to a server)
  setTimeout(() => {
    // Save to storage
    chrome.storage.local.get(['transfers'], (result) => {
      const transfers = result.transfers || [];
      transfers.unshift(fileData);
      
      // Keep only last 100 transfers
      if (transfers.length > 100) {
        transfers.splice(100);
      }
      
      chrome.storage.local.set({ transfers }, () => {
        showNotification(`Successfully uploaded ${files.length} file(s)!`, 'success');
        
        // Reset form
        titleInput.value = '';
        noteInput.value = '';
        titleInput.placeholder = '0/30';
        
        // Remove progress indicator
        const progressEl = document.querySelector('.upload-progress');
        if (progressEl) {
          progressEl.style.opacity = '0';
          setTimeout(() => progressEl.remove(), 300);
        }
      });
    });
  }, 1500);
}

// Show upload progress
function showUploadProgress(fileData) {
  const progress = document.createElement('div');
  progress.className = 'upload-progress';
  progress.innerHTML = `
    <div class="progress-content">
      <div class="progress-icon">⬆</div>
      <div class="progress-text">Uploading ${fileData.fileCount} file(s)...</div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-size">${formatBytes(fileData.totalSize)}</div>
    </div>
  `;
  
  document.body.appendChild(progress);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .upload-progress {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 2px solid #000;
      padding: 30px;
      z-index: 10001;
      min-width: 300px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    }
    
    .progress-icon {
      font-size: 48px;
      margin-bottom: 15px;
      animation: bounce 1s infinite;
    }
    
    .progress-text {
      font-size: 11px;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: #e0e0e0;
      margin-bottom: 12px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(to right, #4285f4, #ea4335, #fbbc04, #34a853);
      animation: progressFill 1.5s ease-in-out;
    }
    
    .progress-size {
      font-size: 9px;
      letter-spacing: 1px;
      color: #666;
    }
    
    @keyframes slideIn {
      from {
        transform: translate(-50%, -60%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%);
        opacity: 1;
      }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes progressFill {
      from { width: 0; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#34a853' : '#000'};
    color: #fff;
    padding: 14px 28px;
    border-radius: 2px;
    font-size: 10px;
    letter-spacing: 1.5px;
    font-weight: 600;
    z-index: 10002;
    animation: notifSlideDown 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'notifSlideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// History button
historyBtn.addEventListener('click', () => {
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    
    if (transfers.length === 0) {
      showNotification('No transfer history yet!');
      return;
    }
    
    showHistoryModal(transfers);
  });
});

// Show history modal
function showHistoryModal(transfers) {
  const modal = document.createElement('div');
  modal.className = 'history-modal';
  modal.innerHTML = `
    <div class="history-modal-content">
      <div class="history-header">
        <h3>TRANSFER HISTORY (${transfers.length})</h3>
        <button class="history-close">×</button>
      </div>
      <div class="history-list">
        ${transfers.map(t => `
          <div class="history-item" data-id="${t.id}">
            <div class="history-item-header">
              <span class="history-title">${escapeHtml(t.title)}</span>
              <span class="history-date">${formatDate(t.timestamp)}</span>
            </div>
            <div class="history-item-details">
              <span>${t.fileCount} file(s)</span>
              <span>•</span>
              <span>${formatBytes(t.totalSize)}</span>
              ${t.hasFolder ? '<span>•</span><span>📁 Folder</span>' : ''}
            </div>
            ${t.note ? `<div class="history-note">${escapeHtml(t.note)}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="history-footer">
        <button class="history-clear-btn">CLEAR ALL HISTORY</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .history-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
      overflow-y: auto;
    }
    
    .history-modal-content {
      padding: 20px 38px 24px;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #000;
    }
    
    .history-header h3 {
      font-size: 11px;
      letter-spacing: 2px;
      font-weight: 600;
    }
    
    .history-close {
      width: 32px;
      height: 32px;
      border: none;
      background: #000;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      border-radius: 2px;
      line-height: 1;
      transition: opacity 0.2s;
    }
    
    .history-close:hover {
      opacity: 0.8;
    }
    
    .history-list {
      flex: 1;
      margin-bottom: 20px;
    }
    
    .history-item {
      border: 1.5px solid #000;
      background: #fff;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .history-item:hover {
      background: #fafafa;
      transform: translateX(4px);
    }
    
    .history-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .history-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .history-date {
      font-size: 8px;
      color: #666;
      letter-spacing: 0.5px;
    }
    
    .history-item-details {
      font-size: 9px;
      color: #666;
      letter-spacing: 0.5px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .history-note {
      margin-top: 8px;
      font-size: 9px;
      color: #999;
      font-style: italic;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }
    
    .history-footer {
      border-top: 1px solid #d0d0d0;
      padding-top: 16px;
      text-align: center;
    }
    
    .history-clear-btn {
      padding: 12px 24px;
      background: #000;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 9px;
      letter-spacing: 1.5px;
      font-weight: 600;
      transition: opacity 0.2s;
      font-family: inherit;
    }
    
    .history-clear-btn:hover {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
  
  // Event listeners
  modal.querySelector('.history-close').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('.history-clear-btn').addEventListener('click', () => {
    if (confirm('Clear all transfer history? This cannot be undone.')) {
      chrome.storage.local.set({ transfers: [] }, () => {
        modal.remove();
        showNotification('History cleared!', 'success');
      });
    }
  });
}

// Color theme button
const themes = [
  { name: 'Beige', color: '#fff' },
  { name: 'Blue', color: '#e8f4f8' },
  { name: 'Yellow', color: '#fef5e7' },
  { name: 'Gray', color: '#f0f0f0' },
  { name: 'White', color: '#fff' }
];
let currentThemeIndex = 0;

colorBtn.addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const theme = themes[currentThemeIndex];
  
  applyTheme(theme.color);
  showNotification(`Theme: ${theme.name}`, 'info');
  
  // Save theme preference
  chrome.storage.local.set({ theme: theme.color });
});

// Apply theme
function applyTheme(color) {
  document.body.style.backgroundColor = color;
  document.querySelector('.container').style.backgroundColor = color;
  
  const historyModal = document.querySelector('.history-modal');
  if (historyModal) {
    historyModal.style.backgroundColor = color;
  }
}

// Load theme preference
chrome.storage.local.get(['theme'], (result) => {
  if (result.theme) {
    applyTheme(result.theme);
    currentThemeIndex = themes.findIndex(t => t.color === result.theme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
  }
});

// Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Add CSS animations
const animStyle = document.createElement('style');
animStyle.textContent = `
  @keyframes notifSlideDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes notifSlideUp {
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
document.head.appendChild(animStyle);

// Close button functionality
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    window.close();
  });
}

// Initialize
console.log('ZTR Extension Loaded - Ready for uploads');