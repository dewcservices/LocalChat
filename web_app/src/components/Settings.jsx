import { createSignal } from "solid-js";
import { A } from "@solidjs/router";
import styles from './Settings.module.css';

function Settings() {
  const [activeSection, setActiveSection] = createSignal('default-models');

  const sections = [
    { id: 'default-models', label: 'Default Models' },
    { id: 'sub-heading-2', label: 'Sub Heading 2' },
    { id: 'colour-settings', label: 'Colour Settings' },
    { id: 'data-management', label: 'Data Management' },
  ];

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

          {/* Sub Heading 2 Section */}
          {activeSection() === 'sub-heading-2' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Sub Heading 2</h2>
              <div class={styles.sectionContent}>
                <p class={styles.placeholder}>Sub heading 2 settings will go here...</p>
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