
// Listen for new tab creation
chrome.tabs.onCreated.addListener(async (tab) => {
  // Get the auto-open setting
  const data = await chrome.storage.local.get('settings');
  const settings = data.settings || {};
  
  // Only open popup if:
  // 1. Auto-open is enabled
  // 2. The tab is a new tab (empty URL or chrome://newtab/)
  // 3. The tab is active (user is viewing it)
  if (settings.autoOpenPopup && 
      tab.active && 
      (tab.pendingUrl === 'chrome://newtab/' || 
       tab.url === 'chrome://newtab/' || 
       !tab.url || 
       tab.url === '')) {
    
    // Open the popup by executing action
    try {
      await chrome.action.openPopup();
    } catch (error) {
      // openPopup might fail if not user-initiated in some cases
      console.log('Could not auto-open popup:', error);
    }
  }
});

// Listen for setting changes to provide immediate feedback
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.settings) {
    const newSettings = changes.settings.newValue;
    console.log('Settings updated:', newSettings);
  }
});
