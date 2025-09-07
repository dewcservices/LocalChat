// This file contains functions to save and load chat histories.

/**
 * Deletes all chat histories from the browser's local storage.
 */
export function deleteChatHistories() {
  for (let key of Object.keys(localStorage)) {
    if (key.startsWith('chat-')) localStorage.removeItem(key);
  }
}

/**
 * Deletes the chat corresponding to the chatId.
 * @param {string} chatId 
 */
export function deleteChatHistory(chatId) {
  localStorage.removeItem(chatId);
}

/**
 * Returns a new chat id following the format "chat-001".
 * The function ensures that the id is not already in use.
 * @return {string} the id.
 */
export function newChatId() {
  let newId;

  for (let i=0; i <= 999; i++) {
    newId = "chat-" + String(i).padStart(3, '0');

    let idNotInUse = !localStorage.getItem(newId);
    if (idNotInUse) break;
  }

  return newId;
}

/**
 * Fetches the chat history from the browser's local storage (only fetches chatIds and corresponding chatType).
 * Use getChatHistory to fetch the messages of a specific chat.
 * @return {Array<any>} [{chatId: "", chatType: "", creationDate: "", latestMessageDate: ""}]
 */
export function getChatHistories() {
  let chatHistory = [];

  for (let item of Object.entries(localStorage)) {
    let key = item[0];
    let value = item[1];

    // Skip non-chat keys early
    if (!key.startsWith('chat-')) continue;

    try {
      let chat = JSON.parse(value);
      
      // Validate that this is actually a chat object
      if (chat && typeof chat === 'object' && chat.chatType) {
        chatHistory.push({
          chatId: key,
          chatName: chat.chatName,
          chatType: chat.chatType,
          creationDate: chat.creationDate,
          latestMessageDate: chat.latestMessageDate
        });
      }
    } catch (error) {
      //console.warn(`Failed to parse chat data for key "${key}":`, error);
      // localStorage.removeItem(key);
    }
  }

  return chatHistory;
}

export function createNewChat(chatId, chatType, creationDate) {
  let chat = {
    chatId: chatId,
    chatName: chatId,
    chatType: chatType,
    creationDate: creationDate,
    latestMessageDate: creationDate,
    messages: [],
    files: []
  };
  localStorage.setItem(chatId, JSON.stringify(chat));
}

export function saveMessages(chatId, latestMessageDate, messages) {
  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) throw new Error(`Could not find chat with Id: ${chatId}`);

  try {
    let chat = JSON.parse(chatJson);
    chat.messages = messages;
    chat.latestMessageDate = latestMessageDate;
    localStorage.setItem(chatId, JSON.stringify(chat));
  } catch (error) {
    throw new Error(`Failed to update messages for chat ${chatId}: ${error.message}`);
  }
}

export function saveFiles(chatId, files) {
  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) throw new Error(`Could not find chat with Id: ${chatId}`);

  try {
    let chat = JSON.parse(chatJson);
    chat.files = files;
    localStorage.setItem(chatId, JSON.stringify(chat));
  } catch (error) {
    throw new Error(`Failed to update files for chat ${chatId}: ${error.message}`);
  }
}

/**
 * Loads a chat from the browser's local storage. If no chat is found with the chatId, the function returns an empty
 * array.
 * @param {string} chatId 
 * @return {Array<any>} [[{sender: "", date: "", modelName: "", content: ""}],[{fileName: "", content: ""}]]
 */
export function getChatHistory(chatId) {
  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) return [];

  try {
    let chat = JSON.parse(chatJson);
    return chat;
  } catch (error) {
    //console.error(`Failed to parse chat history for ${chatId}:`, error);
    return [];
  }
}

/**
 * Renames a chat.
 * @param {string} chatId 
 * @param {string} newName 
 */
export function renameChat(chatId, newName) {
  if (typeof newName !== 'string' || newName == '') throw new Error('Invalid chat name.');

  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) throw new Error(`Could not find chat with id: ${chatId}`);

  try {
    let chat = JSON.parse(chatJson);
    chat.chatName = newName;
    localStorage.setItem(chatId, JSON.stringify(chat));
  } catch (error) {
    throw new Error(`Failed to rename chat ${chatId}: ${error.message}`);
  }
}

/**
 * Generates a title based on chat messages using the first user message
 * @param {Array} messages - Array of chat messages
 * @return {string} - Generated title
 */
