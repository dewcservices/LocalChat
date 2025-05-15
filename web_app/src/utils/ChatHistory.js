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
      chatType: chat.chatType,
      creationDate: chat.creationDate,
      latestMessageDate: chat.latestMessageDate,
      title: chat.title ||""
    });
  }

  return chatHistory;
}

/**
 * Saves a chat to the browser's local storage.
 * @param {string} chatId 
 * @param {string} chatType 
 * @param {string} creationDate
 * @param {string} latestMessageDate
 * @param {Array<any>} messages [{sender: "", date: "", content: ""}]
 * @param {Array<any>} files [{fileName: "", content: ""}]
 * @throws {QuotaExceededError} if user has disabled storage for the site, or if the storage quote has been exceeded
 */
export function saveChatHistory(chatId, chatType, creationDate, latestMessageDate, messages, files = []) {
  let chat = {
    chatId: chatId,
    chatType: chatType,
    creationDate: creationDate,
    latestMessageDate: latestMessageDate,
    messages: messages,
    files: files
  };

  let chatJson = JSON.stringify(chat);

  localStorage.setItem(chatId, chatJson);
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
 * Renames a chat by updating its title in local storage.
 * @param {string} chatId 
 * @param {string} newTitle 
 */
export function rename(chatId, newTitle) {
  const raw = localStorage.getItem(chatId);
  if (!raw) return;
  try {
    const chat = JSON.parse(raw);
    chat.title = newTitle;
    localStorage.setItem(chatId, JSON.stringify(chat));
  } catch {
    // ignore parse errors
  }
}

