import { createSignal, For, onMount, createMemo } from 'solid-js';
import { pathJoin } from '../utils/PathJoin';
import { pipeline, env,  } from '@huggingface/transformers';
import modelTestingStyles from './ModelTesting.module.css';
import { modelBenchmarks } from './modelBenchmarks.js';
import { classList } from 'solid-js/web';
import * as ort from 'onnxruntime-web';

function filterForModels(models, allModels = false) {

  if (allModels) {
    return models
  } else {
    const qualitySortedModels = models.sort((a,b) => b.quality - a.quality);

    if (qualitySortedModels.length <= 5) {
      return qualitySortedModels
    } else {
      const top4Quality = qualitySortedModels.slice(0,4);
      let otherModels = qualitySortedModels.filter(m => !top4Quality.includes(m));
      
      let fastestFifthModel = null;
      const speedTiers = ["fast","average","slow"];
      for (const tier of speedTiers) {
        let speedModels = otherModels.filter(m => m.inference_tier == tier);

        if (speedModels.length > 0) {
          const qualitySpeedModels = speedModels.sort((a,b) => b.quality - a.quality);
          fastestFifthModel = qualitySpeedModels[0];
          break;
        }
      }
      return [...top4Quality, fastestFifthModel];
    }
  }
}

function changeRecommendingAllModels(modelTypes, status) {
  let models = {}
  for (const modelType of modelTypes) {
    models[modelType] = filterForModels(modelBenchmarks[modelType], status);
  }
  return models
}

