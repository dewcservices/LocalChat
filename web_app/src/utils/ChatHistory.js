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
      console.warn(`Failed to parse chat data for key "${key}":`, error);
      // Optionally remove corrupted data
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
    console.error(`Failed to parse chat history for ${chatId}:`, error);
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