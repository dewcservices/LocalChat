import { createSignal } from 'solid-js';
import { pathJoin } from '../utils/PathJoin';
import { pipeline, env } from '@huggingface/transformers';
import modelTestingStyles from './ModelTesting.module.css';

function ModelTesting() {
  const [selectedModels, setSelectedModels] = createSignal([]);

  const defaultUntranslatedText = "Il existe une tendance émergente consistant à mettre en place des modèles linguistiques locaux pour l’analyse des données privées et sensibles.";
  const defaultUntranslatedLanguageCode = "fra_Latn";
  const defaultTranslationTargetLanguageCode = "eng_Latn";

  const [menuIsOpen, setMenuIsOpen] = createSignal([]);
  const [subMenuID, setSubMenuID] = createSignal([]);
  setSubMenuID(0);

  const addModel = async (event) => {
    const files = [...event.target.files];

    // No file added
    if (files.length == 0) {
      return;
    }

    const modelName = files[0].webkitRelativePath.split("/")[0];
    const configFile = files.find(file => file.name == "browser_config.json");
    
    if (!configFile) {
      alert("Unsupported or Malformed Model");
      return;
    }

    // Read config file
    let fileText = await configFile.text();
    fileText = JSON.parse(fileText);

    // Create model JSON to store model.
    const model = {
      name: fileText.modelName,
      files: files,
      modelType: fileText.task,
    };

    console.log(fileText);

    setSelectedModels([...selectedModels(), model]);
    console.log(selectedModels())
  }

  const benchmarkModels = async () => {

    const table = document.getElementById("tableContainer").querySelector("table");

    const tableUploadTimeCol = 1;
    const tableGenerationTimeCol = 2;
    const tableMessageCol = 3;

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    const modelList = selectedModels()

    // Loop through each model, injecting the model into the cache, and running a sample prompt.
    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      const currentRow = table.rows[i+1];

      currentRow.cells[tableUploadTimeCol].innerText = "Uploading";

      // reset browser cache to clear any previous models
      caches.delete('transformers-cache');
      let cache = await caches.open('transformers-cache');

      let startTime = performance.now();

      // Upload models to browsers cache.
      for (let file of model.files) {
  
        let cacheKey = pathJoin(
          env.remoteHost, 
          env.remotePathTemplate
            .replaceAll('{model}', model.name)
            .replaceAll('{revision}', 'main'),
          file.name.endsWith(".onnx") ? 'onnx/' + file.name : file.name
        );

        // Ensure that the models files have been cached properly before moving on.
        // This prevents the app from seeing no files, and trying to request them from hugging face.
        await new Promise((resolve, reject) => {
          let fileReader = new FileReader();
          fileReader.onload = async () => {
            let arrayBuffer = fileReader.result;
            let uint8Array = new Uint8Array(arrayBuffer);
            
            try {
              await cache.put(cacheKey, new Response(uint8Array));
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          fileReader.readAsArrayBuffer(file);
        });
      };
  
      let generator = await pipeline(model.modelType, model.name);

      let endTime = performance.now();
      // Get total time it took for the model to be injected, rounded to 2 decimal places.
      let totalTime = endTime - startTime;
      totalTime = (totalTime / 1000).toFixed(2) + "s";
      currentRow.cells[tableUploadTimeCol].innerText = totalTime;

      currentRow.cells[tableGenerationTimeCol].innerText = "Generating";

      // Ensure that the upload time cell always appears when the upload is finished, and not with the generation time.
      await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));

      let output = "";

      // Check which input needs to be provided for different models.
      // Start and end time are kept within each if statement to ensure the minimal time to use the statement isn't included in benchmark.

      if (model.modelType == "summarization") {

        const textArea = document.getElementById("summarisationTextArea");

        // Get input to test
        let userInput = textArea.value;
        if (textArea == "") {
          userInput = textArea.placeholder;
        }

        // Benchmark the model
        startTime = performance.now();
        output = await generator(userInput, { max_new_tokens: 100});
        endTime = performance.now();
        output = output[0].summary_text;

      } else if (model.modelType == "question-answering") {

        const contextTextArea = document.getElementById("QAContextTextArea");
        const questionTextArea = document.getElementById("QAQuestionTextArea");

        let context = contextTextArea.value;
        if (contextTextArea == "") {
          context = contextTextArea.placeholder;
        }

        let question = questionTextArea.value;
        if (question == "") {
          question = questionTextArea.placeholder;
        }

        startTime = performance.now();
        output = await generator(context, question);
        endTime = performance.now();
        output = output.answer;

      } else if (model.modelType == "translation") {

        startTime = performance.now();
        output = await generator(defaultUntranslatedText, {src_lang: defaultUntranslatedLanguageCode, tgt_lang: defaultTranslationTargetLanguageCode});
        endTime = performance.now();
        console.log(output)
        output = output[0].translation_text;
      }

      totalTime = ((endTime - startTime) / 1000).toFixed(2) + "s";
      currentRow.cells[tableGenerationTimeCol].innerText = totalTime;
      currentRow.cells[tableMessageCol].innerText = output;

      await new Promise(requestAnimationFrame);
    }
  };

  const clearModels = () => {
    setSelectedModels([]);
  };

  const removeModel = (modelName) => {
    setSelectedModels(selectedModels().filter(model => model.name != modelName));
  }

  const toggleAdvancedOptions = () => {
    setMenuIsOpen(!menuIsOpen());
    const btn = document.getElementById("advancedOptionsMenuButton");
    if (menuIsOpen()) {
      btn.innerHTML = "Advanced Options<br />⮟"
    } else {
      btn.innerHTML = "Advanced Options<br />⮝"
    }
  }

  return (
    <>
      <div class={modelTestingStyles.modelTesting}>
        <h2>Model Testing:</h2>
        <h4>Select models to benchmark:</h4>

        <div>
          {/* Select Model/s for benchmarking */}
          <label for="modelInput" id="modelInputLabel" class={modelTestingStyles.inputButton} className='inputButton'>
            Select Models
          </label>
          <input type="file" id="modelInput" className='hidden' webkitdirectory multiple onChange={addModel} />
                      
          <button id="benchmarkButton" class={modelTestingStyles.inputButton} onClick={benchmarkModels}>Benchmark</button>
          <button id="clearButton" class={modelTestingStyles.inputButton} onClick={clearModels}>Clear Models</button>
        </div>

        <div>
          <button class={modelTestingStyles.inputButton} id="advancedOptionsMenuButton" onClick={() => toggleAdvancedOptions()}>Advanced Options<br />⮟</button>
        </div>

        <div class={`${modelTestingStyles.advancedOptionsMenu} ${!menuIsOpen() ? modelTestingStyles.menuOpen : ""}`} id='advancedOptionsMenu'>
          <ul class={modelTestingStyles.optionMenuSubTabs}>
            <li><button onClick={() => setSubMenuID(0)} class={subMenuID() == 0 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>General</button></li>
            <li><button onClick={() => setSubMenuID(1)} class={subMenuID() == 1 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Summarisation</button></li>
            <li><button onClick={() => setSubMenuID(2)} class={subMenuID() == 2 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Question Answering</button></li>
            <li><button onClick={() => setSubMenuID(3)} class={subMenuID() == 3 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Translation</button></li>
          </ul>

          <div id="generalOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 0 }}>General Options</div>

          <div id="summarisationOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 1 }}>
            <h3>Summarisation test input field. Leave blank to use default input.</h3>
            <textarea id="summarisationTextArea" class={modelTestingStyles.inputArea}
            placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
          </div>

          <div id="QAOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 2 }}>
          
            <div>
              <textarea id="QAContextTextArea" class={modelTestingStyles.inputArea}
              placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
            
              <textarea id="QAQuestionTextArea" class={modelTestingStyles.inputArea}
              placeholder="Why can't LLM's be used in the defense industry and what benefits does this technolgy bring?" />
            </div>
          </div>

          <div id="translationOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 3 }}>Data</div>

        </div>

        <div id="tableContainer" class={modelTestingStyles.tableContainer}>
          <table class={modelTestingStyles.tableMMLU}>
            <colgroup>
              <col/>
              <col span="2" class={modelTestingStyles.tableColShrink} />
              <col/>
            </colgroup>
            <thead>
              <tr>
                <th>Model type | Name</th>
                <th>Upload Time</th>
                <th>Generation Time</th>
                <th>Sample Output</th>
              </tr>
            </thead>
            <tbody>
              <For each={selectedModels()}>{(model) =>
                <tr>
                  <td><span class={modelTestingStyles.modelName} onClick={() => removeModel(model.name)}>{model.modelType + " | " + model.name}</span></td>
                  <td></td> {/* Upload Time Cell */}
                  <td></td> {/* Generation Time Cell */}
                  <td></td> {/* Sample Output Cell */}
                </tr>
              }</For>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default ModelTesting;
