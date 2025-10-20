// ===========================
// Utility Functions
// ===========================

const createElement = (tag, className = '', attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
};

const getStorageData = async (key) => {
  const data = await chrome.storage.local.get(key);
  if (key === 'settings') {
    return data[key] || { darkMode: false, autoOpenPopup: false };
  }
  return data[key] || [];
};

const setStorageData = (key, value) => chrome.storage.local.set({ [key]: value });

const normalizeUrl = (url) => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  return trimmed;
};

const showNotification = (message, type = 'success') => {
  // Create or get notification container
  let container = document.getElementById('notification-container');
  if (!container) {
    container = createElement('div', '', { id: 'notification-container' });
    document.body.appendChild(container);
  }
  
  const notification = createElement('div', `notification ${type}`, {
    textContent: message
  });
  
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
      // Remove container if empty
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
};

const applyTheme = (isDark) => {
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
};

const filterGroups = (groups, searchTerm) => {
  if (!searchTerm) return groups;
  const term = searchTerm.toLowerCase();
  return groups.filter(group => 
    group.name.toLowerCase().includes(term) ||
    group.urls.some(url => url.toLowerCase().includes(term))
  );
};

const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, dark for light colors
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
};

// ===========================
// UI Component Creators
// ===========================

const createEmptyState = () => {
  return createElement('div', 'empty-state', {
    innerHTML: '📂<br>No groups yet.<br><small>Create your first group!</small>'
  });
};

const createDeleteButton = (onDelete) => {
  const delBtn = createElement('button', 'delete-btn', {
    innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>`,
    title: 'Delete group'
  });
  
  delBtn.addEventListener('click', onDelete);
  return delBtn;
};

const createGroupItem = (group, index, groups) => {
  const div = createElement('div', 'group-item');
  div.setAttribute('draggable', 'true');
  div.setAttribute('data-index', index);
  
  if (group.pinned) {
    div.classList.add('pinned');
  }
  
  if (group.color) {
    div.style.setProperty('--group-color', group.color);
    div.style.setProperty('--group-text-color', getContrastColor(group.color));
    div.classList.add('has-custom-color');
  }
  
  // Pin button
  const pinBtn = createElement('button', `pin-btn ${group.pinned ? 'pinned' : ''}`, {
    textContent: group.pinned ? '📌' : '📍',
    title: group.pinned ? 'Unpin group' : 'Pin group'
  });
  pinBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const wasPinned = group.pinned;
    group.pinned = !group.pinned;
    await setStorageData('groups', groups);
    
    // Add same animation as clicked state
    if (group.pinned) {
      div.classList.add('clicked');
      setTimeout(() => {
        div.classList.remove('clicked');
        loadGroups(currentSearchTerm, true);
      }, 400);
    } else {
      loadGroups(currentSearchTerm, true);
    }
  });
    // Edit/Settings button (replaces color picker button)
  const editBtn = createElement('button', 'edit-btn', {
    innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`,
    title: 'Edit group settings'
  });
  
  editBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    showGroupSettingsDialog(group, groups, index);
  });
  
  const name = createElement('span', 'group-name', {
    textContent: group.name
  });
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    // Use custom confirmation dialog
    showConfirmDialog(`Delete group "${group.name}"?`, async () => {
      // Add exit animation
      const groupItem = e.target.closest('.group-item');
      groupItem.style.transform = 'translateX(-100%)';
      groupItem.style.opacity = '0';
      
      setTimeout(async () => {
        groups.splice(index, 1);
        await setStorageData('groups', groups);
        showNotification('Group deleted successfully!', 'success');
        loadGroups(currentSearchTerm, true);
      }, 300);
    });
  };
  
  const delBtn = createDeleteButton(handleDelete);
  
  // Drag handle
  const dragHandle = createElement('span', 'drag-handle', {
    textContent: '⋮⋮',
    title: 'Drag to reorder'
  });
    div.appendChild(dragHandle);
  div.appendChild(pinBtn);
  div.appendChild(name);
  div.appendChild(editBtn);
  div.appendChild(delBtn);
  
  div.addEventListener('click', (e) => {
    if (!e.target.closest('button') && !e.target.classList.contains('drag-handle')) {
      // Add click animation
      div.classList.add('clicked');
      setTimeout(() => div.classList.remove('clicked'), 400);
      
      group.urls.forEach((url) => chrome.tabs.create({ url, active: false }));
    }
  });
  
  // Drag and drop handlers
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragover', handleDragOver);
  div.addEventListener('drop', handleDrop);
  div.addEventListener('dragend', handleDragEnd);
  
  return div;
};

