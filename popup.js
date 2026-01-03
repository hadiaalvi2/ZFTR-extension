// Check if JSZip is loaded
if (typeof JSZip === 'undefined') {
  console.error('CRITICAL: JSZip library not found!');
  showNotification('Error: Extension files are missing. Please reinstall.', 'info');
} else {
  console.log('✓ JSZip loaded successfully');
}

// DOM Elements
const dropOverlay = document.getElementById('dropOverlay');
const titleInput = document.getElementById('title');
const noteInput = document.getElementById('note');
const historyBtn = document.getElementById('historyBtn');
const colorBtn = document.getElementById('colorBtn');
const uploadSection = document.querySelector('.upload-section');
const closeBtn = document.getElementById('closeBtn');

const actionSection = document.getElementById('actionSection');
const getLinkBtn = document.getElementById('getLinkBtn');
const uploadStatus = document.getElementById('uploadStatus');
const uploadComplete = document.getElementById('uploadComplete');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const generatedLink = document.getElementById('generatedLink');
const qrCode = document.getElementById('qrCode');

let uploadedFiles = [];
let uploadAborted = false;

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
    let folderCount = 0;
    let fileCount = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        if (item.isDirectory) {
          folderCount++;
        } else {
          fileCount++;
        }
        await processEntry(item, files);
      }
    }
    
    // Show appropriate message
    if (folderCount > 0 && fileCount > 0) {
      console.log(`Dropped ${folderCount} folder(s) and ${fileCount} file(s)`);
    } else if (folderCount > 0) {
      console.log(`Dropped ${folderCount} folder(s)`);
    } else {
      console.log(`Dropped ${fileCount} file(s)`);
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
  
  console.log('Files dropped:', files);
  
  // Filter out empty files
  const validFiles = files.filter(file => {
    if (file.size === 0) {
      console.warn('Skipping empty file:', file.name);
      showNotification(`Skipped empty file: ${file.name}`, 'info');
      return false;
    }
    return true;
  });
  
  if (validFiles.length === 0) {
    showNotification('No valid files to upload (all files are empty)');
    return;
  }
  
  // Append to existing files instead of replacing
  uploadedFiles = [...uploadedFiles, ...validFiles];
  
  // Show file list
  displayFileList(uploadedFiles);
  
  // Show action section
  const fileListSection = document.getElementById('fileListSection');
  fileListSection.style.display = 'block';
  actionSection.style.display = 'block';
  
  // Adjust body height
  adjustBodyHeight();
  
  // Hide any previous upload states
  uploadStatus.style.display = 'none';
  uploadComplete.style.display = 'none';
  getLinkBtn.style.display = 'block';
  
  showNotification(`Added ${validFiles.length} file(s)`, 'success');
}

// Display file list
function displayFileList(files) {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';
  
  if (files.length === 0) {
    fileList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No files selected</div>';
    return;
  }
  
  // Group files by folder
  const filesByFolder = new Map();
  const singleFiles = [];
  
  files.forEach((file, index) => {
    const path = file.webkitRelativePath || file.name;
    const pathParts = path.split('/');
    
    if (pathParts.length > 1) {
      // File is in a folder
      const folderName = pathParts[0];
      if (!filesByFolder.has(folderName)) {
        filesByFolder.set(folderName, []);
      }
      filesByFolder.get(folderName).push({ file, index, path });
    } else {
      // Single file (not in a folder)
      singleFiles.push({ file, index, path });
    }
  });
  
  // Display folders first
  filesByFolder.forEach((items, folderName) => {
    const folderSize = items.reduce((sum, item) => sum + item.file.size, 0);
    const fileItem = createFileItem(
      folderName, 
      items.length, 
      folderSize, 
      true, 
      items.map(i => i.index),
      ''
    );
    fileList.appendChild(fileItem);
  });
  
  // Then display individual files
  singleFiles.forEach(({ file, index }) => {
    const fileItem = createFileItem(
      file.name, 
      1, 
      file.size, 
      false, 
      [index], 
      getFileExtension(file.name)
    );
    fileList.appendChild(fileItem);
  });
}

// Create file item element
function createFileItem(name, count, size, isFolder, indices, extension = '') {
  const item = document.createElement('div');
  item.className = 'file-item';
  item.dataset.indices = JSON.stringify(indices);
  
  const displayName = isFolder ? name : name;
  const details = isFolder 
    ? `${count} file(s) - ${formatBytes(size)}` 
    : `${formatBytes(size)}${extension ? ' - ' + extension.toUpperCase() : ''}`;
  
  item.innerHTML = `
    <div class="file-item-left">
      <div class="file-item-name">
        ${isFolder ? '<span class="folder-indicator">📁</span>' : ''}
        ${escapeHtml(displayName)}
      </div>
      <div class="file-item-details">${details}</div>
    </div>
    <div class="file-item-right">
      <button class="file-remove-btn" title="Remove">×</button>
    </div>
  `;
  
  // Add remove functionality
  const removeBtn = item.querySelector('.file-remove-btn');
  removeBtn.addEventListener('click', () => {
    if (isFolder) {
      removeFolder(name);
    } else {
      removeFileByIndex(indices[0]);
    }
  });
  
  return item;
}

