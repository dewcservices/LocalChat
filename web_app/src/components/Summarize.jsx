import { pipeline, env } from '@huggingface/transformers';
import { createSignal, createEffect } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';

import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../utils/FileReaders';
import { getChatHistory, saveChatHistory } from '../utils/ChatHistory';


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
        console.log(newContent);
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
    if (messages().length > 0) saveChatHistory(params.id, 'summarize', chatHistory.creationDate, chatHistory.latestMessageDate, messages(), files());
  });

  const summarizeTextInput = async () => {
    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage != "") {
      addMessage("Summarize: " + userMessage, true);
      inputTextArea.value = "";

      console.log("Summarizing model...");
      let messageDate = addMessage("Loading Model", false);

      env.useBrowserCache = true;

      let generator = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');

      updateMessage(messageDate, "Generating Message");

      let output = await generator(userMessage, { max_new_tokens: 100});

      updateMessage(messageDate, output[0].summary_text);
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

    addFile(fileContent, file.name);

    console.log("Summarizing model.....");

    env.useBrowserCache = false;

    console.log("Test1")

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
            <div class={message.sender} title={new Date(message.date).toUTCString()}>{message.content}</div>
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
