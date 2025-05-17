import { createSignal, useContext } from 'solid-js';
import styles from '../Chat.module.css';

import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';


function GeneralChat() {
  // TODO port disabling the upload folder functionality based off of browser support from main branch
  //      (disable button and add tooltip that states why the button is disabled)
  // TODO port the shift new line functionality from the main branch

  const chatContext = useContext(ChatContext);
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
          chatContext.addFile(content, file.name);
          chatContext.addMessage("Added File " + file.name, true);
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
        chatContext.addMessage(userMessage, true);
        inputTextArea.value = "";
      }
    }
  };

  return (
    <>
      {/* Input Container */}
      <div class={styles.inputContainer}>
        <textarea id="inputTextArea"></textarea>
        <div class={styles.fileUploadContainer}>
          <label 
            for="fileInput" class={styles.fileUploadLabel} 
            title="Select one or more files to upload"
          >
            Upload File/s
          </label>
          <input type="file" id="fileInput" multiple accept=".txt, .html, .docx" onChange={updateFileCount} />
          <label 
            for="folderInput" class={styles.fileUploadLabel}
            title="Select a folder to upload all files (not supported on older browsers)"
          >
            Upload Folder
          </label>
          <input type="file" id="folderInput" webkitdirectory multiple accept=".txt, .html, .docx" onChange={updateFileCount} />
          <label class={styles.fileCount}>{fileCount()} Files Selected</label>
        </div>
        <button onClick={getUserInput}>Send</button>
      </div>
    </>
  );
}

export default GeneralChat;
