# ✨ Group Tab Opener

A powerful and intuitive Chrome extension for organizing and opening groups of tabs with a beautiful, modern interface. Streamline your browsing workflow by creating custom URL collections that can be opened instantly with a single click.

## ⚠️ Important Note

**This entire project was created using AI (Vibe code) for coding, design, and development.** The extension demonstrates the capabilities of AI-assisted development in creating fully functional browser extensions with modern UI/UX patterns.

## 🚀 Features

### Core Functionality
- **📂 Group Management** - Create, edit, and delete custom URL groups
- **🎯 One-Click Opening** - Open all tabs in a group simultaneously
- **📌 Pin Groups** - Keep frequently used groups at the top
- **🔍 Smart Search** - Quickly find groups by name or URL content
- **🎨 Custom Colors** - Personalize groups with custom color themes
- **↕️ Drag & Drop** - Reorder groups with intuitive drag-and-drop

### User Experience
- **🌙 Dark/Light Mode** - Toggle between elegant themes
- **📱 Responsive Design** - Clean, modern interface optimized for the popup
- **⚡ Smooth Animations** - Polished transitions and micro-interactions
- **🔔 Smart Notifications** - Contextual feedback for all actions
- **🎭 Ripple Effects** - Material Design-inspired button interactions

### Data Management
- **📤 Export/Import** - Backup and restore your groups as JSON files
- **💾 Local Storage** - All data stored securely in Chrome's local storage
- **🔄 Auto-Open Option** - Optionally open the popup on new tabs
- **⚙️ Settings Panel** - Centralized configuration management

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Browser APIs**: Chrome Extension Manifest V3
- **Storage**: Chrome Storage API (Local)
- **Permissions**: `storage`, `tabs`
- **Architecture**: Service Worker background script
- **Styling**: CSS Custom Properties, CSS Grid/Flexbox, CSS Animations

## 📁 Project Structure

```
Group_Tab_Opener/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html             # Main popup interface
├── popup.js               # Core application logic (1000+ lines)
├── popup.css              # Modern UI styling with dark mode
├── background.js          # Service worker for tab management
├── sample-groups.json     # Example data for testing
└── icons/
    ├── icon16.png         # 16x16 extension icon
    ├── icon48.png         # 48x48 extension icon
    └── icon128.png        # 128x128 extension icon
```

### Key Files Breakdown

- **`popup.js`** - Main application logic including UI components, drag-and-drop, data management, and event handling
- **`popup.css`** - Modern CSS with custom properties, animations, and comprehensive dark mode support
- **`background.js`** - Service worker handling auto-popup functionality and storage event monitoring
- **`manifest.json`** - Extension configuration following Manifest V3 standards

## 🚀 Installation Guide

### Method 1: Manual Installation (Recommended for Development)

1. **Download the Project**
   ```bash
   git clone <repository-url>
   cd Group_Tab_Opener
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `Group_Tab_Opener` folder
   - The extension will appear in your toolbar

4. **Verify Installation**
   - Look for the Group Tab Opener icon in your browser toolbar
   - Click it to open the popup interface

### Method 2: Chrome Web Store (Future)
*Note: This extension is not yet published to the Chrome Web Store*

## 📖 Usage

### Creating Your First Group

1. **Click the Extension Icon** in your browser toolbar
2. **Click "Add Group"** button
3. **Enter a Group Name** (e.g., "Development Tools")
4. **Add URLs** one per line:
   ```
   https://github.com
   https://stackoverflow.com
   https://developer.mozilla.org
   ```
5. **Click "Save"** to create the group

### Managing Groups

- **📂 Open Group**: Click any group to open all URLs as new tabs
- **📌 Pin/Unpin**: Click the pin icon to keep groups at the top
- **🎨 Customize**: Click the edit icon to change colors and settings
- **🔍 Search**: Use the search bar to filter groups
- **↕️ Reorder**: Drag groups by the handle (⋮⋮) to rearrange
- **🗑️ Delete**: Click the trash icon to remove a group

### Advanced Features

- **🌙 Toggle Theme**: Click the theme button in the header
- **📤 Export Data**: Use "Export" to backup your groups
- **📥 Import Data**: Use "Import" to restore from backup
- **⚙️ Settings**: Access additional configuration options

## ⚙️ Configuration

### Settings Panel Options

Access via the gear (⚙️) icon in the header:

- **🌙 Dark Mode**: Toggle between light and dark themes
- **🚀 Auto-Open Popup**: Automatically open on new tabs
- **🎨 Default Colors**: Set preferred color schemes
- **📋 Import/Export**: Manage data backup and restore

### Storage Format

Groups are stored in Chrome's local storage as JSON:

```json
[
  {
    "name": "Development Tools",
    "urls": [
      "https://github.com",
      "https://stackoverflow.com"
    ],
    "pinned": false,
    "color": "#6366f1"
  }
]
```

## 🔌 API Reference

### Chrome Extension APIs Used

#### Tabs API
```javascript
// Create new tab
chrome.tabs.create({ url: "https://example.com", active: false });
```

#### Storage API
```javascript
// Save data
chrome.storage.local.set({ groups: groupsArray });

// Retrieve data
const data = await chrome.storage.local.get('groups');
```

#### Action API
```javascript
// Auto-open popup (background script)
chrome.action.openPopup();
```

### Core Functions

- **`loadGroups(searchTerm, skipAnimation)`** - Load and display groups
- **`handleAddGroup()`** - Create new group workflow
- **`exportGroups()`** - Export groups to JSON file
- **`importGroups()`** - Import groups from JSON file
- **`applyTheme(isDark)`** - Toggle between light/dark themes

## 🤝 Contributing Guide

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the Repository**
2. **Clone Your Fork**
   ```bash
   git clone https://github.com/yourusername/Group_Tab_Opener.git
   cd Group_Tab_Opener
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**
   - Follow the existing code style
   - Test thoroughly in Chrome
   - Ensure cross-theme compatibility

5. **Submit a Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Reference any related issues

### Code Style Guidelines

- Use **ES6+ JavaScript** features
- Follow **semantic HTML** structure
- Maintain **CSS custom properties** for theming
- Write **descriptive function names**
- Add **comments for complex logic**

### Testing Checklist

- [ ] Extension loads without errors
- [ ] All buttons and interactions work
- [ ] Dark/light mode toggles correctly
- [ ] Drag and drop functions properly
- [ ] Export/import preserves data integrity
- [ ] Search filters groups accurately

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using AI-assisted development** | **Star ⭐ this repo if you find it useful!**
