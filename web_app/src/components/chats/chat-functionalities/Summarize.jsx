import { useContext, createSignal, onMount, createEffect } from 'solid-js';
import { pipeline, env, SummarizationPipeline } from '@huggingface/transformers';

import { ChatContext } from '../ChatContext';
import styles from './Summarize.module.css';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync, parsePdfFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModel } from '../../../utils/ModelCache';


function Summarize() {

  const chatContext = useContext(ChatContext);

  let summarizer;
  const [modelName, setModelName] = createSignal("");
  const [availableModels, setAvailableModels] = createSignal([], {equals: false}); 

  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  const [addModelBtnText, setAddModelBtnText] = createSignal("Add Model");

  // Checks the cache for models that can be used for summarization.
  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('summarization'));
  });

  const addModel = async () => {

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;

    setAddModelBtnText("Caching Model");

    let folderElement = document.getElementById("folderInput");
    let files = [...folderElement.files];

    if (files.length == 0) {
      alert("Empty model directory was selected, please select again.");
    }
    else if (!files.find(f => f.name == "browser_config.json")) {
      alert("Unsupported or Malformed Model.")
    }
    else if (JSON.parse(await files.find(f => f.name == "browser_config.json").text()).task != "summarization") {
      alert("Must be a summarisation model. browser_config.json states that the model is for a different task.");
    }
    else {
      let model = await cacheModel(files);

      // add model to list of available models
      let models = availableModels().slice();
      models.push(model);

      setAvailableModels(models);
      setModelName(model);
    }
    
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    setAddModelBtnText("Add Model");
  };

  // load model upon `modelName` or `processor` signal
  createEffect(async () => {
    if (modelName() == "") return;

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;
    
    // Change model button text to indicate a change in the procedure,
    // and request an animation frame to show this change.
    setAddModelBtnText("Creating pipeline");
    await new Promise(requestAnimationFrame);

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    summarizer = await pipeline('summarization', modelName(), { device: chatContext.processor() });
    console.log("Finished model setup using", chatContext.processor());

    setAddModelBtnText("Add Model");
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
  });

  const summarizeTextInput = async () => {

    if (modelName() == "") {
      alert("A model must be selected before summarising text. Please select a model.");
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

    chatContext.addMessage("Summarise: " + userMessage, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message", false, modelName());  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // force a re-render by yielding control back to browser

    try {
      let output = await summarizer(userMessage, { max_new_tokens: 100});  // generate response
      chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message 
    } catch (e) {
      chatContext.updateMessage(messageDate, "Error: failed to summarise text. Please try again.");  
    }
  };

  const summarizeFileInput = async () => {

    if (modelName() == "") {
      alert("A model must be selected before summarising text. Please select a model.");
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

    chatContext.addMessage("Summarise File: " + file.name, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message", false, modelName());  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // forces a re-render again by yielding control back to the browser
    
    try {
      let output = await summarizer(fileContent, { max_new_tokens: 100}); 
      chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message
    } catch (e) {
      chatContext.updateMessage(messageDate, "Error: failed to summarise text. Please try again.");
    }

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
                placeholder='Enter text to summarise here...'
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
              Summarise File
            </button>
            <button 
              class={`${tab() === "text" ? styles.selectedTab : styles.tab} ${hoveredTab() === "text" ? styles.highlighted : ''}`}
              onClick={() => setTab("text")}
              onMouseEnter={() => setHoveredTab("text")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Summarise Text
            </button>
          </div>

          {/* model selection and submit button */}
          <div class={styles.controlsRight}>

            <select 
              class={styles.modelSelection} 
              value={modelName()}
              onChange={e => setModelName(e.currentTarget.value)}
            >
              <option value="">Select Model</option>
              <For each={availableModels()}>{(model) => 
                <option value={model}>{model}</option>
              }</For>
            </select>

            <label 
              for="folderInput" 
              class={availableModels().length == 0 ? styles.noModels : styles.addModelButton}
            >
              {addModelBtnText()}
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
