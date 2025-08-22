import { useContext, createSignal, onMount } from 'solid-js';
import { pipeline, env, SummarizationPipeline } from '@huggingface/transformers';

import { ChatContext } from '../ChatContext';
import styles from './Summarize.module.css';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync, parsePdfFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModel } from '../../../utils/ModelCache';


function Summarize() {

  const chatContext = useContext(ChatContext);
  const [availableModels, setAvailableModels] = createSignal([], {equals: false}); 

  let summarizer;

  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  // Checks the cache for models that can be used for summarization.
  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('summarization'));
  });

  const addModel = async () => {

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;

    let modelUploadLabel = document.getElementById("modelInputLabel");
    // modelUploadLabel.classList.add(styles.disabledLabel);  
      // FIXME: at some point disabledLabel was removed from styles, however, this may require refactoring anyway
    modelUploadLabel.innerText = "Cacheing Model";

    let folderElement = document.getElementById("folderInput");
    let files = [...folderElement.files];

    // TODO improve UX
    if (files.length == 0) {
      alert("Empty model directory was selected, please select again.");
    }
    else if (!files.find(f => f.name == "browser_config.json")) {
      alert("Unsupported or Malformed Model.")
    }
    else if (JSON.parse(await files.find(f => f.name == "browser_config.json").text()).task != "summarization") {
      alert("Must be a summarization model. browser_config.json states that the model is for a different task.");
    }
    else {
      let modelName = await cacheModel(files);

      // add model to list of available models
      let models = availableModels().slice();
      models.push(modelName);
      setAvailableModels(models);
    }
    
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    // modelUploadLabel.classList.remove(styles.disabledLabel);
    modelUploadLabel.innerText = "Add Model";
  };

  const loadModel = async (event) => {
    if (event.target.value == "") return;

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;
    let modelUploadLabel = document.getElementById("modelInputLabel");
    
    // Change model button text to indicate a change in the procedure,
    // and request an animation frame to show this change.
    modelUploadLabel.innerText = "Creating pipeline";
    await new Promise(requestAnimationFrame);

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    summarizer = await pipeline('summarization', event.target.value, { device: chatContext.processor() });
    console.log("Finished model setup using", chatContext.processor());

    modelUploadLabel.innerText = "Add Model";
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
  };

  const summarizeTextInput = async () => {
    let selectedModel = document.getElementById('modelSelection').value;

    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(summarizer instanceof SummarizationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage == "") return;

    chatContext.addMessage("Summarize: " + userMessage, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message...", false, selectedModel);  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // force a re-render by yielding control back to browser

    let output = await summarizer(userMessage, { max_new_tokens: 100});  // generate response
    chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message to response
  };

  const summarizeFileInput = async () => {
    let selectedModel = document.getElementById('modelSelection').value;

    if (selectedModel == "") {
      alert("A model must be selected before summarizing text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(summarizer instanceof SummarizationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let fileInput = document.getElementById("fileInput");

    let file = fileInput.files[0];

    let fileContent = "";
    try {
      if (file.name.endsWith('.txt')) {
        fileContent = await parseTxtFileAsync(file);
      } else if (file.name.endsWith('.html')) {
        fileContent = await parseHTMLFileAsync(file);
      } else if (file.name.endsWith('.docx')) {
        fileContent = await parseDocxFileAsync(file);
      } else if (file.name.endsWith('.pdf')) {
        fileContent = await parsePdfFileAsync(file);
      } else {
        alert("Unsupported file type. Please use .txt, .html, .docx, or .pdf files.");
        fileInput.value = null;
        return;
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error processing file. Please try a different file format.");
      fileInput.value = null;
      return;
    }

    chatContext.addMessage("Summarize File: " + file.name, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message", false, selectedModel);  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // forces a re-render again by yielding control back to the browser
    
    let output = await summarizer(fileContent, { max_new_tokens: 100});  // generate response
    chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message to response

    fileInput.value = null;  // clear file input element
  };

  return (
    <>
      <div class={styles.inputContainer}>

        {/* Dynamic input UI - moved to top */}
        <Switch>
          <Match when={tab() === "text"}>
            <div class={styles.searchBarContainer}>
              <textarea id="inputTextArea" 
                placeholder='Enter text to summarize here...'
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    summarizeTextInput();
                  }
                }}
              ></textarea>
            </div>
          </Match>
          <Match when={tab() === "file"}>
            <div style="margin-top:2vh;margin-left:2vh;">
              <input type="file" id="fileInput" accept=".txt, .html, .docx, .pdf" />
            </div>
          </Match>
        </Switch>

        {/* Control buttons row */}
        <div class={styles.controlsContainer}>

          {/* text or file tab switcher */}
          <div class={styles.controlsLeft}>
            <button 
              class={`${tab() === "file" ? styles.selectedTab : styles.tab} ${hoveredTab() === "file" ? styles.highlighted : ''}`}
              onClick={() => setTab("file")}
              onMouseEnter={() => setHoveredTab("file")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Summarize File
            </button>
            <button 
              class={`${tab() === "text" ? styles.selectedTab : styles.tab} ${hoveredTab() === "text" ? styles.highlighted : ''}`}
              onClick={() => setTab("text")}
              onMouseEnter={() => setHoveredTab("text")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Summarize Text
            </button>
          </div>

          {/* model selection and submit button */}
          <div class={styles.controlsRight}>
            <select id="modelSelection" class={styles.modelSelection} onChange={loadModel}>
              <option value="">Select Model</option>
              <For each={availableModels()}>{(modelName) => 
                <option value={modelName}>{modelName}</option>
              }</For>
            </select>
            <label 
              for="folderInput" 
              id="modelInputLabel" 
              class={availableModels().length == 0 ? styles.noModels : styles.addModelButton}
            >
              Add Model
            </label>
            <input type="file" id="folderInput" class="hidden" webkitdirectory multiple onChange={addModel} />
            <button 
              id="sendButton" 
              class={styles.sendButton}
              onClick={() => {tab() == "text" ? summarizeTextInput() : summarizeFileInput()}} 
            >
              Send
            </button>
          </div>

        </div>

      </div>
    </>
  );
}

export default Summarize;