const createNameInputDialog = (onSave) => {
  const wrapper = createElement('div', 'dialog-overlay');
  wrapper.classList.add('fade-in');
  
  const dialog = createElement('div', 'dialog-content');
  
  const title = createElement('div', 'dialog-title', {
    innerHTML: '<b>📝 Create New Group</b>'
  });
  
  const input = createElement('input', 'name-input', {
    type: 'text',
    placeholder: 'Enter group name...'
  });
  
  const buttonContainer = createElement('div', 'dialog-buttons');
  
  const nextBtn = createElement('button', 'btn-primary', {
    textContent: 'Next'
  });
  
  const cancelBtn = createElement('button', 'btn-secondary', {
    textContent: 'Cancel'
  });
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(nextBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(input);
  dialog.appendChild(buttonContainer);
  wrapper.appendChild(dialog);
  
  const closeDialog = () => {
    wrapper.classList.add('fade-out');
    setTimeout(() => wrapper.remove(), 200);
  };
  
  cancelBtn.addEventListener('click', closeDialog);
  
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeDialog();
  });
  
  const handleSubmit = () => {
    const name = input.value.trim();
    if (!name) {
      showNotification('Please enter a group name!', 'warning');
      return;
    }
    onSave(name);
    closeDialog();
  };
  
  nextBtn.addEventListener('click', handleSubmit);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });
  
  // Auto-focus input
  setTimeout(() => input.focus(), 0);
  
  return wrapper;
};

const createAddGroupDialog = (name, onSave) => {
  const wrapper = createElement('div', 'dialog-overlay');
  wrapper.classList.add('fade-in');
  
  const dialog = createElement('div', 'dialog-content');
  
  const title = createElement('div', 'dialog-title', {
    innerHTML: `<b>📝 Add URLs for "${name}"</b>`
  });
    const textarea = createElement('textarea', 'url-textarea', {
    placeholder: 'One URL per line...\nExample:\ngoogle.com\nhttps://github.com\nyoutube.com'
  });
  
  const buttonContainer = createElement('div', 'dialog-buttons');
  
  const saveBtn = createElement('button', 'btn-primary', {
    textContent: 'Save Group'
  });
  
  const cancelBtn = createElement('button', 'btn-secondary', {
    textContent: 'Cancel'
  });
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(saveBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(textarea);
  dialog.appendChild(buttonContainer);
  wrapper.appendChild(dialog);
  
  const closeDialog = () => {
    wrapper.classList.add('fade-out');
    setTimeout(() => wrapper.remove(), 200);
  };
  
  cancelBtn.addEventListener('click', closeDialog);
  
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeDialog();
  });
  
  saveBtn.addEventListener('click', async () => {
    const urls = textarea.value
      .split('\n')
      .map(normalizeUrl)
      .filter(Boolean);

    if (urls.length === 0) {
      showNotification('No URLs entered!', 'warning');
      return;
    }

    await onSave(urls);
    closeDialog();
  });
  
  // Auto-focus textarea
  setTimeout(() => textarea.focus(), 0);
  
  return wrapper;
};

const showConfirmDialog = (message, onConfirm) => {
  const wrapper = createElement('div', 'dialog-overlay');
  wrapper.classList.add('fade-in');
  
  const dialog = createElement('div', 'dialog-content confirm-dialog');
  
  const title = createElement('div', 'dialog-title', {
    innerHTML: '<b>⚠️ Confirm Action</b>'
  });
  
  const messageDiv = createElement('div', 'confirm-message', {
    textContent: message
  });
  
  const buttonContainer = createElement('div', 'dialog-buttons');
  
  const confirmBtn = createElement('button', 'btn-danger', {
    textContent: 'Delete'
  });
  
  const cancelBtn = createElement('button', 'btn-secondary', {
    textContent: 'Cancel'
  });
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(messageDiv);
  dialog.appendChild(buttonContainer);
  wrapper.appendChild(dialog);
  
  const closeDialog = () => {
    wrapper.classList.add('fade-out');
    setTimeout(() => wrapper.remove(), 200);
  };
  
  cancelBtn.addEventListener('click', closeDialog);
  
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeDialog();
  });
  
  confirmBtn.addEventListener('click', () => {
    onConfirm();
    closeDialog();
  });
  
  document.body.appendChild(wrapper);
};

