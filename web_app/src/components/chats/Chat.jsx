import { createSignal, createEffect, useContext, onMount, For, Switch, Match } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';

import styles from './Chat.module.css';
import { ChatContext } from './ChatContext';
import { ChatHistoriesContext } from '../LayoutChatHistoriesContext';
import { getChatHistory, saveMessages, saveFiles, getChatHistories, autoUpdateChatTitle } from '../../utils/ChatHistory';

// Chat Functionalities
import Summarize from './chat-functionalities/Summarize';
import QuestionAnswer from './chat-functionalities/QuestionAnswer';
import Translation from './chat-functionalities/Translation';


function Chat() {

  const chatHistoriesContext = useContext(ChatHistoriesContext);

  const navigate = useNavigate();
  const params = useParams();

  const [messages, setMessages] = createSignal([], { equals: false });
  const [files, setFiles] = createSignal([], { equals: false });
  const [processor, setProcessor] = createSignal("wasm");

  const [chatHistory, setChatHistory] = createSignal(null);

  createEffect(() => {
    setChatHistory(getChatHistory(params.id));
    if (chatHistory().messages.length == 0) navigate('/');
    setMessages(chatHistory().messages);
    setFiles(chatHistory().files);
  });
  
  const addMessage = (content, fromUser, selectedModel = null) => {
    let messageDate = Date.now();
    chatHistory().latestMessageDate = messageDate;
    setMessages([...messages(), {sender: fromUser ? "userMessage" : "chatbotMessage", date: messageDate, modelName: selectedModel, content: content}]);

    // update if context is available
    if (chatHistoriesContext?.setChatHistories) {
      chatHistoriesContext.setChatHistories(getChatHistories());  // update order of layout's chat histories list
    }

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
  };

  const copyMessage = (date) => {
    let message = messages().find((message) => message.date == date);
    console.log(message.content);
    navigator.clipboard.writeText(message.content);
  };

  const addFile = (content, fileName) => {
    console.log(messages());
    files().push({fileName: fileName, content: content});
    setFiles(files());
  };

  // scrolls to the most recently appended message
  createEffect(() => {
    let messageContainer = document.getElementById("messagesContainer");
    let lastMessage = messageContainer.children[messages().length - 1];

    lastMessage?.scrollIntoView({behavior: "smooth"});
    messages(); // reactive dependency
  });

  // saves messages to local storage and auto-updates chat title
  createEffect(() => {
    if (messages().length <= 0) return;
    saveMessages(chatHistory().chatId, chatHistory().latestMessageDate, messages());
    saveFiles(chatHistory().chatId, files());
    
    // Auto-update chat title after saving messages
    autoUpdateChatTitle(chatHistory().chatId);
    
    // Update the chat histories context to reflect any title changes - with safety check
    if (chatHistoriesContext?.setChatHistories) {
      chatHistoriesContext.setChatHistories(getChatHistories());
    }
  });

  const changeProcessor = (newProcessor) => {
    if (processor() == newProcessor) return;

    if (newProcessor == "webgpu") {
      alert("Warning, Using a GPU may cause a longer initial load time");
    }
    console.log("Switching to", newProcessor);
    setProcessor(newProcessor);
  };

  onMount(async () => {
    if (!navigator.gpu) return;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter !== null) {
        document.getElementById("GPUButton").disabled = false;
        document.getElementById("GPUButton").title = "Swap to using GPU";
      }
    } catch {
      console.warn("Error detecting GPU, defaulting to using CPU.");
    }
  });

  return (
    <>
      <div id="processorSelector" class={styles.processSelector}>
        <button 
          onClick={() => changeProcessor("wasm")}
          class={styles.processorButton + " " + `${processor() == "wasm" ? styles.processorButtonSelected : ""}`}
          id="CPUButton" title="Swap to using CPU"
        >
          CPU
        </button>
        <button 
          onClick={() => changeProcessor("webgpu")}
          class={styles.processorButton + " " + `${processor() == "webgpu" ? styles.processorButtonSelected : ""}`}
          id="GPUButton" disabled title="No GPU Detected"
        >
          GPU
        </button>
      </div>

      <div class={styles.chatContainer}>

        {/* Messages Container */}
        <div id="messagesContainer" class={styles.messagesContainer}>

          <For each={messages()}>{(message) =>
            <>
              {message.modelName != null ? <div class={styles.modelNameText}>{message.modelName}</div> : ""}
              <div 
                class={`${message.sender == "userMessage" ? styles.userMessage + " " + styles.rightAlignedMessage : styles.chatbotMessage} 
                        ${(message.content == "Generating Message...") ? styles.messageLoading : ""}`} 
                title={new Date(message.date).toUTCString()}
              >
                {message.content}
              </div>
              <button class={`${
                message.sender == "userMessage" ? styles.copyButton + " " + styles.rightAlignedMessage : styles.copyButton
              }`} onClick={() => copyMessage(message.date)} title="Copy message">📋</button>
            </>
          }</For>
        </div>

        {/* Input Container */}
        <ChatContext.Provider value={{ addMessage, updateMessage, addFile, processor }}>
          <Switch>
            <Match when={chatHistory()?.chatType === "summarize"}>
              <Summarize />
            </Match>
            <Match when={chatHistory()?.chatType === "question-answer"}>
              <QuestionAnswer />
            </Match>
            <Match when={chatHistory()?.chatType === "translation"}>
              <Translation />
            </Match>
          </Switch>
        </ChatContext.Provider>

      </div>
    </>
  );
}

export default Chat;