// Get file extension
function getFileExtension(filename) {
  const ext = filename.split('.').pop();
  return ext === filename ? '' : ext;
}

// Remove single file by index
function removeFileByIndex(index) {
  uploadedFiles.splice(index, 1);
  
  if (uploadedFiles.length === 0) {
    document.getElementById('fileListSection').style.display = 'none';
    actionSection.style.display = 'none';
  } else {
    displayFileList(uploadedFiles);
  }
  adjustBodyHeight();
}

// Remove entire folder
function removeFolder(folderName) {
  uploadedFiles = uploadedFiles.filter(file => {
    const path = file.webkitRelativePath || file.name;
    const pathParts = path.split('/');
    return pathParts.length <= 1 || pathParts[0] !== folderName;
  });
  
  if (uploadedFiles.length === 0) {
    document.getElementById('fileListSection').style.display = 'none';
    actionSection.style.display = 'none';
  } else {
    displayFileList(uploadedFiles);
  }
  adjustBodyHeight();
  showNotification(`Removed folder: ${folderName}`, 'info');
}

// Adjust body height dynamically
function adjustBodyHeight() {
  setTimeout(() => {
    const containerHeight = document.querySelector('.container').offsetHeight;
    document.body.style.height = Math.min(containerHeight + 40, 800) + 'px';
  }, 100);
}

// Validate inputs
function validateInputs() {
  let isValid = true;
  
  // Validate title
  const titleGroup = titleInput.closest('.input-group');
  const existingTitleError = titleGroup.querySelector('.error-message');
  if (existingTitleError) existingTitleError.remove();
  titleGroup.classList.remove('error');
  
  if (!titleInput.value.trim()) {
    titleGroup.classList.add('error');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = 'TITLE IS REQUIRED';
    titleGroup.appendChild(error);
    isValid = false;
  }
  
  // Validate note
  const noteGroup = noteInput.closest('.input-group');
  const existingNoteError = noteGroup.querySelector('.error-message');
  if (existingNoteError) existingNoteError.remove();
  noteGroup.classList.remove('error');
  
  if (!noteInput.value.trim()) {
    noteGroup.classList.add('error');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = 'NOTE IS REQUIRED';
    noteGroup.appendChild(error);
    isValid = false;
  }
  
  return isValid;
}

// Get Link button handler
getLinkBtn.addEventListener('click', async () => {
  if (uploadedFiles.length === 0) {
    showNotification('Please drop files first!');
    return;
  }
  
  if (!validateInputs()) {
    showNotification('Please fill in all required fields!');
    return;
  }
  
  // Show uploading status
  getLinkBtn.style.display = 'none';
  uploadStatus.style.display = 'block';
  uploadAborted = false;
  
  adjustBodyHeight();
  
  try {
    let finalUrl;
    
    // Check if we have folders
    const hasFolders = uploadedFiles.some(f => (f.webkitRelativePath || '').includes('/'));
    
    if (hasFolders) {
      // ZIP the folder(s) and upload
      showNotification('Creating ZIP archive...');
      const zipBlob = await createZipFromFiles(uploadedFiles, titleInput.value.trim());
      
      if (uploadAborted) {
        resetUploadUI();
        return;
      }
      
      showNotification('Uploading ZIP file...');
      const zipFile = new File([zipBlob], `${titleInput.value.trim()}.zip`, { type: 'application/zip' });
      const uploadedUrl = await uploadToCatbox(zipFile);
      
      if (uploadAborted) {
        resetUploadUI();
        return;
      }
      
      finalUrl = uploadedUrl;
      console.log('ZIP uploaded successfully:', finalUrl);
      
    } else if (uploadedFiles.length === 1) {
      // Single file upload
      showNotification('Uploading file...');
      finalUrl = await uploadToCatbox(uploadedFiles[0]);
      
      if (uploadAborted) {
        resetUploadUI();
        return;
      }
      
    } else {
      // Multiple individual files - create a ZIP
      showNotification('Creating ZIP archive...');
      const zipBlob = await createZipFromFiles(uploadedFiles, titleInput.value.trim());
      
      if (uploadAborted) {
        resetUploadUI();
        return;
      }
      
      showNotification('Uploading ZIP file...');
      const zipFile = new File([zipBlob], `${titleInput.value.trim()}.zip`, { type: 'application/zip' });
      finalUrl = await uploadToCatbox(zipFile);
      
      if (uploadAborted) {
        resetUploadUI();
        return;
      }
    }
    
    // Generate link ID for storage
    const linkId = generateLinkId();
    
    // Save to storage with file data
    const fileData = {
      id: linkId,
      title: titleInput.value.trim(),
      note: noteInput.value.trim(),
      files: uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        lastModified: f.lastModified,
        path: f.webkitRelativePath || f.name
      })),
      fileCount: uploadedFiles.length,
      totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
      link: finalUrl,
      timestamp: new Date().toISOString()
    };
    
    chrome.storage.local.get(['transfers'], (result) => {
      const transfers = result.transfers || [];
      transfers.unshift(fileData);
      
      if (transfers.length > 100) {
        transfers.splice(100);
      }
      
      chrome.storage.local.set({ transfers }, () => {
        // Show upload complete
        uploadStatus.style.display = 'none';
        uploadComplete.style.display = 'block';
        
        generatedLink.textContent = finalUrl;
        generateQRCode(finalUrl);
        
        adjustBodyHeight();
        
        showNotification('Upload complete! Link created.', 'success');
      });
    });
    
  } catch (error) {
    console.error('Upload process error:', error);
    uploadStatus.style.display = 'none';
    getLinkBtn.style.display = 'block';
    showNotification('Upload failed: ' + error.message);
    adjustBodyHeight();
  }
});