export function generateChatTitle(messages) {
  if (!messages || messages.length === 0) return 'New Chat';
  
  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.sender === 'userMessage');
  
  if (!firstUserMessage || !firstUserMessage.content) return 'New Chat';
  
  // Create a title from first 6 words of the first message
  const words = firstUserMessage.content.trim().split(' ');
  const title = words.slice(0, 6).join(' ');
  
  // Add ellipsis if message was longer
  return words.length > 6 ? title + '...' : title;
}

/**
 * Auto-updates chat title based on messages if it's still the default
 * @param {string} chatId 
 */
export function autoUpdateChatTitle(chatId) {
  const chat = getChatHistory(chatId);
  if (!chat || !chat.messages || chat.messages.length === 0) return;
  
  // Only auto-update if title is still default or matches chatId
  if (chat.chatName === 'New Chat' || chat.chatName === chatId) {
    const newTitle = generateChatTitle(chat.messages);
    if (newTitle !== 'New Chat') {
      renameChat(chatId, newTitle);
    }
  }
}

/**
 * Creates and triggers download of a file with given content
 * @param {string} content - File content
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type for the file
 */
function triggerFileDownload(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  
  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  downloadLink.style.display = 'none';
  
  // temporarily add to DOM, trigger click, then clean up (DOM used for compatibility with older browsers)
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // method to invoke url cleanup to free memory
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Creates a hidden file input element and triggers it for file selection
 * @param {Function} onFileSelected - Callback function to handle selected file
 */
function triggerFileUpload(onFileSelected) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelected(file);
    }
    // clean up
    document.body.removeChild(fileInput);
  };
  
  // temporarily add to DOM and trigger click
  document.body.appendChild(fileInput);
  fileInput.click();
}

/**
 * Exports all chat histories as a JSON file and triggers download
 */
export function exportAllChats() {
  const chatHistories = getChatHistories();
  
  if (chatHistories.length === 0) {
    alert('No chat histories found to export.');
    return;
  }

  // get full chat data for all chats
  const allChats = [];
  
  chatHistories.forEach(chatSummary => {
    const fullChat = getChatHistory(chatSummary.chatId);
    if (fullChat) {
      allChats.push(fullChat);
    }
  });

  // prepare export data structure
  const exportData = {
    exportDate: new Date().toISOString(),
    totalChats: allChats.length,
    chats: allChats
  };

  const exportContent = JSON.stringify(exportData, null, 2);
  const exportDate = new Date().toISOString().split('T')[0];
  const filename = `chat-history-export-${exportDate}.json`;

  // trigger the download using the helper function
  triggerFileDownload(exportContent, filename);
  
  //console.log(`Exported ${allChats.length} chat(s) as JSON`);
}

/**
 * Imports all chat histories from a JSON file (must be in the same format as export)
 * @param {boolean} showAlert - Whether to show the built-in alert (default: true)
 * @param {Function} onComplete - Callback function called after user dismisses the alert
 * @return {Promise} - Promise that resolves with import stats when import is complete
 */
export function importAllChats(showAlert = true, onComplete = null) {
  return new Promise((resolve, reject) => {
    triggerFileUpload(async (file) => {
      try {
        const fileContent = await file.text();
        const importData = JSON.parse(fileContent);
        
        // validate its in the correct export format
        if (!importData.chats || !Array.isArray(importData.chats) || !importData.exportDate) {
          if (showAlert) {
            alert('Invalid file format. Please select a JSON file exported by this system.');
          }
          reject(new Error('Invalid file format'));
          return;
        }
        
        let importedCount = 0;
        let skippedCount = 0;
        
        // import each chat
        importData.chats.forEach(chat => {
          try {
            // if chat ID already exists, generate a new one to dynamically assign it
            let chatId = chat.chatId;
            if (localStorage.getItem(chatId)) {
              chatId = newChatId();
              chat.chatId = chatId;
            }
            
            localStorage.setItem(chatId, JSON.stringify(chat));
            importedCount++;
          } catch (error) {
            //console.warn(`Failed to import chat ${chat.chatId}:`, error);
            skippedCount++;
          }
        });
        
        if (showAlert) {
          alert(`Import completed!\nImported: ${importedCount} chats\nSkipped: ${skippedCount} chats`);
        }
        //console.log(`Imported ${importedCount} chat(s) from JSON file`);
        
        // call the completion callback after alert is dismissed
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
        
        // resolve the promise with the results
        resolve({ importedCount, skippedCount });
        
      } catch (error) {
        if (showAlert) {
          alert('Failed to import chat histories. Please check that the file is valid JSON.');
        }
        //console.error('Import error:', error);
        reject(error);
      }
    });
  });
}