const showGroupSettingsDialog = (group, groups, groupIndex) => {
  const wrapper = createElement('div', 'dialog-overlay');
  wrapper.classList.add('fade-in');
  
  const dialog = createElement('div', 'dialog-content group-settings-dialog');
    // Header with group name
  const header = createElement('div', 'dialog-header group-settings-header');
  const headerTop = createElement('div', 'header-top', {
    innerHTML: `<div class="header-icon">⚙️</div>
                <div class="header-text">
                  <div class="header-title">Edit Group</div>
                  <div class="header-subtitle">${group.name}</div>
                </div>`
  });
  header.appendChild(headerTop);
    // Color picker section at the top
  const colorSection = createElement('div', 'settings-section color-section');
  const colorLabel = createElement('div', 'section-label', {
    innerHTML: '<span class="label-icon">🎨</span><span class="label-text">Color Theme</span>'
  });
  const colorHint = createElement('div', 'section-hint', {
    textContent: 'Click to select a color, click again to remove'
  });
    const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
    '#a855f7', '#f43f5e', '#14b8a6', '#eab308'
  ];
  
  const colorGrid = createElement('div', 'color-grid compact');
  
  // Track pending changes
  let pendingColor = group.color;
  let pendingUrls = [...group.urls];
  let hasChanges = false;
  
  colors.forEach(color => {
    const colorOption = createElement('div', 'color-option');
    colorOption.style.background = color;
    
    if (group.color === color) {
      colorOption.classList.add('selected');
    }
    
    colorOption.addEventListener('click', () => {
      const wasSelected = colorOption.classList.contains('selected');
      
      colorGrid.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      
      if (wasSelected && pendingColor === color) {
        pendingColor = undefined;
        hasChanges = true;
      } else {
        colorOption.classList.add('selected');
        pendingColor = color;
        hasChanges = true;
      }
      
      updateSaveButton();
    });
    
    colorGrid.appendChild(colorOption);
  });
    colorSection.appendChild(colorLabel);
  colorSection.appendChild(colorHint);
  colorSection.appendChild(colorGrid);
    // URLs section
  const urlsSection = createElement('div', 'settings-section urls-section');
  const urlsHeader = createElement('div', 'urls-header');
  const urlsLabel = createElement('div', 'section-label', {
    innerHTML: '<span class="label-icon">🔗</span><span class="label-text">URLs <span class="url-count">(' + group.urls.length + ')</span></span>'
  });
  urlsHeader.appendChild(urlsLabel);
  
  const urlsList = createElement('div', 'urls-list');
    const renderUrls = () => {
    urlsList.innerHTML = '';
    pendingUrls.forEach((url, index) => {
      const urlItem = createElement('div', 'url-item');
      
      const urlInput = createElement('input', 'url-input', {
        type: 'text',
        value: url,
        placeholder: 'https://example.com'
      });
      
      urlInput.addEventListener('input', (e) => {
        pendingUrls[index] = e.target.value;
        hasChanges = true;
        updateSaveButton();
      });
      
      const removeBtn = createElement('button', 'url-remove-btn', {
        innerHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`,
        title: 'Remove URL'
      });
      
      removeBtn.addEventListener('click', () => {
        pendingUrls.splice(index, 1);
        hasChanges = true;
        updateSaveButton();
        renderUrls();
        updateUrlCount();
      });
      
      urlItem.appendChild(urlInput);
      urlItem.appendChild(removeBtn);
      urlsList.appendChild(urlItem);
    });
      // Add scrollable class when there are 4 or more URLs
    if (pendingUrls.length >= 4) {
      urlsList.classList.add('scrollable');
      urlsSection.classList.add('has-scroll');
      updateScrollIndicator();
    } else {
      urlsList.classList.remove('scrollable');
      urlsSection.classList.remove('has-scroll');
      urlsSection.classList.remove('not-at-bottom');
    }
  };
  
  // Update scroll fade indicator
  const updateScrollIndicator = () => {
    if (!urlsList.classList.contains('scrollable')) return;
    
    const isAtBottom = urlsList.scrollHeight - urlsList.scrollTop <= urlsList.clientHeight + 5;
    
    if (isAtBottom) {
      urlsSection.classList.remove('not-at-bottom');
    } else {
      urlsSection.classList.add('not-at-bottom');
    }
  };
  
  // Listen for scroll events to update fade indicator
  urlsList.addEventListener('scroll', updateScrollIndicator);
    const updateUrlCount = () => {
    const countSpan = urlsHeader.querySelector('.url-count');
    countSpan.textContent = '(' + pendingUrls.length + ')';
  };
  
  renderUrls();
  
  const addUrlBtn = createElement('button', 'btn-add-url', {
    innerHTML: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add URL'
  });
  
  addUrlBtn.addEventListener('click', () => {
    pendingUrls.push('');
    hasChanges = true;
    updateSaveButton();
    renderUrls();
    updateUrlCount();
    // Focus the new input
    setTimeout(() => {
      const inputs = urlsList.querySelectorAll('.url-input');
      inputs[inputs.length - 1].focus();
    }, 0);
  });
    urlsSection.appendChild(urlsHeader);
  urlsSection.appendChild(urlsList);
  urlsSection.appendChild(addUrlBtn);
  
  // Buttons
  const buttonContainer = createElement('div', 'dialog-buttons');
  
  const cancelBtn = createElement('button', 'btn-cancel', {
    textContent: 'Cancel'
  });
  
  const saveBtn = createElement('button', 'btn-save', {
    textContent: '💾 Save'
  });
  saveBtn.classList.add('btn-save-disabled');
  saveBtn.disabled = true;
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(saveBtn);
  
  const updateSaveButton = () => {
    if (hasChanges) {
      saveBtn.classList.remove('btn-save-disabled');
      saveBtn.classList.add('btn-save-enabled');
      saveBtn.disabled = false;
    }
  };
  
  saveBtn.addEventListener('click', async () => {
    if (!hasChanges) return;
    
    saveBtn.classList.remove('btn-save-enabled');
    saveBtn.classList.add('btn-save-saving');
    
    // Filter out empty URLs and normalize
    pendingUrls = pendingUrls
      .filter(url => url.trim() !== '')
      .map(url => normalizeUrl(url));
    
    // Apply changes
    if (pendingColor) {
      group.color = pendingColor;
    } else {
      delete group.color;
    }
    group.urls = pendingUrls;
    
    await setStorageData('groups', groups);
    
    showNotification('Group settings saved!', 'success');
    
    setTimeout(() => {
      closeDialog();
      loadGroups(currentSearchTerm, true);
    }, 200);
  });
  
  dialog.appendChild(header);
  dialog.appendChild(colorSection);
  dialog.appendChild(urlsSection);
  dialog.appendChild(buttonContainer);
  wrapper.appendChild(dialog);
  
  const closeDialog = () => {
    wrapper.classList.add('fade-out');
    setTimeout(() => wrapper.remove(), 200);
  };
  
  cancelBtn.addEventListener('click', closeDialog);
  
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeDialog();
  });
  
  document.body.appendChild(wrapper);
};

const createSettingsDialog = async () => {
  const wrapper = createElement('div', 'dialog-overlay');
  wrapper.classList.add('fade-in');
  
  const dialog = createElement('div', 'dialog-content');
  
  const title = createElement('div', 'dialog-title', {
    innerHTML: '<b>⚙️ Settings</b>'
  });
  
  const settingsContent = createElement('div', 'settings-content');
  
  // Load current settings
  const settings = await getStorageData('settings');
  const initialAutoOpen = settings.autoOpenPopup || false;
  const initialDarkMode = settings.darkMode || false;
  
  // Dark mode setting
  const darkModeItem = createElement('div', 'setting-item');
  
  const darkModeLabel = createElement('div', 'setting-label');
  const darkModeTitle = createElement('div', 'setting-title', {
    textContent: 'Dark Mode'
  });
  const darkModeDescription = createElement('div', 'setting-description', {
    textContent: 'Enable dark theme for the extension'
  });
  
  darkModeLabel.appendChild(darkModeTitle);
  darkModeLabel.appendChild(darkModeDescription);
  
  const darkModeToggle = createElement('label', 'toggle-switch');
  const darkModeCheckbox = createElement('input', '', {
    type: 'checkbox',
    id: 'darkModeToggle'
  });
  darkModeCheckbox.checked = initialDarkMode;
  
  const darkModeSlider = createElement('span', 'toggle-slider');
  
  darkModeToggle.appendChild(darkModeCheckbox);
  darkModeToggle.appendChild(darkModeSlider);
  
  darkModeItem.appendChild(darkModeLabel);
  darkModeItem.appendChild(darkModeToggle);
  settingsContent.appendChild(darkModeItem);
  
  // Auto-open popup setting
  const settingItem = createElement('div', 'setting-item');
  
  const settingLabel = createElement('div', 'setting-label');
  const settingTitle = createElement('div', 'setting-title', {
    textContent: 'Auto Open Popup'
  });
  const settingDescription = createElement('div', 'setting-description', {
    textContent: 'Automatically open this popup when creating a new tab'
  });
  
  settingLabel.appendChild(settingTitle);
  settingLabel.appendChild(settingDescription);
  
  const toggleSwitch = createElement('label', 'toggle-switch');
  const checkbox = createElement('input', '', {
    type: 'checkbox',
    id: 'autoOpenToggle'
  });
  checkbox.checked = initialAutoOpen;
  
  const slider = createElement('span', 'toggle-slider');
  
  toggleSwitch.appendChild(checkbox);
  toggleSwitch.appendChild(slider);
  
  settingItem.appendChild(settingLabel);
  settingItem.appendChild(toggleSwitch);
  settingsContent.appendChild(settingItem);
  
  const buttonContainer = createElement('div', 'dialog-buttons');
  
  const closeBtn = createElement('button', 'btn-primary', {
    textContent: 'Close'
  });
  
  buttonContainer.appendChild(closeBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(settingsContent);
  dialog.appendChild(buttonContainer);
  wrapper.appendChild(dialog);
  
  // Live dark mode toggle
  darkModeCheckbox.addEventListener('change', () => {
    applyTheme(darkModeCheckbox.checked);
  });
  
  const closeDialog = async () => {
    // Save settings
    const newAutoOpen = checkbox.checked;
    const newDarkMode = darkModeCheckbox.checked;
    
    if (newAutoOpen !== initialAutoOpen || newDarkMode !== initialDarkMode) {
      const newSettings = {
        autoOpenPopup: newAutoOpen,
        darkMode: newDarkMode
      };
      await setStorageData('settings', newSettings);
      showNotification('Settings saved! ⚙️', 'success');
    }
    
    wrapper.classList.add('fade-out');
    setTimeout(() => wrapper.remove(), 200);
  };
  
  closeBtn.addEventListener('click', closeDialog);
  
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeDialog();
  });
  
  return wrapper;
};

// ===========================
// Drag and Drop Handlers
// ===========================

let draggedElement = null;
let draggedIndex = null;
let placeholder = null;

const handleDragStart = (e) => {
  draggedElement = e.target;
  draggedIndex = parseInt(e.target.getAttribute('data-index'));
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  
  // Create placeholder
  placeholder = draggedElement.cloneNode(true);
  placeholder.style.opacity = '0.3';
  placeholder.style.pointerEvents = 'none';
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const targetElement = e.target.closest('.group-item');
  if (targetElement && targetElement !== draggedElement && !targetElement.classList.contains('dragging')) {
    const container = document.getElementById('groups');
    const allItems = [...container.querySelectorAll('.group-item:not(.dragging)')];
    const targetIndex = allItems.indexOf(targetElement);
    const rect = targetElement.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    // Smooth reordering with physics
    if (e.clientY < midpoint) {
      targetElement.parentNode.insertBefore(draggedElement, targetElement);
    } else {
      targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
    }
    
    // Add subtle animation to other items
    allItems.forEach(item => {
      if (item !== draggedElement) {
        item.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
    });
  }
};

const handleDrop = async (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDragEnd = async (e) => {
  e.target.classList.remove('dragging');
  
  // Get new order
  const container = document.getElementById('groups');
  const allItems = [...container.querySelectorAll('.group-item')];
  const groups = await getStorageData('groups');
  
  const newOrder = allItems.map(item => {
    const index = parseInt(item.getAttribute('data-index'));
    return groups[index];
  });
  
  await setStorageData('groups', newOrder);
  
  // Reload without animation
  loadGroups(currentSearchTerm, true);
};

// ===========================
// Main Functions
// ===========================

let currentSearchTerm = '';

async function loadGroups(searchTerm = '', skipAnimation = false) {
  currentSearchTerm = searchTerm;
  const allGroups = await getStorageData('groups');
  const container = document.getElementById('groups');
  container.innerHTML = '';

  if (allGroups.length === 0) {
    container.appendChild(createEmptyState());
    return;
  }

  // Sort: pinned first, then by order
  const sortedGroups = [...allGroups].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  // Filter groups
  const groups = filterGroups(sortedGroups, searchTerm);
  
  if (groups.length === 0) {
    const emptySearch = createElement('div', 'empty-state', {
      innerHTML: '🔍<br>No groups found.<br><small>Try a different search term</small>'
    });
    container.appendChild(emptySearch);
    return;
  }

  // Add stagger animation (skip if reordering)
  groups.forEach((group, displayIndex) => {
    const originalIndex = allGroups.indexOf(group);
    const item = createGroupItem(group, originalIndex, allGroups);
    
    if (skipAnimation) {
      // No animation for reordering
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    } else {
      // Stagger animation for initial load
      item.style.opacity = '0';
      item.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        item.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, displayIndex * 50);
    }
    
    container.appendChild(item);
  });
}

async function handleAddGroup() {
  const onNameSave = (name) => {
    const onUrlsSave = async (urls) => {
      const groups = await getStorageData('groups');
      groups.push({ name: name, urls, pinned: false });
      await setStorageData('groups', groups);
      showNotification('Group created successfully! ✨', 'success');
      loadGroups();
    };
    
    const urlDialog = createAddGroupDialog(name, onUrlsSave);
    document.body.appendChild(urlDialog);
  };
  
  const nameDialog = createNameInputDialog(onNameSave);
  document.body.appendChild(nameDialog);
}

const exportGroups = async () => {
  const groups = await getStorageData('groups');
  
  if (groups.length === 0) {
    showNotification('No groups to export!', 'warning');
    return;
  }
  
  const dataStr = JSON.stringify(groups, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = createElement('a', '', {
    href: url,
    download: `group-tabs-backup-${new Date().toISOString().split('T')[0]}.json`
  });
  link.click();
  URL.revokeObjectURL(url);
  showNotification('Groups exported successfully! 📤', 'success');
};

const importGroups = () => {
  const input = createElement('input', '', {
    type: 'file',
    accept: 'application/json'
  });
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedGroups = JSON.parse(text);
      
      if (!Array.isArray(importedGroups)) {
        showNotification('Invalid file format!', 'error');
        return;
      }
      
      const currentGroups = await getStorageData('groups');
      const mergedGroups = [...currentGroups, ...importedGroups];
      await setStorageData('groups', mergedGroups);
      loadGroups();
      showNotification(`Imported ${importedGroups.length} groups successfully! 📥`, 'success');
    } catch (error) {
      showNotification('Failed to import file: ' + error.message, 'error');
    }
  };
  
  input.click();
};

// ===========================
// Event Listeners & Init
// ===========================

// Add ripple effect to buttons
const addRippleEffect = (button) => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    this.appendChild(ripple);
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    setTimeout(() => ripple.remove(), 600);
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  // Load and apply theme
  const settings = await getStorageData('settings');
  applyTheme(settings.darkMode);
  
  // Add event listeners
  document.getElementById('addGroup').addEventListener('click', handleAddGroup);
  document.getElementById('exportGroups').addEventListener('click', exportGroups);
  document.getElementById('importGroups').addEventListener('click', importGroups);
  document.getElementById('settingsBtn').addEventListener('click', async () => {
    const dialog = await createSettingsDialog();
    document.body.appendChild(dialog);
  });
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadGroups(e.target.value);
    }, 300);
  });
  
  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', async () => {
    const currentSettings = await getStorageData('settings');
    const newDarkMode = !currentSettings.darkMode;
    currentSettings.darkMode = newDarkMode;
    await setStorageData('settings', currentSettings);
    applyTheme(newDarkMode);
    showNotification(newDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'success');
  });
  
  // Add ripple effect to all buttons
  document.querySelectorAll('button').forEach(addRippleEffect);
  
  // Load groups with fade-in
  setTimeout(() => loadGroups(), 100);
});
