import { createSignal, createEffect} from 'solid-js';
import { useParams } from '@solidjs/router';
import './GeneralChat.css';

import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../utils/FileReaders';
import { getChatHistory, saveChatHistory} from '../utils/ChatHistory';


function GeneralChat() {
  // FIXME errors when a non-valid chatId is typed into url
  // TODO port disabling the upload folder functionality based off of browser support from main branch
  //      (disable button and add tooltip that states why the button is disabled)
  // TODO port the shift new line functionality from the main branch

  const params = useParams();
  const chatId = params.id;

  const [messages, setMessages] = createSignal(getChatHistory(chatId), { equals: false });

  const appendMessage = (content, fromUser) => {
    messages().push({sender: fromUser ? "userMessage" : "chatbotMessage", content: content});
    setMessages(messages());
  };

  // scrolls to the most recently appended message
  createEffect(() => {
    let messageContainer = document.getElementsByClassName("messagesContainer")[0];
    let lastMessage = messageContainer.children[messages().length - 1];

    lastMessage.scrollIntoView({behavior: "smooth"});
  });

  // saves messages to local storage
  createEffect(() => {
    saveChatHistory(chatId, 'chat', messages());
  });

  const [fileCount, setFileCount] = createSignal(0);

  const updateFileCount = () => {

    let fileCount = document.getElementById("fileInput").files.length;

    let folderInput = document.getElementById("folderInput").files;

    for (let file of folderInput) {
      if (file.name.endsWith(".txt") || file.name.endsWith(".html" || file.name.endsWith(".docx"))) {
        fileCount++;
      }
    }

    setFileCount(fileCount);
  };

  const getUserInput = async () => {

    { // parse any selected files
      let fileInput = document.getElementById("fileInput");
      let folderInput = document.getElementById("folderInput");

      let allFiles = [...fileInput.files, ...folderInput.files];

      for (let file of allFiles) {

        let content = "";

        if (file.name.endsWith('.txt')) {
          content = await parseTxtFileAsync(file);
        }
        if (file.name.endsWith('.html')) {
          content = await parseHTMLFileAsync(file);
        }
        if (file.name.endsWith('.docx')) {
          content = await parseDocxFileAsync(file);
        }

        if (content != "") {
          console.log("Read file " + file.name + ". Content: " + content);
          appendMessage("Added File " + file.name, true);
        }
      }

      fileInput.value = null;
      folderInput.value = null;

      setFileCount(0);
    }

    { // parse user message if one was sent
      let inputTextArea = document.getElementById("inputTextArea");
      let userMessage = inputTextArea.value;

      if (userMessage != "") {
        appendMessage(userMessage, true);
        inputTextArea.value = "";
      }
    }
  };

  return (
    <>
      <div class="chatContainer">

        {/* Messages Container */}
        <div class="messagesContainer">
          <For each={messages()}>{(message) =>
            <div class={message.sender}>{message.content}</div>
          }</For>
        </div>

        {/* Input Container */}
        <div class="inputContainer">
          <textarea id="inputTextArea"></textarea>
          <div class="fileUploadContainer">
            <label for="fileInput" class="fileUploadLabel" title="Select one or more files to upload">Upload File/s</label>
            <input type="file" id="fileInput" multiple accept=".txt, .html, .docx" onChange={updateFileCount} />
            <label for="folderInput" class="fileUploadLabel"
              title="Select a folder to upload all files (not supported on older browsers)">Upload Folder</label>
            <input type="file" id="folderInput" webkitdirectory multiple accept=".txt, .html, .docx" onChange={updateFileCount} />
            <label class="fileCount">{fileCount()} Files Selected</label>
          </div>
          <button onClick={getUserInput}>Send</button>
        </div>

      </div>
    </>
  );
}

export default GeneralChat;
