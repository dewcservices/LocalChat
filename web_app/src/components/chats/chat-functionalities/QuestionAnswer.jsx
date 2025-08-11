import { useContext, createSignal, Match, Switch } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';

import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { pathJoin } from '../../../utils/PathJoin';


function QuestionAnswer() {
  
  const chatContext = useContext(ChatContext);
  const [contextTab, setContextTab] = createSignal("text");
  const [selectedModel, setSelectedModel] = createSignal("");
  
  let qaPipeline;
  const setupModel = async () => {

    // disable uploading another model, and change the text to indicate a model is being loaded.
    document.getElementById("folderInput").disabled = true;
    const modelUploadLabel = document.getElementById("modelInputLabel");
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

    if (config.task !== "question_answer") {
      alert(`Must be a question & answer model. browser_config.json states that the model is for ${config.task}.`);
      modelUploadLabel.innerText = "Select Model";
      document.getElementById("folderInput").disabled = false;
      return;
    }

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

    qaPipeline = await pipeline('question-answering', config.modelName, { device: device });
    console.log("Finished model setup using", device);
    
    // Re-enable uploading another model.
    document.getElementById("folderInput").disabled = false;
    modelUploadLabel.innerText = config.modelName;
  };
 
  const processQuestion = async () => {
    if (selectedModel() == "") {
      alert("A model must be selected before answering questions. Please select a model.");
      return;
    }
    if (!(qaPipeline instanceof QuestionAnsweringPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }
    
    let context = '';
    if (contextTab() === 'text') {
      let contextTextarea = document.getElementById('contextTextarea');
      context = contextTextarea.value;
    } else if (contextTab() === 'file') {
      let fileInput = document.getElementById("fileInput");
      let file = fileInput.files[0];
      context = "";
      if (file.name.endsWith('.txt')) {
        context = await parseTxtFileAsync(file);
      }
      if (file.name.endsWith('.html')) {
        context = await parseHTMLFileAsync(file);
      }
      if (file.name.endsWith('.docx')) {
        context = await parseDocxFileAsync(file);
      }
    }
    
    let question = document.getElementById('questionTextarea').value;
    
    if (context == '' || question == '') {
      alert('Must provide context and question.');
      return;
    }
    
    chatContext.addMessage(`Context: ${context}`, true);
    chatContext.addMessage(`Question: ${question}`, true);
    
    let output = await qaPipeline(question, context);
    chatContext.addMessage(output.answer, false, selectedModel());
    
    document.getElementById('questionTextarea').value = '';
  };

  return (
    <>
      <div class={styles.inputContainer}>
        <div class={styles.contextContainer}>
          <div class={styles.tabContainer}>
            <button
              class={contextTab() === "file" ? styles.selectedTab : styles.tab}
              onClick={() => setContextTab("file")}
            >
              File Context
            </button>
            <button
              class={contextTab() === "text" ? styles.selectedTab : styles.tab}
              onClick={() => setContextTab("text")}
            >
              Text Context
            </button>
          </div>
          <Switch>
            <Match when={contextTab() === "text"}>
              <textarea id="contextTextarea" placeholder='Enter context here. Answer will be based on the context provided.'></textarea>
            </Match>
            <Match when={contextTab() === "file"}>
              <input type="file" id="fileInput" accept=".txt, .html, .docx" />
            </Match>
          </Switch>
        </div>
        
        <div class={styles.questionContainer}>
          <div class={styles.tabContainer}>
            <button class={styles.selectedTab}>Question:</button>
          </div>
          <div class={styles.questionSection}>
            <textarea
              id="questionTextarea"
              placeholder='Enter question here.'
              onKeyDown={p_holder => {
                if (p_holder.key === 'Enter' && !p_holder.shiftKey) {
                  p_holder.preventDefault();
                  processQuestion();
                }
              }}
            />
            <label 
              for="folderInput" 
              id="modelInputLabel" 
              class={selectedModel() === "" ? styles.unselectedModelButton : styles.selectedModelButton}
            >
              {selectedModel() === "" ? "Select Model" : selectedModel()}
            </label>
            <input type="file" id="folderInput" class={styles.hidden} webkitdirectory multiple onChange={setupModel} />
            <button class={styles.sendButton} onClick={processQuestion}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuestionAnswer;