import { useContext, createSignal, createEffect, onMount, Match, Switch } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';

import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModel } from '../../../utils/ModelCache';


function QuestionAnswer() {
  
  const chatContext = useContext(ChatContext);
  
  let qaPipeline;
  const [modelName, setModelName] = createSignal("");
  const [availableModels, setAvailableModels] = createSignal([], {equals: false});
    // list of models that are already loaded into the cache

  const [contextTab, setContextTab] = createSignal("text");
  const [addModelBtnText, setAddModelBtnText] = createSignal("Add Model");

  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('question-answering'));
  });

  const addModel = async () => {

    document.getElementById("folderInput").disabled = true;
    document.getElementById("sendButton").disabled = true;
    setAddModelBtnText("Cacheing Model");

    let folderElement = document.getElementById("folderInput");
    let files = [...folderElement.files];

    // TODO improve UX
    if (files.length == 0) {
      alert("Empty model directory was selected, please select again."); 
    }
    else if (!files.find(f => f.name == "browser_config.json")) {
      alert("Unsupported or Malformed Model");
    }
    else if (JSON.parse(await files.find(f => f.name == "browser_config.json").text()).task != "question-answering") {
      alert(`Must be a question & answer model. browser_config.json states that the model is for a different task.`);
    }
    else {
      let model = await cacheModel(files);

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

    try {
      qaPipeline = await pipeline('question-answering', modelName(), { device: chatContext.processor() });
      console.log("Finished model setup using", chatContext.processor());
    } catch (e) {
      console.log(`Error loading model: ${e}`);
      qaPipeline = null;
      setModelName('');
      alert(`Failed to load model. Please try again, if issues persist try reloading page.`);
    } finally {
      setAddModelBtnText("Add Model");
      document.getElementById("folderInput").disabled = false;
      document.getElementById("sendButton").disabled = false;
    }
  });
 
  const processQuestion = async () => {

    if (modelName() == "") {
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
    
    try {
      let output = await qaPipeline(question, context);
      chatContext.addMessage(output.answer, false, modelName());
    } catch (e) {
      chatContext.addMessage(`Error: failed to process question. Please try again.`, false, modelName());
      console.log(`Error occurred processing question text: ${e}.`);
    }
    
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
          <select 
            class={styles.modelSelection} 
            value={modelName()}
            onChange={e => setModelName(e.currentTarget.value)}
          >
            <option value="">Select Model</option>
            <For each={availableModels()}>{(modelName) => 
              <option value={modelName}>{modelName}</option>
            }</For>
          </select>
          <label 
            for="folderInput" 
            class={availableModels().length == 0 ? styles.noModels : styles.addModelButton}
          >
            {addModelBtnText()}
          </label>
          <input type="file" id="folderInput" class="hidden" webkitdirectory multiple onChange={addModel} />
          <button id="sendButton" class={styles.sendButton} onClick={processQuestion}>Send</button>
        </div>

      </div>
    </>
  );
}

export default QuestionAnswer;
