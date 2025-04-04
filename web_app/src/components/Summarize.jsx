import { pipeline, env } from '@huggingface/transformers';
import { createSignal } from 'solid-js';
import './Summarize.css';

import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../utils/FileReaders';


function Summarize() {

  const [messages, setMessages] = createSignal([
    { sender: "userMessage", content: "example user message"},
    { sender: "chatbotMessage", content: "example AI message"}
  ], { equals: false });

  const addMessage = (content, fromUser) => {
    messages().push({sender: fromUser ? "userMessage" : "chatbotMessage", content: content});
    setMessages(messages());
  };

  const summarizeTextInput = async () => {
    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage != "") {
      addMessage("Summarize: " + userMessage, true);
      inputTextArea.value = "";

      console.log("Summarizing model...");

      let generator = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      let output = await generator(userMessage, { max_new_tokens: 100});

      addMessage(output[0].summary_text, false);
    }
  };

  const summarizeFile = async () => {
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

    console.log("Read file: " + fileContent);
    console.log("Summarizing model...")

    env.allowLocalModels = false;
    env.useBrowserCache = false;

    let generator = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    let output = await generator(fileContent, { max_new_tokens: 100});

    addMessage(output[0].summary_text, false);

    fileInput.value = null;
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
          <div>Enter text to summarize in area below:</div>
          <textarea id="inputTextArea"></textarea>
          <div class="fileUploadContainer">
            <label for="fileInput" class="fileUploadLabel">Summarize File</label>
            <input type="file" id="fileInput" accept=".txt, .html, .docx" onChange={summarizeFile} />
            <label onClick={summarizeTextInput} class="fileUploadLabel">Summarize Text</label>
          </div>
        </div>

      </div>
 
    </>
  );
}

export default Summarize;