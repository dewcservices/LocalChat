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

    let chat = JSON.parse(value);

    if (!key.startsWith('chat-')) continue;
    chatHistory.push({
      chatId: key,
      chatName: chat.chatName,
      chatType: chat.chatType,
      creationDate: chat.creationDate,
      latestMessageDate: chat.latestMessageDate
    });
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

  let chat = JSON.parse(chatJson);
  chat.messages = messages;
  chat.latestMessageDate = latestMessageDate;

  localStorage.setItem(chatId, JSON.stringify(chat));
}

export function saveFiles(chatId, files) {
  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) throw new Error(`Could not find chat with Id: ${chatId}`);

  let chat = JSON.parse(chatJson);
  chat.files = files;

  localStorage.setItem(chatId, JSON.stringify(chat));
}

/**
 * Loads a chat from the browser's local storage. If no chat is found with the chatId, the function returns an empty
 * array.
 * @param {string} chatId 
 * @return {Array<any>} [[{sender: "", date: "", content: ""}],[{fileName: "", content: ""}]]
 */
export function getChatHistory(chatId) {
  let chatJson = localStorage.getItem(chatId);
  if (!chatJson) return [];

  let chat = JSON.parse(chatJson);
  return chat;
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

  let chat = JSON.parse(chatJson);
  chat.chatName = newName;

  localStorage.setItem(chatId, JSON.stringify(chat));
}
