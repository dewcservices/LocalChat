import { useContext, createSignal, onMount, Match, Switch } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';

import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModel } from '../../../utils/ModelCache';


function QuestionAnswer() {
  
  const chatContext = useContext(ChatContext);
  const [contextTab, setContextTab] = createSignal("text");
  const [availableModels, setAvailableModels] = createSignal([], {equals: false});
  
  let qaPipeline;

  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('question_answer'));
  });

  const addModel = async () => {

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;

    let modelUploadLabel = document.getElementById("modelInputLabel");
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
    else if (JSON.parse(await files.find(f => f.name == "browser_config.json").text()).task != "question_answer") {
      alert(`Must be a question & answer model. browser_config.json states that the model is for a different task.`);
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

    qaPipeline = await pipeline('question-answering', event.target.value, { device: chatContext.processor() });
    console.log("Finished model setup using", chatContext.processor());

    modelUploadLabel.innerText = "Add Model";
    document.getElementById("folderInput").disabled = false;
    document.getElementById("sendButton").disabled = false;
  };
 
  const processQuestion = async () => {
    let selectedModel = document.getElementById("modelSelection").value;

    if (selectedModel == "") {
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
      else if (file.name.endsWith('.html')) {
        context = await parseHTMLFileAsync(file);
      }
      else if (file.name.endsWith('.docx')) {
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
    chatContext.addMessage(output.answer, false, selectedModel);
    
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
          </div>
        </div>

        <div class={styles.controlsLeft}></div>
        <div class={styles.controlsRight}>
          {/* <label for="modelSelection">Model: </label> */}
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
          <button id="sendButton" class={styles.sendButton} onClick={processQuestion}>Send</button>
        </div>

      </div>
    </>
  );
}

export default QuestionAnswer;
