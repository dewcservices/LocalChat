import { createSignal } from "solid-js";
import { A } from "@solidjs/router";
import styles from './Settings.module.css';
import { exportAllChats, importAllChats, getChatHistories } from '../utils/ChatHistory';

function Settings() {
  const [activeSection, setActiveSection] = createSignal('default-models');
  const [chatCount, setChatCount] = createSignal(getChatHistories().length);

  const sections = [
    { id: 'default-models', label: 'Default Models' },
    { id: 'chat-management', label: 'Chat Management' },
    { id: 'colour-settings', label: 'Colour Settings' },
    { id: 'data-management', label: 'Data Management' },
  ];

  // Export all chats
  const handleExportChats = () => {
    try {
      exportAllChats();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details.');
    }
  };

  // Import chats
  const handleImportChats = () => {
    importAllChats(true, () => {
      // Refresh chat count after import
      setChatCount(getChatHistories().length);
      alert('Import complete! You may need to navigate back to the chat to see your imported conversations.');
    });
  };

  // Function to clear all data
  const handleClearAllData = () => {
    if (!confirm('Are you sure you want to clear ALL data? This will delete all chats, preferences, and cached models. This action CANNOT be undone.')) {
      return;
    }

    // Double confirmation for safety
    if (!confirm('This is your final warning. All data will be permanently deleted. Continue?')) {
      return;
    }

    try {
      // Clear localStorage (contains chat histories, preferences, etc.)
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB (if used for model caching)
      if (window.indexedDB) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
          });
        });
      }
      
      // Clear any service worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      alert('All data has been cleared successfully. The page will now reload.');
      
      // Reload the page to reset the application state
      window.location.reload();
      
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('There was an error clearing some data. Please check the console and try again.');
    }
  };

  return (
    <div class={styles.settingsContainer}>
      {/* Back button */}
      <div class={styles.headerBar}>
        <A href="/" class={styles.backButton}>
          ← Back to Chat
        </A>
      </div>

      <h1 class={styles.settingsTitle}>Settings</h1>
      
      <div class={styles.settingsContent}>
        {/* Left Sidebar Navigation */}
        <div class={styles.settingsSidebar}>
          {sections.map(section => (
            <button 
              class={`${styles.sidebarItem} ${activeSection() === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div class={styles.settingsMain}>
          {/* Default Models Section */}
          {activeSection() === 'default-models' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Default Models</h2>
              <div class={styles.sectionContent}>
                <p class={styles.placeholder}>Default model settings will go here...</p>
              </div>
            </div>
          )}

          {/* Chat Management Section */}
          {activeSection() === 'chat-management' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Chat Management</h2>
              <div class={styles.sectionContent}>
                <p class={styles.descriptionText}>
                  Export your chat histories to back them up, or import previously exported chats.
                </p>
                
                <div class={styles.chatStats}>
                  <div class={styles.statItem}>
                    <span class={styles.statLabel}>Total Chats:</span>
                    <span class={styles.statValue}>{chatCount()}</span>
                  </div>
                </div>

                <div class={styles.managementActions}>
                  <div class={styles.actionCard}>
                    <h3 class={styles.actionTitle}>Export Chats</h3>
                    <p class={styles.actionDescription}>
                      Download all your chat histories as a JSON file. This creates a backup that you can import later.
                    </p>
                    <button 
                      class={styles.exportButton}
                      onClick={handleExportChats}
                      disabled={chatCount() === 0}
                    >
                      {chatCount() === 0 ? 'No Chats to Export' : 'Export All Chats'}
                    </button>
                  </div>

                  <div class={styles.actionCard}>
                    <h3 class={styles.actionTitle}>Import Chats</h3>
                    <p class={styles.actionDescription}>
                      Import chat histories from a previously exported JSON file. Existing chats will be preserved.
                    </p>
                    <button 
                      class={styles.importButton}
                      onClick={handleImportChats}
                    >
                      Import Chats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colour Settings Section */}
          {activeSection() === 'colour-settings' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Colour Settings</h2>
              <div class={styles.sectionContent}>
                <p class={styles.placeholder}>Colour configuration options will go here...</p>
              </div>
            </div>
          )}

          {/* Data Management Section */}
          {activeSection() === 'data-management' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Data Management</h2>
              <div class={styles.sectionContent}>
                <p class={styles.warningText}>
                  Clearing all data will permanently delete:
                </p>
                <ul class={styles.warningList}>
                  <li>All chat histories and conversations</li>
                  <li>All user preferences and settings</li>
                  <li>All cached models and data</li>
                </ul>
                <p class={styles.warningText}>
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
              
              <div class={styles.dangerZone}>
                <button 
                  class={styles.clearDataButton}
                  onClick={handleClearAllData}
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;