function ModelTesting() {
  const [selectedModels, setSelectedModels] = createSignal([]);
  
  const speedTiers = {"fast":5,"average":10,"slow":15};
  const defaultLanguages = ["English","French"];
  const [shownLanguages, setShownLanguages] = createSignal([...defaultLanguages]);
  let currentLanguageOption = "unionLanguages";

  const [sortedDefaultModels, setSortedDefaultModels] = createSignal([]);
  let filteredModels = {}
  const allowedModelTypes = ["summarization","question-answering","translation"];
  setSortedDefaultModels(changeRecommendingAllModels(allowedModelTypes, false));


  const [sortingState, setSortingState] = createSignal({type:null,col:null,order:"desc"})

  const [defaultRecommendationType, setDefaultRecommendationType] = createSignal(allowedModelTypes[0]);

  const [menuIsOpen, setMenuIsOpen] = createSignal([]);
  const [subMenuID, setSubMenuID] = createSignal([]);
  setSubMenuID(0);

  // Variable to store most recent benchmarking data.
  const [benchmarkData, setBenchmarkData] = createSignal([]);
  
  const [recommenedModels, setRecommendedModels] = createSignal([]);

  const [processor, setProcessor] = createSignal("wasm");
  setProcessor("wasm");

  const addModel = async (event) => {
    const files = [...event.target.files];

    console.log(files);
    // No file added
    if (files.length == 0) {
      return;
    }

    const configFile = files.find(file => file.name == "browser_config.json");
    
    if (!configFile) {
      alert("Unsupported or Malformed Model");
      return;
    }

    // Read config file
    let fileText = await configFile.text();
    fileText = JSON.parse(fileText);

    // Check if model type is supported for benchmarking
    if (!allowedModelTypes.find((element) => element == fileText.task)) {
      alert("Model type '" + fileText.task + "' not supported for benchmarking");
      return;
    }

    // Create model JSON to store model.
    const model = {
      name: fileText.modelName,
      files: files,
      modelType: fileText.task,
      languages: fileText.languages,
    };

    setSelectedModels([...selectedModels(), model]);

    // Reset the input incase the model is removed and needs to be re-added.
    event.target.value = "";

    adjustLanguageVisibility({ target: { id: currentLanguageOption } });
  }

  const benchmarkModels = async () => {

    const table = document.getElementById("tableContainer").querySelector("table");

    const tableUploadTimeCol = 1;
    const tableGenerationTimeCol = 2;
    const tableMessageCol = 3;

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    let globalModelRunCount = Math.round(document.getElementById("globalBenchmarkRunCount").value);
    if (globalModelRunCount <= 1) {
      globalModelRunCount = 1;
    }

    const modelList = selectedModels();

    let sortedModels = [];

    // Sort models to be in same order as table.
    for (const type of allowedModelTypes) {
      const modelsOfType = modelList.filter(m => m.modelType == type);
      sortedModels.push(...modelsOfType);
    }

    if (sortedModels.length > 0) {
      setBenchmarkData([]);
    }

    let startTime;
    let endTime;
    let totalTime;

    document.getElementById("modelInput").disabled = true;
    document.getElementById("modelInputLabel").setAttribute("disabled","disabled");
    document.getElementById("benchmarkButton").disabled = true;
    document.getElementById("clearButton").disabled = true;


    let rowIndex = 1;

    // Loop through each model, injecting the model into the cache, and running a sample prompt.
    for (let i = 0; i < sortedModels.length; i++) {
      const model = sortedModels[i];
      rowIndex++;

      if (table.rows[rowIndex].children.length == 1) {
        rowIndex++;
      }

      let currentRow = table.rows[rowIndex];

      table.rows[rowIndex].classList.remove(modelTestingStyles.currentTableRow);
      currentRow.classList.add(modelTestingStyles.currentTableRow);

      let generator;
      currentRow.cells[tableUploadTimeCol].innerText = "Uploading: 0/" + globalModelRunCount;

      // reset browser cache to clear any previous models
      await caches.delete('transformers-cache');
      let cache = await caches.open('transformers-cache');

      // Run the model multiple times based on the global model run count
      for (let j = 1; j < (globalModelRunCount + 1); j++) {

        if (generator) {

          if (generator.session) {
            await generator.session.release();
          }

          try {
            await generator.dispose();
          } catch (error) {
            console.warn(error);
          }
          generator = null;
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        startTime = performance.now();

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
    
        // Create pipeline for the generator;
        try {
          generator = await pipeline(model.modelType, model.name, { device: processor() });
        } catch (error) {
          generator = null;
          console.log(error);
          continue;
        }
        

        endTime = performance.now();

        // Get total time it took for the model to be injected
        totalTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));
        console.log(totalTime)
        // Get benchmark data
        let timings = {...benchmarkData()};
        
        // Create a new space for this models timings if it doesnt yet exist.
        if (!timings[model.name + "-Upload"]) {
          timings[model.name + "-Upload"] = [];
        }

        // Add the new benchmark time and set the benchmarking data to this new data.
        timings[model.name + "-Upload"].push(totalTime);
        setBenchmarkData(timings);
        
        currentRow.cells[tableUploadTimeCol].innerText = "Uploading: " + j + "/" + globalModelRunCount;
        await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
      }

      let totalUploadTimes = benchmarkData()[model.name + "-Upload"];

      if (generator == null) {
        currentRow.cells[tableUploadTimeCol].innerText = "pipeline creation failed";
        continue;
      }

      // Get the average upload time by using the reduce pattern to sum and then divide by total amount.
      let avgUploadTime = totalUploadTimes.reduce((a, b) => a + b) / totalUploadTimes.length;

      totalTime = avgUploadTime.toFixed(2) + "s";
      currentRow.cells[tableUploadTimeCol].innerText = totalTime;
      currentRow.cells[tableUploadTimeCol].title = totalUploadTimes;


      // Display the text for generating the model in the table cell
      currentRow.cells[tableGenerationTimeCol].innerText = "Generating 0/" + globalModelRunCount;

      // Ensure that the upload time cell always appears when the upload is finished, and not with the generation time.
      await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));

      let output = "";

      // Run generation code multiple times based on the model run count.
      for (let j = 1; j < (globalModelRunCount + 1); j++) {

        // Check which input needs to be provided for different models.
        // Start and end time are kept within each if statement to ensure the minimal time to use the statement isn't included in benchmark.
        if (model.modelType == "summarization") {

          const textArea = document.getElementById("summarisationTextArea");

          // Get input to test.
          let userInput = textArea.value;
          if (userInput == "") {
            userInput = textArea.placeholder;
          }

          // Benchmark the model.
          startTime = performance.now();

          // Generate model output
          try {
            output = await generator(userInput, { max_new_tokens: 100});
          } catch (error) {
            console.log(error);
            output == null;
            continue;
          }
          
          endTime = performance.now();
          output = output[0].summary_text;

        } else if (model.modelType == "question-answering") {

          const contextTextArea = document.getElementById("QAContextTextArea");
          const questionTextArea = document.getElementById("QAQuestionTextArea");

          // Get context and question user inputs, or use default.
          let context = contextTextArea.value;
          if (context == "") {
            context = contextTextArea.placeholder;
          }

          let question = questionTextArea.value;
          if (question == "") {
            question = questionTextArea.placeholder;
          }

          // Benchmark the model.
          startTime = performance.now();

          // Generate model output
          try {
            output = await generator(context, question);
          } catch (error) {
            console.log(error);
            output == null;
            continue;
          }
          
          endTime = performance.now();
          output = output.answer;

        } else if (model.modelType == "translation") {

          const textArea = document.getElementById("translationTextArea");
          const fromLanguage = document.getElementById("src_lang").value;
          const toLanguage = document.getElementById("tgt_lang").value;

          // Get the language codes associated with the chosen languages.
          let modelFromLanguageCode = model.languages[fromLanguage];
          let modelToLanguageCode = model.languages[toLanguage];

          if (!modelFromLanguageCode || !modelToLanguageCode) {
            currentRow.cells[tableGenerationTimeCol].innerText = "N/A";
            currentRow.cells[tableMessageCol].innerText = "Language/s Unavailable";
            continue;
          }

          // Get user input and languages, or use default.
          let userInput = textArea.value;
          if (userInput == "") {
            userInput = textArea.placeholder;
          }

          // Benchmark the model
          startTime = performance.now();

          // Generate model output
          try {
            output = await generator(userInput, {src_lang: modelFromLanguageCode, tgt_lang: modelToLanguageCode});
          } catch (error) {
            console.log(error);
            output == null;
            continue;
          }
          
          endTime = performance.now();
          output = output[0].translation_text;
        }

        // Get benchmark data
        let timings = {...benchmarkData()};
        
        // Create a new space for this models timings if it doesnt yet exist.
        if (!timings[model.name + "-Generate"]) {
          timings[model.name + "-Generate"] = [];
        }

        // Add the new benchmark time and set the benchmarking data to this new data.
        totalTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));

        timings[model.name + "-Generate"].push(totalTime);
        setBenchmarkData(timings);

        currentRow.cells[tableGenerationTimeCol].innerText = "Generating: " + j + "/" + globalModelRunCount;
        await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
      }

      let totalGenerationTimes = benchmarkData()[model.name + "-Generate"];

      if (totalGenerationTimes) {
        // Get the average generation time by using the reduce pattern to sum and then divide by total amount.
        let avgGenerationTime = totalGenerationTimes.reduce((a, b) => a + b) / totalGenerationTimes.length;

        totalTime = (avgGenerationTime).toFixed(2) + "s";
        currentRow.cells[tableGenerationTimeCol].innerText = totalTime;
        currentRow.cells[tableGenerationTimeCol].title = totalGenerationTimes;
        currentRow.cells[tableMessageCol].innerText = output;
      } else {
        currentRow.cells[tableGenerationTimeCol].innerText = "Model Generation Failed";
      }
      
      currentRow.classList.remove(modelTestingStyles.currentTableRow);  

      // Remove the pipeline to prevent any errors when switching to the next model.
      generator.dispose();

      await new Promise(requestAnimationFrame);
    }

    // Undisable the buttons
    document.getElementById("modelInput").disabled = false;
    document.getElementById("modelInputLabel").removeAttribute("disabled");
    document.getElementById("benchmarkButton").disabled = false;
    document.getElementById("clearButton").disabled = false;

  };

  const clearModels = () => {
    setSelectedModels([]);
  };

  const removeModel = (modelName) => {
    setSelectedModels(selectedModels().filter(model => model.name != modelName));
  }

  const toggleAdvancedOptions = () => {
    setMenuIsOpen(!menuIsOpen());
  }

  const copyTable = () => {
    const table = document.getElementById("tableContainer").querySelector("table");

    let tableString = "";
    // Table Structure: Model Name, Model Type, Upload Time, Generation Time, Sample Output.

    tableString += "Model Name\tModel Type\tUpload Times\tGeneration Times\tAVG Upload Time\tAVG Generation Time";

    let currentModelType = ""
    for (let i = 1; i < table.rows.length; i++) {
      let row = table.rows[i];

      if (row.children.length > 1) {
        tableString += "\n"
        tableString += row.cells[0].querySelector("span").innerHTML + "\t";  // Model Name
        tableString += currentModelType + "\t";  // Model Name
        tableString += row.cells[1].title + "\t";  // Upload Times
        tableString += row.cells[2].title + "\t";  // Generation Times
        tableString += row.cells[1].innerHTML + "\t";  // AVG Upload Time
        tableString += row.cells[2].innerHTML + "\t";  // AVG Generation Time
      } else {
        currentModelType = row.firstChild.firstChild.querySelector("span").innerHTML
      }
      
      
    }

    console.log(tableString);

    navigator.clipboard.writeText(tableString);
  }

  const getModelTimes = (modelType, uploadTime, inferenceTime) => {
    const originalModels = modelBenchmarks[modelType];

    const updatedModels = originalModels
      .map(model => ({
        ...model,
        upload_time: model.upload_time * uploadTime,
        infer_time: model.infer_time * inferenceTime,
      }))
      .sort((a,b) => {
        if (a.quality !== b.quality) {
          return b.quality - a.quality;
        }
        return a.infer_time - b.infer_time;
      });

    return updatedModels;

  }

  const adjustLanguageVisibility = (e) => {
    //console.log(e.target.id);
    currentLanguageOption = e.target.id;

    let languages = [...defaultLanguages];
    if (e.target.id == "allLanguages") {
      for (let i = 0; i < selectedModels().length; i++) {

        if (selectedModels()[i].modelType != "translation") {
          continue;
        }

        let modelLanguages = selectedModels()[i].languages;

        for (const [key, value] of Object.entries(modelLanguages)) {
          if (!languages.includes(key)) {
            languages.push(key);
          }
        }
      }

    } else if (e.target.id == "unionLanguages") {
      let firstModel = true;
      for (let i = 0; i < selectedModels().length; i++) {

        if (selectedModels()[i].modelType != "translation") {
          continue;
        }

        let modelLanguages = selectedModels()[i].languages;

        if (firstModel) {
          languages = Object.keys(modelLanguages);
          firstModel = false;
        } else {
          languages = languages.filter(language => Object.keys(modelLanguages).includes(language));
        }
      }
    }
 
    languages.sort();

    setShownLanguages(languages);
    //console.log(shownLanguages());
  }

  const sortTable = (modelType, columnType) => {
    setSortedDefaultModels(data => {

      const newData = {...data};

      // Toggle the sorting state if the current column was just sorted for the opposite type, otherwise default to descending.
      let nextSortingState = "desc";
      if (sortingState()["col"] == columnType) {
        nextSortingState = sortingState()["order"] == "desc" ? "asc" : "desc";
      }
      setSortingState({type:modelType,col:columnType,order:nextSortingState});

      if (columnType == "Name") {
        newData[modelType] = [...newData[modelType]].sort((a, b) => {
          if (a.name < b.name) {return nextSortingState == "desc" ? -1 : 1}
          if (a.name > b.name) {return nextSortingState == "desc" ? 1 : -1}
        });
      } else if (columnType == "Quality") {
        newData[modelType] = [...newData[modelType]].sort((a, b) => nextSortingState == "desc" ? b.quality - a.quality : a.quality - b.quality);
      } else if (columnType == "FileSize") {
        newData[modelType] = [...newData[modelType]].sort((a, b) => nextSortingState == "desc" ? b.file_size - a.file_size : a.file_size - b.file_size);
      } else if (columnType == "Upload") {
        newData[modelType] = [...newData[modelType]].sort((a, b) => {
          const aValue = speedTiers[a.upload_tier];
          const bValue = speedTiers[b.upload_tier];
          return nextSortingState == "desc" ? bValue - aValue : aValue - bValue
        });
      } else if (columnType == "Generation") {
        newData[modelType] = [...newData[modelType]].sort((a, b) => {
          const aValue = speedTiers[a.inference_tier];
          const bValue = speedTiers[b.inference_tier];
          return nextSortingState == "desc" ? bValue - aValue : aValue - bValue
        });
      }

      return newData;
    })
  }

  // Change the active processor.
  const changeProcessor = (newProcessor) => {
    if (processor() == newProcessor) return;

    console.log("Switching to", newProcessor);
    setProcessor(newProcessor);
  };

  onMount(async () => {

    //console.log(navigator.hardwareConcurrency);
    //console.log(navigator.deviceMemory);

    if (!navigator.gpu) return;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter !== null) {
        document.getElementById("GPUButton").disabled = false;
        document.getElementById("GPUButton").title = "Swap to using GPU";
      }
    } catch {
      console.warn("Error detecting GPU, defaulting to using CPU.");
    }
  });

  return (
    <>
    <div class={modelTestingStyles.modelTesting}>
        <h2>Model Recommendations</h2>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ul class={modelTestingStyles.optionMenuSubTabs}>
              <For each={allowedModelTypes}>{(type) =>
                <li><button onClick={() => setDefaultRecommendationType(type)} class={defaultRecommendationType() == type ? modelTestingStyles.selectedOptionMenuSubTab : ""}>{type.charAt(0).toUpperCase() + type.slice(1)}</button></li>
              }</For>
            </ul>
            
            <div>
              <label for="includeAllModels">Show filtered model list: </label>
              <input id="includeAllModels" type="checkbox" checked="true" onChange={(e) => setSortedDefaultModels(changeRecommendingAllModels(allowedModelTypes, !e.target.checked))}></input>
            </div>
            
          </div>

          <For each={allowedModelTypes}>{(type) =>
            <div id={type + "RecommendationSubmenu"} class={modelTestingStyles.defaultRecommendationMenu} classList={{ hidden: defaultRecommendationType() !== type}}>
              <table class={modelTestingStyles.tableMMLU}>
                <colgroup>
                  <col style="width: 25vw;" />
                </colgroup>
                <thead>
                  <tr>
                    <th rowspan="2"><button id onClick={() => sortTable(type, "Name")}>Model Information {sortingState().col == "Name" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                    <th rowspan="2"><button onClick={() => sortTable(type, "Quality")}>Output Quality {sortingState().col == "Quality" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                    <th rowspan="2"><button onClick={() => sortTable(type, "FileSize")}>File Size {sortingState().col == "FileSize" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                    <th rowspan="2"><button onClick={() => sortTable(type, "Upload")}>Upload Time Teir {sortingState().col == "Upload" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                    <th rowspan="2"><button onClick={() => sortTable(type, "Generation")}>Run Time Teir {sortingState().col == "Generation" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={sortedDefaultModels()[type]}>{(model) => 
                    <tr>
                      <td>
                        <b>{model.name}</b><br/>
                        <span>One line about model</span></td>
                      <td>{model.quality} / 10</td>
                      <td>{model.file_size} GB</td> 
                      <td
                        class={
                          model.upload_tier == "fast" ? modelTestingStyles.fastTierModel : "" +
                          model.upload_tier == "average" ? modelTestingStyles.averageTierModel : "" +
                          model.upload_tier == "slow" ? modelTestingStyles.slowTierModel : ""
                        }
                      >{model.upload_tier}</td> 
                      <td
                        class={
                          model.inference_tier == "fast" ? modelTestingStyles.fastTierModel : "" +
                          model.inference_tier == "average" ? modelTestingStyles.averageTierModel : "" +
                          model.inference_tier == "slow" ? modelTestingStyles.slowTierModel : ""
                        }>
                        {model.inference_tier}</td> 
                    </tr>
                  }</For>
                </tbody>
              </table>
            </div>
          }</For>
        </div>
      </div>

      <div class={modelTestingStyles.modelTesting}>
        <h2>Model Testing</h2>
        <h4>Select models to benchmark</h4>

        <div class={modelTestingStyles.benchmarkingButtons}>
          <div class={modelTestingStyles.leftButtons}>
            {/* Select Model/s for benchmarking */}
            <input type="file" id="modelInput" className='hidden' webkitdirectory multiple onChange={addModel} />
            <label for="modelInput" id="modelInputLabel" class={modelTestingStyles.inputButton} className='inputButton'>
              Select Models
            </label>
                        
            <button id="benchmarkButton" class={modelTestingStyles.inputButton} onClick={benchmarkModels} disabled={selectedModels().length < 1} classList={{ hidden: selectedModels().length == 0}}>Benchmark</button>
          </div>
          <div class={modelTestingStyles.rightButtons}>
            <button id="clearButton" class={modelTestingStyles.inputButton} onClick={clearModels } disabled={selectedModels().length < 1} classList={{ hidden: selectedModels().length == 0}}>Clear Models</button>
            <button class={modelTestingStyles.inputButton} id="advancedOptionsMenuButton" onClick={() => toggleAdvancedOptions()} classList={{ hidden: selectedModels().length == 0}}>⚙︎</button>
          </div>
        </div>

        <div class={`${modelTestingStyles.advancedOptionsMenu} ${!menuIsOpen() ? "" : modelTestingStyles.menuClosed}`} id='advancedOptionsMenu'>
          <ul class={modelTestingStyles.optionMenuSubTabs}>
            <li><button onClick={() => setSubMenuID(0)} class={subMenuID() == 0 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>General</button></li>
            <li><button onClick={() => setSubMenuID(1)} class={subMenuID() == 1 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Summarisation</button></li>
            <li><button onClick={() => setSubMenuID(2)} class={subMenuID() == 2 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Question Answering</button></li>
            <li><button onClick={() => setSubMenuID(3)} class={subMenuID() == 3 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Translation</button></li>
          </ul>

          {/* General Options Sub Menu */}
          <div id="generalOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 0 }}>

            <h5>Note: Run amount in individual models will override this value.</h5>
            <div class={modelTestingStyles.inputOption}>
              <label for="enableGlobalBenchmarkAmount">Run Models X number of times: </label>
              <input type="number" id="globalBenchmarkRunCount" min="1" max="99" value="1" />

              <div id="processorSelector" class={modelTestingStyles.processSelector}>
                <button 
                  onClick={() => changeProcessor("wasm")}
                  class={modelTestingStyles.inputButton + " " + `${processor() == "wasm" ? modelTestingStyles.processorButtonSelected : ""}`}
                  id="CPUButton" title="Swap to using CPU"
                >
                  CPU
                </button>
                <button 
                  onClick={() => changeProcessor("webgpu")}
                  class={modelTestingStyles.inputButton + " " + `${processor() == "webgpu" ? modelTestingStyles.processorButtonSelected : ""}`}
                  id="GPUButton" disabled title="No GPU Detected"
                >
                  GPU
                </button>
              </div>
            </div>
            
          </div>

          {/* Summarisation Sub Menu */}
          <div id="summarisationOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 1 }}>

            <h3>Summarisation test input field. Leave blank to use default input.</h3>
            <textarea id="summarisationTextArea" class={modelTestingStyles.inputArea}
            placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
          </div>

          {/* Question-Answering Sub Menu */}
          <div id="QAOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 2 }}>
            <h3>Question Answering input fields. Leave blank to use default input.</h3>
            <div>
              <textarea id="QAContextTextArea" class={modelTestingStyles.inputArea}
              placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
            
              <textarea id="QAQuestionTextArea" class={modelTestingStyles.inputArea}
              placeholder="Why can't LLM's be used in the defense industry and what benefits does this technolgy bring?" />
            </div>
          </div>

          {/* Translation Sub Menu */}
          <div id="translationOptions" class={modelTestingStyles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 3 }}>
            <h3>Translation input field and language selection. Ignore to use default input and languages.</h3>
            <textarea id="translationTextArea" class={modelTestingStyles.inputArea}
            placeholder="Il existe une tendance émergente consistant à mettre en place des modèles linguistiques locaux pour l’analyse des données privées et sensibles."/>
                      
            <label for="src_lang">From: </label>
            <select name="src_lang" id="src_lang" class={modelTestingStyles.dropDownMenu}>
              <option value="French">Select Language</option>
              <For each={shownLanguages()}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang" class={modelTestingStyles.dropDownMenu}>
              <option value="English">Select Language</option>
              <For each={shownLanguages()}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select>

            <div>
              <p>The options below determine whether the language selection boxes will show languages that all uploaded models have in common, or all models. If the former is selected, some models will fail to benchmark.</p>
              <input type="radio" name="languagesVisibilityOption" id="unionLanguages" onChange={adjustLanguageVisibility} checked />
              <label for="unionLanguages">Only show common languages.</label>
              <br />
              <input type="radio" name="languagesVisibilityOption" id="allLanguages" onChange={adjustLanguageVisibility} />
              <label for="allLanguages">Show all languages.</label>
            </div>
          </div>
        </div>

        <div id="tableContainer" class={modelTestingStyles.tableContainer} classList={{ hidden: selectedModels().length == 0}}>
          <table class={modelTestingStyles.tableMMLU}>
            <colgroup>
              <col/>
              <col/>
              <col span="2" class={modelTestingStyles.tableColShrink} />
              <col/>
            </colgroup>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Avg Upload Time</th>
                <th>Avg Generation Time</th>
                <th>Sample Output</th>
              </tr>
            </thead>
            
            <For each={allowedModelTypes}>{(type) => {
              // make filteredModels reactive
              const filteredModels = createMemo(() =>
                selectedModels().filter(m => m.modelType.toLowerCase() === type.toLowerCase())
              );
              return (
                <Show when={filteredModels().length > 0}>
                  <tbody>
                    <tr>
                      <td colspan="4" style="padding:0.5em 0em"><b><span>{type}</span> Models</b></td>
                    </tr>
                    <For each={filteredModels()}>{(model) =>
                      <tr>
                        <td><span class={modelTestingStyles.modelName} onClick={() => removeModel(model.name)}>{model.name}</span></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    }</For>
                  </tbody>
                </Show>
              );
            }}</For>
          </table>
          
        </div>
        <button class={modelTestingStyles.inputButton + " " + modelTestingStyles.copyButton} onClick={() => copyTable()} classList={{ hidden: selectedModels().length == 0}}>Copy table to clipboard 📋</button>
      </div>
    </>
  );
}

export default ModelTesting;
