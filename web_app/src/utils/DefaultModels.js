// This file manages default model selections for different tasks

const STORAGE_KEY = 'default-models';

/**
 * Get the default model for a specific task
 * @param {string} task - The task type (e.g., 'summarization', 'question-answering', 'translation')
 * @returns {string} The model name, or empty string if no default is set
 */
export function getDefaultModel(task) {
  try {
    const defaults = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return defaults[task] || '';
  } catch (error) {
    console.error('Error reading default models:', error);
    return '';
  }
}

/**
 * Set the default model for a specific task
 * @param {string} task - The task type (e.g., 'summarization', 'question-answering', 'translation')
 * @param {string} modelName - The model name to set as default
 */
export function setDefaultModel(task, modelName) {
  try {
    const defaults = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    defaults[task] = modelName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.error('Error saving default model:', error);
  }
}

/**
 * Get all default models
 * @returns {Object} Object with task names as keys and model names as values
 */
export function getAllDefaultModels() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.error('Error reading default models:', error);
    return {};
  }
}

/**
 * Clear all default model settings
 */
export function clearDefaultModels() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing default models:', error);
  }
}