// Helper function to reset upload UI
function resetUploadUI() {
  uploadStatus.style.display = 'none';
  getLinkBtn.style.display = 'block';
  adjustBodyHeight();
}

// Create ZIP from files
async function createZipFromFiles(files, archiveName) {
  const zip = new JSZip();
  
  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    zip.file(path, file);
  }
  
  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  return zipBlob;
}

// Upload to Catbox.moe (accepts all file types, 200MB limit)
async function uploadToCatbox(file) {
  try {
    console.log('Uploading to Catbox:', file.name, 'Size:', file.size);
    
    // Check file size (Catbox limit is 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 200MB.');
    }
    
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const url = await response.text();
    
    // Catbox returns just the URL as plain text
    if (url && url.startsWith('https://files.catbox.moe/')) {
      console.log('Upload successful:', url);
      return url;
    }
    
    throw new Error('Invalid response from Catbox');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout - file too large or slow connection');
    }
    console.error('Catbox upload error:', error);
    
    // Try alternative service: 0x0.st
    console.log('Catbox failed, trying 0x0.st...');
    return await uploadTo0x0(file);
  }
}

// Fallback: Upload to 0x0.st (accepts all file types, 512MB limit)
async function uploadTo0x0(file) {
  try {
    console.log('Uploading to 0x0.st:', file.name);
    
    const maxSize = 512 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 512MB.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    const response = await fetch('https://0x0.st', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const url = await response.text();
    
    if (url && url.trim().startsWith('https://')) {
      const cleanUrl = url.trim();
      console.log('Upload successful:', cleanUrl);
      return cleanUrl;
    }
    
    throw new Error('All upload services failed');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout');
    }
    throw error;
  }
}

// Cancel upload
cancelUploadBtn.addEventListener('click', () => {
  uploadAborted = true;
  uploadStatus.style.display = 'none';
  getLinkBtn.style.display = 'block';
  adjustBodyHeight();
  showNotification('Upload cancelled');
});

// Copy link
copyLinkBtn.addEventListener('click', () => {
  const link = generatedLink.textContent;
  navigator.clipboard.writeText(link).then(() => {
    showNotification('Link copied to clipboard!', 'success');
    copyLinkBtn.textContent = 'COPIED!';
    setTimeout(() => {
      copyLinkBtn.textContent = 'COPY LINK';
    }, 2000);
  });
});

// Generate unique link ID
function generateLinkId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate QR Code
function generateQRCode(text) {
  qrCode.innerHTML = '';
  
  const qrImage = document.createElement('div');
  qrImage.style.cssText = `
    width: 180px;
    height: 180px;
    background: url('https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}') center/contain no-repeat;
  `;
  qrCode.appendChild(qrImage);
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
            </div>
            ${t.note ? `<div class="history-note">${escapeHtml(t.note)}</div>` : ''}
            <div class="history-link">${t.link}</div>
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
      padding: 20px 28px 24px;
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
      margin-bottom: 8px;
    }
    
    .history-note {
      margin-top: 8px;
      font-size: 9px;
      color: #999;
      font-style: italic;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
      margin-bottom: 8px;
    }
    
    .history-link {
      font-size: 9px;
      color: #0066cc;
      word-break: break-all;
      font-family: monospace;
      background: #f5f5f5;
      padding: 8px;
      margin-top: 8px;
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
  
  // Click on history item to copy link
  modal.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const linkElement = item.querySelector('.history-link');
      const link = linkElement.textContent;
      navigator.clipboard.writeText(link).then(() => {
        showNotification('Link copied!', 'success');
      });
    });
  });
}

// Color theme button
const themes = [
  { name: 'White', color: '#fff' },
  { name: 'Blue', color: '#e8f4f8' },
  { name: 'Yellow', color: '#fef5e7' },
  { name: 'Gray', color: '#f0f0f0' },
  { name: 'Green', color: '#e8f5e9' }
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
    historyModal.querySelector('.history-modal-content').style.backgroundColor = color;
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

// Check if JSZip is loaded
window.addEventListener('load', () => {
  if (typeof JSZip === 'undefined') {
    console.error('JSZip library not loaded!');
    showNotification('Error: Required library not loaded. Please refresh.', 'info');
  } else {
    console.log('ZTR Extension Loaded - Ready for uploads');
  }
});