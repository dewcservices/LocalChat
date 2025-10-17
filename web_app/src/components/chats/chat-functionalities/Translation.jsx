import { useContext, createSignal, onMount, createEffect } from 'solid-js';
import { pipeline, env, TranslationPipeline } from '@huggingface/transformers';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { ChatContext } from "../ChatContext";
import styles from './Translation.module.css';
import { parseDocxFileAsync, parseTxtFileAsync, parseHTMLFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModels } from '../../../utils/ModelCache';
import { getChatHistories } from '../../../utils/ChatHistory';
import { getDefaultModel } from '../../../utils/DefaultModels';


function Translation() {

  const chatContext = useContext(ChatContext);
  
  let translator;
  const [modelName, setModelName] = createSignal("");
  const [availableModels, setAvailableModels] = createSignal([], { equals: false });
    // list of models that are already loaded into the cache
  const [languages, setLanguages] = createSignal({});
    // a dictionary of the the languages and their codes (e.g. {"English": "eng_Latn", ...}),
    // provided by browser_config.json
  const [srcLang, setSrcLang] = createSignal("");
  const [tgtLang, setTgtLang] = createSignal("");
  
  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  const [addModelBtnText, setAddModelBtnText] = createSignal("Add Model(s)");

  const driverObj = driver({
    showProgress: true,
    allowHtml: false,
    steps: [
      {
        element: "#addModelBtn",
        popover: {
          title: "Adding Models",
          description: `
            To begin with click here to upload models. 
            Either upload your own models or upload the 'models' folder included in the app distribution.
          `
        }
      },
      {
        element: '#modelSelection',
        popover: {
          title: "Selecting a Model",
          description: `
            Next select a model to translate your text with. 
            For more information see the <A href="/recommendation">model information page</A>.
          `
        }
      },
      {
        element: "#src_lang",
        popover: {
          title: "Source Language",
          description: `Select the language of the input text.`
        }
      },
      {
        element: "#tgt_lang",
        popover: {
          title: "Target Language",
          description: `Select the language to translate to.`
        }
      },
      {
        element: "#tabSwitcher",
        popover: {
          title: "Text or File Input",
          description: `Use the tab switcher to switch between summarising files or text input.`
        }
      },
      {
        element: "#inputTextArea",
        popover: {
          title: "Text/File Input",
          description: `Upload some text or file(s).`
        }
      },
      {
        element: "#sendButton",
        popover: {
          title: "Submit",
          description: `Use the submit button to translate the text.`
        }
      }
    ]
  });

  // this checks cached models for translation.
  onMount(async () => {
    const models = await getCachedModelsNames('translation');
    setAvailableModels(models);

    // this auto-select the default model if one is set in the settings page
    const defaultModel = getDefaultModel('translation');
    if (defaultModel && models.includes(defaultModel)) {
      setModelName(defaultModel);
    }

    let chats = getChatHistories();
    chats = chats.filter(c => c.chatType == 'translation');
    if (chats.length <= 1) driverObj.drive();
  });

  const addModel = async () => {

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;
    setAddModelBtnText("Caching Model");

    let folderElement = document.getElementById("folderInput");
    let files = [...folderElement.files];

    try {
      if (files.length == 0) {
        alert("Empty model directory was selected, please select again.");
        return;
      }

      let configs = files.filter(f => f.name == "browser_config.json");
      if (!configs) {
        alert("Unsupported or Malformed Model (no browser_config.json file found).");
        return;
      }

      configs = configs.filter(async f => JSON.parse(await f.text()).task == "translation");
      if (!configs) {
        alert(`No translation models were provided (each browser_config.json stated a task other than translation).`);
        return;
      }

      let models = await cacheModels(files);
      models = models.filter(mn => mn.task == "translation");
      let modelNames = models.map(mn => mn.modelName);

      // add models to list of available models
      models = availableModels().slice();
      for (let modelName of modelNames) {
        if (!models.includes(modelName)) models.push(modelName);
      }

      setAvailableModels(models);

    } finally { // runs even when returns out of try block
      document.getElementById("folderInput").disabled = false;
      document.getElementById("sendButton").disabled = false;
      setAddModelBtnText("Add Model(s)");
    }
  };

  // load model upon `processor` or `modelName` signal
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

    try {
      translator = await pipeline('translation', modelName(), { device: chatContext.processor() });
      console.log("Finished model setup using", chatContext.processor());

      { // load languages
        let cache = await caches.open('transformers-cache');
        let cacheKeys = await cache.keys();
        let configKey = cacheKeys.filter(k => k.url.includes("browser_config.json") && k.url.includes(modelName()))[0];

        let response = await cache.match(configKey);
        let array = await response.arrayBuffer();
        let config = JSON.parse((new TextDecoder()).decode(array));

        console.log(config.languages);
        setLanguages(config.languages);
      }
    } catch (e) {
      console.log(`Error loading translation model: ${e}`);
      translator = null;
      setLanguages({});
      setModelName("");
      alert(`Failed to load model. Please try again, if issues persist try reloading page.`);
    } finally {
      setAddModelBtnText("Add Model(s)");
      document.getElementById("folderInput").disabled = false;
      document.getElementById("sendButton").disabled = false;
    }
  });

  const translateTextInput = async () => {

    if (modelName() === "") {
      alert("A model must be selected before translating text. Please select a model.");
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

    if (srcLang() == "") {
      alert("Please select a language to translate from.")
      return;
    }

    if (tgtLang() == "") {
      alert("Please select a language to translate to.");
      return;
    }

    chatContext.addMessage(`Translate from ${srcLang()} to ${tgtLang()}: "${userMessage}"`, true);
    inputTextArea.value = "";

    let messageDate = chatContext.addMessage("Generating Message", false, modelName());  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // force a re-render by yielding control back to browser

    try {
      let output = await translator(userMessage, {src_lang: srcLang(), tgt_lang: tgtLang()});
      chatContext.updateMessage(messageDate, output[0].translation_text);
    } catch (e) {
      chatContext.updateMessage(messageDate, 'Error: failed to translate text. Please try again.');
      console.log(`Error occurred translating text: ${e}.`);
    }
  };

  const translateFileInput = async () => {
    
    if (modelName() === "") {
      alert("A model must be selected before translating text. Please select a model.");
      return;
    }
    // TODO improve UX around model loading, promise handling, and error handling
    if (!(translator instanceof TranslationPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    if (srcLang() == "") {
      alert("Please select a language to translate from.")
      return;
    }

    if (tgtLang() == "") {
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

    chatContext.addMessage(`Translate File from ${srcLang()} to ${tgtLang()}: ${file.name}`, true);
    chatContext.addFile(fileContent, file.name);

    let messageDate = chatContext.addMessage("Generating Message", false, modelName());  // temporary message to indicate progress
    await new Promise(resolve => setTimeout(resolve, 0));  // forces a re-render again by yielding control back to the browser

    try {
      let output = await translator(fileContent, {src_lang: srcLang(), tgt_lang: tgtLang()});
      chatContext.updateMessage(messageDate, output[0].translation_text);
    } catch (e) {
      chatContext.updateMessage(messageDate, 'Error: failed to translate text. Please try again.');
      console.log(`Error occurred translating text: ${e}.`);
    }
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

          <div id="tabSwitcher" class={styles.controlsLeft}>
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
            <select 
              id="src_lang"
              name="src_lang" 
              class={styles.selection}
              value={srcLang()} 
              onChange={e => setSrcLang(e.currentTarget.value)}
            >
              <option value="">Select Language</option>
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select
              id="tgt_lang"
              name="tgt_lang" 
              class={styles.selection} 
              style="margin-right: 4vh;"
              value={tgtLang()} 
              onChange={e => setTgtLang(e.currentTarget.value)}
            >
              <option value="">Select Language</option>
              <For each={Object.entries(languages())}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select>

            <select 
              id="modelSelection"
              class={styles.selection} 
              value={modelName()} 
              onChange={e => setModelName(e.currentTarget.value)}
            >
              <option value="">Select Model</option>
              <For each={availableModels()}>{(model) => 
                <option value={model}>{model}</option>
              }</For>
            </select>
            <label 
              id="addModelBtn"
              for="folderInput" 
              class={availableModels().length == 0 ? styles.noModels : styles.addModelButton}
            >
              {addModelBtnText()}
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