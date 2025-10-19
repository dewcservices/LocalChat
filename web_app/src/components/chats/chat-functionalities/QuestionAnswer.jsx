import { useContext, createSignal, createEffect, onMount, Match, Switch } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';
import { getCachedModelsNames, cacheModels } from '../../../utils/ModelCache';
import { getChatHistories } from '../../../utils/ChatHistory';


function QuestionAnswer() {
  
  const chatContext = useContext(ChatContext);
  
  let qaPipeline;
  const [modelName, setModelName] = createSignal("");
  const [availableModels, setAvailableModels] = createSignal([], {equals: false});
    // list of models that are already loaded into the cache

  const [contextTab, setContextTab] = createSignal("text");
  const [addModelBtnText, setAddModelBtnText] = createSignal("Add Model(s)");

  // Q&A Tour
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
            Next select a model. 
            For more information see the <A href="/recommendation">model information page</A>.
          `
        }
      },
      {
        element: '#processorSelector',
        popover: {
          title: "Choosing a processor",
          description: `
            If you want to use a GPU, choose the button here if it isn't grayed out. This will require reprocessing any selected models, which may take several minutes.
          `
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
        element: "#contextTextarea",
        popover: {
          title: "Context Input",
          description: `
            The question-answering models require that context is provided to derive the answer from.
            Enter the context here.
          `
        }
      },
      {
        element: "#questionTextarea",
        popover: {
          title: "Question Input",
          description: `Insert the question here.`
        }
      },
      {
        element: "#sendButton",
        popover: {
          title: "Submit",
          description: `Use the submit button to process the question.`
        }
      },
      {
        element: "#redoTutorial",
        popover: {
          title: "Re-open tutorial",
          description: `That's the end of this tutorial. If you ever need it again, click this button here.`,
          side: "right"
        }
      }
    ]
  });

  onMount(async () => {
    setAvailableModels(await getCachedModelsNames('question-answering'));

    let tutorialSaves = JSON.parse(localStorage.getItem("tutorials")) || {};
    if (!tutorialSaves["question-answering"]) {
      driverObj.drive();
      tutorialSaves["question-answering"] = true;
      localStorage.setItem("tutorials", JSON.stringify(tutorialSaves));
    }
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

      configs = configs.filter(async f => JSON.parse(await f.text()).task == "question-answering");
      if (!configs) {
        alert(`No question-answering models were provided (each browser_config.json stated a task other than question-answering).`);
        return;
      }

      let models = await cacheModels(files);
      models = models.filter(mn => mn.task == "question-answering");
      let modelNames = models.map(mn => mn.modelName);

      // add models to list of available models
      models = availableModels().slice();
      for (let modelName of modelNames) {
        if (!models.includes(modelName)) models.push(modelName);
      }

      setAvailableModels(models);

    } finally {
      document.getElementById("folderInput").disabled = false;
      document.getElementById("sendButton").disabled = false;
      setAddModelBtnText("Add Model(s)");
    }
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
      setAddModelBtnText("Add Model(s)");
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
          <div id="tabSwitcher" class={styles.tabContainer}>
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
          <button
            id="redoTutorial"
            class={styles.addModelButton}
            onClick={() => driverObj.drive()}
          >
            Redo tutorial
          </button>
          <select 
            id="modelSelection"
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
            id="addModelBtn"
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
