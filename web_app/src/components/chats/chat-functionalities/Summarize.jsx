import { useContext } from 'solid-js';
import { pipeline, env, SummarizationPipeline } from '@huggingface/transformers';

import { ChatContext } from '../ChatContext';
import styles from '../Chat.module.css';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { pathJoin } from '../../../utils/PathJoin';


function Summarize() {

  const chatContext = useContext(ChatContext);

  let selectedModel = "";
  let generator;

  const setupModel = async () => {

    console.log("Setting up model...");

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

    console.log("testing GPU compatibility");

    let device = "wasm";

    // Check if the webGPU API is available.
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        console.log("Adapter:", adapter);
        if (adapter !== null) device = "webgpu";
      } catch {
        console.warn("Error detecting GPU, defaulting to using CPU.");
      }
    }

    console.log("creating model pipeline");

    generator = await pipeline('summarization', selectedModel, { device: device });
    console.log("Finished model setup using", device);
  };

  const summarizeTextInput = async () => {
    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(generator instanceof SummarizationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage == "") return;

    chatContext.addMessage("Summarize: " + userMessage, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message...", false, selectedModel);  // temporary message to indicate progress
    let output = await generator(userMessage, { max_new_tokens: 100});  // generate response
    chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message to response
  };

  const summarizeFileInput = async () => {
    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(generator instanceof SummarizationPipeline)) {
      alert("Model is loading... please try again.");
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

    chatContext.addMessage("Summarize File: " + file.name, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message...", false, selectedModel);  // temporary message to indicate progress
    let output = await generator(fileContent, { max_new_tokens: 100});  // generate response
    chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message to response

    fileInput.value = null;  // clear file input element
  };

  return (
    <>
      <div class={styles.inputContainer}>
        <div>Enter text to summarize in area below:</div>
        <textarea id="inputTextArea"></textarea>
        <div class={styles.fileUploadContainer}>
          <label for="folderInput" class={styles.fileUploadLabel}>Select Model</label>
          <input type="file" id="folderInput" webkitdirectory multiple onChange={setupModel} />
          <label for="fileInput" class={styles.fileUploadLabel}>Summarize File</label>
          <input type="file" id="fileInput" accept=".txt, .html, .docx" onChange={summarizeFileInput} />
          <label onClick={summarizeTextInput} class={styles.fileUploadLabel}>Summarize Text</label>
        </div>
      </div>
    </>
  );
}

export default Summarize;
