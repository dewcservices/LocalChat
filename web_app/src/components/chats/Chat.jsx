import { createSignal, createEffect, useContext } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';

import styles from './Chat.module.css';
import { ChatContext } from './ChatContext';
import { ChatHistoriesContext } from '../LayoutChatHistoriesContext';
import { getChatHistory, saveMessages, saveFiles, getChatHistories } from '../../utils/ChatHistory';

// Chat Functionalities
import Summarize from './chat-functionalities/Summarize';
import GeneralChat from './chat-functionalities/GeneralChat';


function Chat() {

  const chatHistoriesContext = useContext(ChatHistoriesContext);

  const navigate = useNavigate();
  const params = useParams();

  const [messages, setMessages] = createSignal([], { equals: false });
  const [files, setFiles] = createSignal([], { equals: false });

  const [chatHistory, setChatHistory] = createSignal(null);

  createEffect(() => {
    setChatHistory(getChatHistory(params.id));
    if (chatHistory().messages.length == 0) navigate('/');
    setMessages(chatHistory().messages);
    setFiles(chatHistory().files);
  });
  
  const addMessage = (content, fromUser) => {
    let messageDate = Date.now();
    chatHistory().latestMessageDate = messageDate;
    setMessages([...messages(), {sender: fromUser ? "userMessage" : "chatbotMessage", date: messageDate, content: content}]);

    chatHistoriesContext.setChatHistories(getChatHistories());  // update order of layout's chat histories list

    return messageDate;
  };

  const updateMessage = (messageDate, newContent) => {

    // find the message with the matching date.
    const updatedMessageHistory = messages().map((message) => {
      if (message.date == messageDate) {
        // update and return the message with the updated message content.
        return { ...message, content: newContent };
      }
      return message;
    })

    setMessages(updatedMessageHistory);
  }

  const addFile = (content, fileName) => {
    files().push({fileName: fileName, content: content});
    setFiles(files());
  };

  // scrolls to the most recently appended message
  createEffect(() => {
    let messageContainer = document.getElementById("messagesContainer");
    let lastMessage = messageContainer.children[messages().length - 1];

    lastMessage?.scrollIntoView({behavior: "smooth"});
  });

  // saves messages to local storage
  createEffect(() => {
    if (messages().length <= 0) return;
    saveMessages(chatHistory().chatId, chatHistory().latestMessageDate, messages());
    saveFiles(chatHistory().chatId, files());
  });

  return (
    <>
      <div class={styles.chatContainer}>

        {/* Messages Container */}
        <div id="messagesContainer" class={styles.messagesContainer}>
          <For each={messages()}>{(message) =>
            <div 
              class={`${message.sender == "userMessage" ? styles.userMessage : styles.chatbotMessage} 
                      ${(message.content == "Generating Message...") ? styles.messageLoading : ""}`} 
              title={new Date(message.date).toUTCString()}
            >
              {message.content}
            </div>
          }</For>
        </div>

        {/* Input Container */}
        <ChatContext.Provider value={{ addMessage, updateMessage, addFile }}>
          <Show when={chatHistory()?.chatType == "summarize"}>
            <Summarize />
          </Show>
          <Show when={chatHistory()?.chatType == "general"}>
            <GeneralChat />
          </Show>
        </ChatContext.Provider>

      </div>
    </>
  );
}

export default Chat;
