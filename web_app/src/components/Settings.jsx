import { createSignal, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import styles from './Settings.module.css';
import { exportAllChats, importAllChats, getChatHistories } from '../utils/ChatHistory';
import { useTheme } from './ThemeContext';
import { getCachedModelsNames } from '../utils/ModelCache';
import { getDefaultModel, setDefaultModel } from '../utils/DefaultModels';

function Settings() {
  const [activeSection, setActiveSection] = createSignal('default-models');
  const [chatCount, setChatCount] = createSignal(getChatHistories().length);
  const { theme, toggleTheme } = useTheme();

  // Model states for each task type
  const [summarizationModels, setSummarizationModels] = createSignal([]);
  const [questionAnsweringModels, setQuestionAnsweringModels] = createSignal([]);
  const [translationModels, setTranslationModels] = createSignal([]);

  // Default model selections
  const [defaultSummarizationModel, setDefaultSummarizationModel] = createSignal('');
  const [defaultQuestionAnsweringModel, setDefaultQuestionAnsweringModel] = createSignal('');
  const [defaultTranslationModel, setDefaultTranslationModel] = createSignal('');

  // Load available models and default selections on mount
  onMount(async () => {
    // Load available models
    const sumModels = await getCachedModelsNames('summarization');
    const qaModels = await getCachedModelsNames('question-answering');
    const transModels = await getCachedModelsNames('translation');

    setSummarizationModels(sumModels);
    setQuestionAnsweringModels(qaModels);
    setTranslationModels(transModels);

    // Load saved default models
    setDefaultSummarizationModel(getDefaultModel('summarization'));
    setDefaultQuestionAnsweringModel(getDefaultModel('question-answering'));
    setDefaultTranslationModel(getDefaultModel('translation'));
  });

  // Handle model selection changes
  const handleSummarizationChange = (e) => {
    const model = e.currentTarget.value;
    setDefaultSummarizationModel(model);
    setDefaultModel('summarization', model);
  };

  const handleQuestionAnsweringChange = (e) => {
    const model = e.currentTarget.value;
    setDefaultQuestionAnsweringModel(model);
    setDefaultModel('question-answering', model);
  };

  const handleTranslationChange = (e) => {
    const model = e.currentTarget.value;
    setDefaultTranslationModel(model);
    setDefaultModel('translation', model);
  };

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

        <div class={styles.settingsMain}>
          {/* Default Models Section */}
          {activeSection() === 'default-models' && (
            <div class={styles.sectionView}>
              <h2 class={styles.sectionHeading}>Default Models</h2>
              <div class={styles.sectionContent}>
                <p style="color: var(--text-colour); opacity: 0.9; margin: 0 0 16px 0;">
                  Select default models for different tasks. These will be automatically loaded when you use each feature.
                </p>

                {/* Summarise Model Dropdown*/}
                <div class={styles.modelCard}>
                  <div class={styles.modelInfo}>
                    <h3>📝 Summarization</h3>
                    <p>Default model for text summarization</p>
                  </div>
                  <select 
                    class={styles.modelDropdown}
                    value={defaultSummarizationModel()}
                    onChange={handleSummarizationChange}
                  >
                    <option value="">No default model</option>
                    <For each={summarizationModels()}>{(model) => 
                      <option value={model}>{model}</option>
                    }</For>
                  </select>
                  <Show when={summarizationModels().length === 0}>
                    <p class={styles.noModelsText}>
                      No models available. Upload models to use this feature.
                    </p>
                  </Show>
                </div>

                {/* Question Answering Model Dropdown*/}
                <div class={styles.modelCard}>
                  <div class={styles.modelInfo}>
                    <h3>❓ Question Answering</h3>
                    <p>Default model for answering questions</p>
                  </div>
                  <select 
                    class={styles.modelDropdown}
                    value={defaultQuestionAnsweringModel()}
                    onChange={handleQuestionAnsweringChange}
                  >
                    <option value="">No default model</option>
                    <For each={questionAnsweringModels()}>{(model) => 
                      <option value={model}>{model}</option>
                    }</For>
                  </select>
                  <Show when={questionAnsweringModels().length === 0}>
                    <p class={styles.noModelsText}>
                      No models available. Upload models to use this feature.
                    </p>
                  </Show>
                </div>

                {/* Translation Model Dropdown*/}
                <div class={styles.modelCard}>
                  <div class={styles.modelInfo}>
                    <h3>🌐 Translation</h3>
                    <p>Default model for text translation</p>
                  </div>
                  <select 
                    class={styles.modelDropdown}
                    value={defaultTranslationModel()}
                    onChange={handleTranslationChange}
                  >
                    <option value="">No default model</option>
                    <For each={translationModels()}>{(model) => 
                      <option value={model}>{model}</option>
                    }</For>
                  </select>
                  <Show when={translationModels().length === 0}>
                    <p class={styles.noModelsText}>
                      No models available. Upload models to use this feature.
                    </p>
                  </Show>
                </div>
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
                
                {/* Chat Exporting */}
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

                  {/* Chat Importing */}
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
                <p style="color: var(--text-colour); opacity: 0.9; margin: 0;">
                  Switch between light and dark mode themes.
                </p>

                {/* Selection 1 - Light/Dark Mode Toggle */}
                <div class={styles.themeToggleContainer}>
                  <div class={styles.themeInfo}>
                    <h3>Appearance</h3>
                    <p>Currently using <strong>{theme() === 'dark' ? 'Dark' : 'Light'}</strong> mode</p>
                  </div>
                  <button 
                    class={styles.themeToggleButton}
                    onClick={toggleTheme}
                  >
                    <span style="font-size: 1.2rem;">{theme() === 'dark' ? '☀️' : '🌙'}</span>
                    Switch to {theme() === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
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