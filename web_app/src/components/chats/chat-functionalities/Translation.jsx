import { useContext, createSignal } from 'solid-js';
import { pipeline, env, TranslationPipeline } from '@huggingface/transformers';

import { ChatContext } from "../ChatContext";
import styles from './Translation.module.css';
import { parseDocxFileAsync, parseTxtFileAsync, parseHTMLFileAsync } from '../../../utils/FileReaders';
import { pathJoin } from '../../../utils/PathJoin';


function Translation() {

  const chatContext = useContext(ChatContext);
  const [selectedModel, setSelectedModel] = createSignal("");
  
  let translator;

  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  // a dictionary of the the languages and their codes (e.g. {"English": "eng_Latn", ...}),
  // provided by browser_config.json
  const [languages, setLanguages] = createSignal({});

  // TODO load supported languages dynamically from a config file
  const setupModel = async () => {

    // disable uploading another model, and change the text to indicate a model is being loaded.
    document.getElementById("folderInput").disabled = true;
    const modelUploadLabel = document.getElementById("modelInputLabel");
    modelUploadLabel.classList.add(styles.disabledLabel);  
      // FIXME: at some point disabledLabel was removed from styles, however, this may require refactoring anyway
    modelUploadLabel.innerText = "Loading Model";

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

    let configFile = files.find(file => file.name == "browser_config.json");
    
    if (!configFile) {
      alert("Unsupported or Malformed Model");
      return;
    }
    
    let config = await configFile.text();
    config = JSON.parse(config);

    if (config.task !== "translation") {
      alert(`Must be a translation model. browser_config.json states that the model is for ${config.task}.`);
      modelUploadLabel.innerText = "Select Model";
      document.getElementById("folderInput").disabled = false;
      return;
    }
    setLanguages(config.languages);

    setSelectedModel(config.modelName);
    
    for (let file of files) {

      let cacheKey = pathJoin(
        env.remoteHost, 
        env.remotePathTemplate
          .replaceAll('{model}', config.modelName)
          .replaceAll('{revision}', 'main'),
        file.name.endsWith(".onnx") ? 'onnx/' + file.name : file.name
      );

      let fileReader = new FileReader();
      fileReader.onload = async () => {
        let arrayBuffer = fileReader.result;
        let uint8Array = new Uint8Array(arrayBuffer);
        
        //console.log(file.webkitRelativePath, uint8Array);
        await cache.put(cacheKey, new Response(uint8Array));
      };
      fileReader.readAsArrayBuffer(file);
    }

    // Change model button text to indicate a change in the procedure,
    // and request an animation frame to show this change.
    modelUploadLabel.innerText = "Creating pipeline";
    await new Promise(requestAnimationFrame);

    const device = chatContext.processor();

    translator = await pipeline('translation', config.modelName, {device: device});
    console.log("Finished model setup using", device);

    // Re-enable uploading another model.
    document.getElementById("folderInput").disabled = false;
    modelUploadLabel.classList.remove(styles.disabledLabel);
    modelUploadLabel.innerText = config.modelName;
  };

  const translateTextInput = async () => {
    if (selectedModel() === "") {
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

    let src_lang_select = document.getElementById('src_lang');
    let src_lang = src_lang_select.value;

    let tgt_lang_select = document.getElementById('tgt_lang');
    let tgt_lang = tgt_lang_select.value;

    chatContext.addMessage(`Translate from ${src_lang} to ${tgt_lang}: "${userMessage}"`, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message", false, selectedModel());  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // force a re-render by yielding control back to browser

    let output = await translator(userMessage, {src_lang: src_lang, tgt_lang: tgt_lang});
    chatContext.updateMessage(messageDate, output[0].translation_text);  // update temp message to response
  };

  const translateFileInput = async () => {
    if (selectedModel() === "") {
      alert("A model must be selected before tranlating text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(translator instanceof TranslationPipeline)) {
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

    let src_lang_select = document.getElementById('src_lang');
    let src_lang = src_lang_select.value;

    let tgt_lang_select = document.getElementById('tgt_lang');
    let tgt_lang = tgt_lang_select.value;

    chatContext.addMessage(`Translate File from ${src_lang} to ${tgt_lang}: ${file.name}`, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message", false, selectedModel());  // temporary message to indicate progress
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
            <label 
              for="folderInput" 
              id="modelInputLabel" 
              class={selectedModel() === "" ? styles.unselectedModelButton : styles.selectedModelButton}
            >
              {selectedModel() === "" ? "Select Model" : selectedModel()}
            </label>
            <input type="file" id="folderInput" className='hidden' webkitdirectory multiple onChange={setupModel} />
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
            <select name="src_lang" id="src_lang">
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang">
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select>
            <button 
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
