import { useContext, createSignal } from 'solid-js';
import { pipeline, env, SummarizationPipeline } from '@huggingface/transformers';

import { ChatContext } from '../ChatContext';
import styles from './Summarize.module.css';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { pathJoin } from '../../../utils/PathJoin';


function Summarize() {

  const chatContext = useContext(ChatContext);
  const [selectedModel, setSelectedModel] = createSignal("");

  let generator;

  const [tab, setTab] = createSignal("text");
  const [hoveredTab, setHoveredTab] = createSignal(null);

  const setupModel = async () => {

    // disable uploading another model, and change the text to indicate a model is being loaded.
    document.getElementById("folderInput").disabled = true;
    const modelUploadLabel = document.getElementById("modelInputLabel");
    modelUploadLabel.classList.add(styles.disabledLabel);
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
    
    let fileText = await configFile.text();
    fileText = JSON.parse(fileText);

    setSelectedModel(fileText.fileName);
    console.log(selectedModel());
    
    for (let file of files) {

      let cacheKey = pathJoin(
        env.remoteHost, 
        env.remotePathTemplate
          .replaceAll('{model}', selectedModel())
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

    generator = await pipeline('summarization', selectedModel(), { device: device });
    console.log("Finished model setup using", device);
    
    // Re-enable uploading another model.
    document.getElementById("folderInput").disabled = false;
    modelUploadLabel.classList.remove(styles.disabledLabel);
    modelUploadLabel.innerText = selectedModel();
  };

  const summarizeTextInput = async () => {
    if (selectedModel() == "") {
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

    let messageDate = chatContext.addMessage("Generating Message...", false, selectedModel());  // temporary message to indicate progress
    // force a re-render by yielding control back to browser
    await new Promise(resolve => setTimeout(resolve, 0));
    
    let output = await generator(userMessage, { max_new_tokens: 100});  // generate response
    chatContext.updateMessage(messageDate, output[0].summary_text);  // update temp message to response
  };

  const summarizeFileInput = async () => {
    if (selectedModel() == "") {
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

    let messageDate = chatContext.addMessage("Generating Message...", false, selectedModel());  // temporary message to indicate progress
    // forces a re-render again by yielding control back to the browser
    await new Promise(resolve => setTimeout(resolve, 0));
    
    let output = await generator(fileContent, { max_new_tokens: 100});  // generate response
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
              <input type="file" id="fileInput" accept=".txt, .html., .docx" onChange={summarizeFileInput} />
            </div>
          </Match>
        </Switch>

        {/* Control buttons row - moved to bottom */}
        <div class={styles.controlsContainer}>
          <div class={styles.controlsLeft}>
            <label for="folderInput" id="modelInputLabel" class={selectedModel() === "" ? styles.unselectedModelButton : styles.selectedModelButton}>
              {selectedModel() === "" ? "Select Model" : selectedModel()}
            </label>
            <input type="file" id="folderInput" class={styles.hidden} webkitdirectory multiple onChange={setupModel} />
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
          <div class={styles.controlsRight}>
            {tab() === "text" && (
              <button 
                onClick={summarizeTextInput} 
                class={styles.sendButton}
              >
                Send
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

export default Summarize;