// DOM Elements
const dropOverlay = document.getElementById('dropOverlay');
const titleInput = document.getElementById('title');
const noteInput = document.getElementById('note');
const closeBtn = document.getElementById('closeBtn');
const historyBtn = document.getElementById('historyBtn');
const colorBtn = document.getElementById('colorBtn');
const uploadSection = document.querySelector('.upload-section');

// Character counter for title
titleInput.addEventListener('input', (e) => {
  const len = e.target.value.length;
  e.target.placeholder = `${len}/50`;
  if (len > 50) {
    e.target.value = e.target.value.slice(0, 50);
  }
});

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
  handleFiles(files);
});

// Click to upload
uploadSection.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.webkitdirectory = false;
  
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });
  
  input.click();
});

// Handle file uploads
function handleFiles(files) {
  if (files.length === 0) return;
  
  console.log('Files to upload:', files);
  
  // Store file information
  const fileData = {
    title: titleInput.value || 'Untitled',
    note: noteInput.value || '',
    files: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    })),
    timestamp: new Date().toISOString()
  };
  
  // Save to storage
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    transfers.unshift(fileData);
    
    chrome.storage.local.set({ transfers }, () => {
      alert(`Successfully uploaded ${files.length} file(s)!`);
      
      // Reset form
      titleInput.value = '';
      noteInput.value = '';
      titleInput.placeholder = '0/50';
    });
  });
}

// Close button
closeBtn.addEventListener('click', () => {
  window.close();
});

// History button
historyBtn.addEventListener('click', () => {
  chrome.storage.local.get(['transfers'], (result) => {
    const transfers = result.transfers || [];
    console.log('Transfer History:', transfers);
    
    if (transfers.length === 0) {
      alert('No transfer history yet!');
    } else {
      alert(`You have ${transfers.length} transfer(s) in history.`);
    }
  });
});

// Color theme button
colorBtn.addEventListener('click', () => {
  const body = document.body;
  const currentBg = getComputedStyle(body).backgroundColor;
  
  if (currentBg === 'rgb(245, 245, 220)') {
    body.style.backgroundColor = '#f0f0f0';
    document.querySelector('.container').style.backgroundColor = '#f0f0f0';
  } else {
    body.style.backgroundColor = '#f5f5dc';
    document.querySelector('.container').style.backgroundColor = '#f5f5dc';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('ZTR Extension Loaded');
});