import { createSignal } from 'solid-js';
import './GeneralChat.css';

import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../utils/FileReaders';


function GeneralChat() {

  const [messages, setMessages] = createSignal([
    { sender: "userMessage", content: "example user message"},
    { sender: "chatbotMessage", content: "example AI message"}
  ], { equals: false });

  const addMessage = (content, fromUser) => {
    messages().push({sender: fromUser ? "userMessage" : "chatbotMessage", content: content});
    setMessages(messages());
  };

  const [fileCount, setFileCount] = createSignal(0);

  const getUserInput = async () => {

    // parse any selected files
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
        addMessage("Added File " + file.name, true);
      }
    }

    fileInput.value = null;
    folderInput.value = null;

    setFileCount(0);

    // parse user message if one was sent
    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage != "") {
      addMessage(userMessage, true);
      inputTextArea.value = "";
    }
  };

  const updateFileCount = () => {

    let fileCount = document.getElementById("fileInput").files.length;

    let folderInput = document.getElementById("folderInput").files;

    for (let file of folderInput) {
      if (file.name.endsWith(".txt")) {
        fileCount++;
      }
    }

    setFileCount(fileCount);
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