import { pipeline, env } from '@huggingface/transformers';
import { createSignal, createEffect } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import './GeneralChat.css';

import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../utils/FileReaders';
import { getChatHistory, saveChatHistory } from '../utils/ChatHistory';
import { pathJoin } from '../utils/PathJoin';


function Summarize() {

  const navigate = useNavigate();
  const params = useParams();

  const [messages, setMessages] = createSignal([], { equals: false });
  const [files, setFiles] = createSignal([], { equals: false });

  let chatHistory;
  createEffect(() => {
    chatHistory = getChatHistory(params.id);
    if (chatHistory.messages.length == 0) navigate('/');
    setMessages(chatHistory.messages);
    setFiles(chatHistory.files);
  });
  
  const addMessage = (content, fromUser) => {
    let messageDate = Date.now();
    chatHistory.latestMessageDate = messageDate;
    setMessages([...messages(), {sender: fromUser ? "userMessage" : "chatbotMessage", date: messageDate, content: content}]);
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
    let messageContainer = document.getElementsByClassName("messagesContainer")[0];
    let lastMessage = messageContainer.children[messages().length - 1];

    lastMessage?.scrollIntoView({behavior: "smooth"});
  });

  // saves messages to local storage
  createEffect(() => {
    if (messages().length > 0) saveChatHistory(params.id, 'summarize', chatHistory.creationDate, 
      chatHistory.latestMessageDate, messages(), files());
  });

  let selectedModel = "";

  const setupModel = async () => {
    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    // inject models into browser cache
    let cache = await caches.open('transformers-cache');

    let folderElement = document.getElementById("folderInput");
    let files = [...folderElement.files];

    if (files.length == 0) {
      alert("Empty model directory was selected, please select again."); // TODO improve UX
    }
    
    if (files[0].webkitRelativePath.includes("distilbart-cnn-6-6")) {
      selectedModel = "Xenova/distilbart-cnn-6-6";
    } else if (files[0].webkitRelativePath.includes("bart-large-cnn")) {
      selectedModel = "Xenova/bart-large-cnn";
    } else {
      alert("Unsupported Model."); // TODO improve UX
      return;
    }

    for (let file of files) {

      let cacheKey = pathJoin(
        env.remoteHost, 
        env.remotePathTemplate
          .replaceAll('{model}', selectedModel)
          .replaceAll('{revision}', 'main'),
        file.name.endsWith(".onnx") ? 'onnx/' + file.name : file.name
      );

      let fileReader = new FileReader();
      fileReader.onload = async () => {
        let arrayBuffer = fileReader.result;
        let uint8Array = new Uint8Array(arrayBuffer);
        
        console.log(file.webkitRelativePath, uint8Array);
        await cache.put(cacheKey, new Response(uint8Array))
      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  const summarizeTextInput = async () => {
    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }

    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage == "") return;

    addMessage("Summarize: " + userMessage, true);
    inputTextArea.value = "";

    let messageDate = addMessage("Loading Model", false);  // temporary message to indicate progress
    let generator = await pipeline('summarization', selectedModel);  // load model/pipeline

    updateMessage(messageDate, "Generating Message");  // update temp message to indicate progress
    let output = await generator(userMessage, { max_new_tokens: 100});  // generate response

    updateMessage(messageDate, output[0].summary_text);  // update temp message to response
  };

  const summarizeFileInput = async () => {
    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }

    let fileInput = document.getElementById("fileInput");

    let file = fileInput.files[0];

    let fileContent = "";
    if (file.name.endsWith('.txt')) {
      fileContent = await parseTxtFileAsync(file);
    }
    if (file.name.endsWith('.html')) {
      fileContent = await parseHTMLFileAsync(file);
    }
    if (file.name.endsWith('.docx')) {
      fileContent = await parseDocxFileAsync(file);
    }

    addMessage("Summarize File: " + file.name, true);
    addFile(fileContent, file.name);

    let messageDate = addMessage("Loading Model", false);  // temporary message to indicate progress
    let generator = await pipeline('summarization', selectedModel);  // load model/pipeline

    updateMessage(messageDate, "Generating Message");  // update temp message to indicate progress
    let output = await generator(fileContent, { max_new_tokens: 100});  // generate response

    updateMessage(messageDate, output[0].summary_text);  // update temp message to response

    fileInput.value = null;  // clear file input element
  };

  return (
    <>
      <div class="chatContainer">

        {/* Messages Container */}
        <div class="messagesContainer">
          <For each={messages()}>{(message) =>
            <div class={`${message.sender} ${(message.content == "Loading Model..." || message.content == "Generating Message...") ? "messageLoading" : ""}`} title={new Date(message.date).toUTCString()}>{message.content}</div>
          }</For>
        </div>

        {/* Input Container */}
        <div class="inputContainer">
          <div>Enter text to summarize in area below:</div>
          <textarea id="inputTextArea"></textarea>
          <div class="fileUploadContainer">
            <label for="folderInput" class="fileUploadLabel">Select Model</label>
            <input type="file" id="folderInput" webkitdirectory multiple onChange={setupModel} />
            <label for="fileInput" class="fileUploadLabel">Summarize File</label>
            <input type="file" id="fileInput" accept=".txt, .html, .docx" onChange={summarizeFileInput} />
            <label onClick={summarizeTextInput} class="fileUploadLabel">Summarize Text</label>
          </div>
        </div>

      </div>
 
    </>
  );
}

export default Summarize;
