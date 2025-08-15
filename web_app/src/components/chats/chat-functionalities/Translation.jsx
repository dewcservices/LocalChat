import { useContext, createSignal, onMount } from 'solid-js';
import { pipeline, env, TranslationPipeline } from '@huggingface/transformers';

import { ChatContext } from "../ChatContext";
import styles from './Translation.module.css';
import { parseDocxFileAsync, parseTxtFileAsync, parseHTMLFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModel } from '../../../utils/ModelCache';
import { A } from '@solidjs/router';


function Translation() {

  const chatContext = useContext(ChatContext);
  const [availableModels, setAvailableModels] = createSignal("");
  
  let translator;

  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  // a dictionary of the the languages and their codes (e.g. {"English": "eng_Latn", ...}),
  // provided by browser_config.json
  const [languages, setLanguages] = createSignal({});

  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('translation'));
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
      alert("Unsupported or Malformed Model");
    }
    else if (JSON.parse(await files.find(f => f.name == "browser_config.json").text()).task != "translation") {
      alert(`Must be a translation model. browser_config.json states that the model is for a different task.`);
    }
    else {
      let modelName = await cacheModel(files);

      let models = availableModels().slice();
      models.push(modelName);
      setAvailableModels(models);
    }

    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
    modelUploadLabel.innerText = "Add Model";
  };

  const loadModel = async (event) => {
    let modelName = event.target.value;

    if (modelName == "") return;

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

    translator = await pipeline('translation', modelName, { device: chatContext.processor() });
    console.log("Finished model setup using", chatContext.processor());

    { // load languages
      let cache = await caches.open('transformers-cache');
      let cacheKeys = await cache.keys();
      let configKey = cacheKeys.filter(k => k.url.includes("browser_config.json") && k.url.includes(modelName))[0];

      let response = await cache.match(configKey);
      let array = await response.arrayBuffer();
      let config = JSON.parse((new TextDecoder()).decode(array));

      console.log(config.languages);
      setLanguages(config.languages);
    }

    modelUploadLabel.innerText = "Add Model";
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
  };


  const translateTextInput = async () => {
    let selectedModel = document.getElementById("modelSelection").value;

    if (selectedModel === "") {
      alert("A model must be selected before tranlating text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(translator instanceof TranslationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let inputTextArea = document.getElementById("inputTextArea");
    let userMessage = inputTextArea.value;

    if (userMessage == "") return;

    let src_lang = document.getElementById('src_lang').value;
    if (src_lang == "") {
      alert("Please select a language to translate from.")
      return;
    }

    let tgt_lang = document.getElementById('tgt_lang').value;
    if (tgt_lang == "") {
      alert("Please select a language to translate to.");
      return;
    }

    chatContext.addMessage(`Translate from ${src_lang} to ${tgt_lang}: "${userMessage}"`, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message", false, selectedModel);  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // force a re-render by yielding control back to browser

    let output = await translator(userMessage, {src_lang: src_lang, tgt_lang: tgt_lang});
    chatContext.updateMessage(messageDate, output[0].translation_text);  // update temp message to response
  };

  const translateFileInput = async () => {
    let selectedModel = document.getElementById("modelSelection").value;
    
    if (selectedModel === "") {
      alert("A model must be selected before tranlating text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(translator instanceof TranslationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let src_lang = document.getElementById('src_lang').value;
    if (src_lang == "") {
      alert("Please select a language to translate from.")
      return;
    }

    let tgt_lang = document.getElementById('tgt_lang').value;
    if (tgt_lang == "") {
      alert("Please select a language to translate to.");
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

    chatContext.addMessage(`Translate File from ${src_lang} to ${tgt_lang}: ${file.name}`, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message", false, selectedModel);  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // forces a re-render again by yielding control back to the browser

    let output = await translator(fileContent, {src_lang: src_lang, tgt_lang: tgt_lang});
    chatContext.updateMessage(messageDate, output[0].translation_text);  // update temp message to response
  };

  return (
    <>
      <div class={styles.inputContainer}>

        {/* Dynamic input UI */}
        <Switch>
          <Match when={tab() === "text"}>
            <div class={styles.searchBarContainer}>
              <textarea id="inputTextArea" 
                placeholder='Enter text to translate here...'
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    translateTextInput();
                  }
                }}
              ></textarea>
            </div>
          </Match>
          <Match when={tab() === "file"}>
            <div style="margin-top:2vh;margin-left:2vh;">
              <input type="file" id="fileInput" accept=".txt, .html., .docx" />
            </div>
          </Match>
        </Switch>

        {/* Control buttons row - moved to bottom */}
        <div class={styles.controlsContainer}>

          <div class={styles.controlsLeft}>
            <button 
              class={`${tab() === "file" ? styles.selectedTab : styles.tab} ${hoveredTab() === "file" ? styles.highlighted : ''}`}
              onClick={() => setTab("file")}
              onMouseEnter={() => setHoveredTab("file")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Translate File
            </button>
            <button 
              class={`${tab() === "text" ? styles.selectedTab : styles.tab} ${hoveredTab() === "text" ? styles.highlighted : ''}`}
              onClick={() => setTab("text")}
              onMouseEnter={() => setHoveredTab("text")}
              onMouseLeave={() => setHoveredTab(null)}
            >
              Translate Text
            </button>
          </div>

          <div class={styles.controlsRight}>
            
            <label for="src_lang">From: </label>
            <select name="src_lang" id="src_lang" class={styles.selection}>
              <option value="">Select Language</option>
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang" class={styles.selection} style="margin-right: 4vh;">
              <option value="">Select Language</option>
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select>

            <select id="modelSelection" class={styles.selection} onChange={loadModel}>
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
              onClick={() => {tab() == "text" ? translateTextInput() : translateFileInput()}} 
              class={styles.sendButton}
            >
              Send
            </button>

          </div>

        </div>

      </div>
    </>
  );
}

export default Translation;
