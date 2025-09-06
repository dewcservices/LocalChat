import { createSignal, For, onMount } from 'solid-js';
import { pathJoin } from '../utils/PathJoin';
import { pipeline, env } from '@huggingface/transformers';
import modelTestingStyles from './ModelTesting.module.css';
import { modelBenchmarks } from './modelBenchmarks.js';
import { classList } from 'solid-js/web';

function ModelTesting() {
  const [selectedModels, setSelectedModels] = createSignal([]);

  const allowedModelTypes = ["summarization","question-answering","translation"];
  const defaultLanguages = ["Acehnese (Arabic script)","Acehnese (Latin script)","Mesopotamian Arabic","Taâ€™izzi-Adeni Arabic","Tunisian Arabic","Afrikaans","South Levantine Arabic","Akan","Amharic","North Levantine Arabic","Modern Standard Arabic","Modern Standard Arabic (Romanized)","Najdi Arabic","Moroccan Arabic","Egyptian Arabic","Assamese","Asturian","Awadhi","Central Aymara","South Azerbaijani","North Azerbaijani","Bashkir","Bambara","Balinese","Belarusian","Bemba","Bengali","Bhojpuri","Banjar (Arabic script)","Banjar (Latin script)","Standard Tibetan","Bosnian","Buginese","Bulgarian","Catalan","Cebuano","Czech","Chokwe","Central Kurdish","Crimean Tatar","Welsh","Danish","German","Southwestern Dinka","Dyula","Dzongkha","Greek","English","Esperanto","Estonian","Basque","Ewe","Faroese","Fijian","Finnish","Fon","French","Friulian","Nigerian Fulfulde","Scottish Gaelic","Irish","Galician","Guarani","Gujarati","Haitian Creole","Hausa","Hebrew","Hindi","Chhattisgarhi","Croatian","Hungarian","Armenian","Igbo","Ilocano","Indonesian","Icelandic","Italian","Javanese","Japanese","Kabyle","Jingpho","Kamba","Kannada","Kashmiri (Arabic script)","Kashmiri (Devanagari script)","Georgian","Central Kanuri (Arabic script)","Central Kanuri (Latin script)","Kazakh","KabiyÃ¨","Kabuverdianu","Khmer","Kikuyu","Kinyarwanda","Kyrgyz","Kimbundu","Northern Kurdish","Kikongo","Korean","Lao","Ligurian","Limburgish","Lingala","Lithuanian","Lombard","Latgalian","Luxembourgish","Luba-Kasai","Ganda","Luo","Mizo","Standard Latvian","Magahi","Maithili","Malayalam","Marathi","Minangkabau (Arabic script)","Minangkabau (Latin script)","Macedonian","Plateau Malagasy","Maltese","Meitei (Bengali script)","Halh Mongolian","Mossi","Maori","Burmese","Dutch","Norwegian Nynorsk","Norwegian BokmÃ¥l","Nepali","Northern Sotho","Nuer","Nyanja","Occitan","West Central Oromo","Odia","Pangasinan","Eastern Panjabi","Papiamento","Western Persian","Polish","Portuguese","Dari","Southern Pashto","Ayacucho Quechua","Romanian","Rundi","Russian","Sango","Sanskrit","Santali","Sicilian","Shan","Sinhala","Slovak","Slovenian","Samoan","Shona","Sindhi","Somali","Southern Sotho","Spanish","Tosk Albanian","Sardinian","Serbian","Swati","Sundanese","Swedish","Swahili","Silesian","Tamil","Tatar","Telugu","Tajik","Tagalog","Thai","Tigrinya","Tamasheq (Latin script)","Tamasheq (Tifinagh script)","Tok Pisin","Tswana","Tsonga","Turkmen","Tumbuka","Turkish","Twi","Central Atlas Tamazight","Uyghur","Ukrainian","Umbundu","Urdu","Northern Uzbek","Venetian","Vietnamese","Waray","Wolof","Xhosa","Eastern Yiddish","Yoruba","Yue Chinese","Chinese (Simplified)","Chinese (Traditional)","Standard Malay","Zulu"];

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
  }

  const benchmarkModels = async () => {

    const table = document.getElementById("tableContainer").querySelector("table");

    const tableUploadTimeCol = 2;
    const tableGenerationTimeCol = 3;
    const tableMessageCol = 4;

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    let globalModelRunCount = Math.round(document.getElementById("globalBenchmarkRunCount").value);
    if (globalModelRunCount <= 1) {
      globalModelRunCount = 1;
    }

    const modelList = selectedModels();

    if (modelList.length > 0) {
      setBenchmarkData([]);
    }

    let startTime;
    let endTime;
    let totalTime;

    document.getElementById("modelInput").disabled = true;
    document.getElementById("modelInputLabel").setAttribute("disabled","disabled");
    document.getElementById("benchmarkButton").disabled = true;
    document.getElementById("clearButton").disabled = true;

    // Loop through each model, injecting the model into the cache, and running a sample prompt.
    for (let i = 0; i < modelList.length; i++) {
      const model = modelList[i];
      const currentRow = table.rows[i+1];

      table.rows[i].classList.remove(modelTestingStyles.currentTableRow);
      currentRow.classList.add(modelTestingStyles.currentTableRow);

      let generator;
      currentRow.cells[tableUploadTimeCol].innerText = "Uploading: 0/" + globalModelRunCount;

      // reset browser cache to clear any previous models
      caches.delete('transformers-cache');
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
    const btn = document.getElementById("advancedOptionsMenuButton");
    if (menuIsOpen()) {
      btn.innerHTML = "Advanced Options<br />⮟"
    } else {
      btn.innerHTML = "Advanced Options<br />⮝"
    }
  }

  const copyTable = () => {
    const table = document.getElementById("tableContainer").querySelector("table");

    let tableString = "";
    // Table Structure: Model Name, Model Type, Upload Time, Generation Time, Sample Output.

    tableString += "Model Name\tModel Type\tUpload Times\tGeneration Times\tAVG Upload Time\tAVG Generation Time";

    for (let i = 1; i < table.rows.length; i++) {
      let row = table.rows[i];
      
      tableString += "\n"
      tableString += row.cells[0].querySelector("span").innerHTML + "\t";  // Model Name
      tableString += row.cells[1].querySelector("span").innerHTML + "\t";  // Model Type
      tableString += row.cells[2].title + "\t";  // Upload Times
      tableString += row.cells[3].title + "\t";  // Generation Times
      tableString += row.cells[2].innerHTML + "\t";  // AVG Upload Time
      tableString += row.cells[3].innerHTML + "\t";  // AVG Generation Time
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

  const recommendModels = () => {
    // Choose three best models based on devices performance.

    //TODO; add option for estimated model types;

    const benchmarkedModelType = document.getElementById("modelTypeSelector");
    const benchmarkedModelUploadTime = document.getElementById("averageUploadTime");
    const benchmarkedModelGenerationTime = document.getElementById("averageGenerationTime");

    if (benchmarkedModelType.value == "") {
      benchmarkedModelType.classList.add(modelTestingStyles.noInputSelectedPosible);
      benchmarkedModelType.style.animation = "none";
      benchmarkedModelType.offsetHeight;
      benchmarkedModelType.style.animation = null;
    };

    if (benchmarkedModelUploadTime.value == 0) {
      benchmarkedModelUploadTime.classList.add(modelTestingStyles.noInputSelectedPosible);
      benchmarkedModelUploadTime.style.animation = "none";
      benchmarkedModelUploadTime.offsetHeight;
      benchmarkedModelUploadTime.style.animation = null;
    }

    if (benchmarkedModelGenerationTime.value == 0) {
      benchmarkedModelGenerationTime.classList.add(modelTestingStyles.noInputSelectedPosible);
      benchmarkedModelGenerationTime.style.animation = "none";
      benchmarkedModelGenerationTime.offsetHeight;
      benchmarkedModelGenerationTime.style.animation = null;
    }

    if (benchmarkedModelType.value == "" || benchmarkedModelUploadTime.value == 0 || benchmarkedModelGenerationTime.value == 0) {
      return;
    } 

    const models = getModelTimes(benchmarkedModelType.value, benchmarkedModelUploadTime.value, benchmarkedModelGenerationTime.value);

    console.log(models);

    // Get models with closest performance to 5 seconds, 10 seconds, and 15 seconds.
    const fiveSecondModel = models
      .filter(model => model.infer_time <= 5)
      .sort((a,b) => b.quality - a.quality)[0];

    const tenSecondModel = models
      .filter(model => model.infer_time <= 10)
      .sort((a,b) => b.quality - a.quality)[0];

    const fifteenSecondModel = models
      .filter(model => model.infer_time <= 15)
      .sort((a,b) => b.quality - a.quality)[0];

    setRecommendedModels([...new Set([fiveSecondModel, tenSecondModel, fifteenSecondModel])].filter(model => model != null));

  }

  // Change the active processor.
  const changeProcessor = (newProcessor) => {
    if (processor() == newProcessor) return;

    console.log("Switching to", newProcessor);
    setProcessor(newProcessor);
  };

  onMount(async () => {
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
        <h2>Model Testing:</h2>
        <h4>Select models to benchmark:</h4>

        <div>
          {/* Select Model/s for benchmarking */}
          <input type="file" id="modelInput" className='hidden' webkitdirectory multiple onChange={addModel} />
          <label for="modelInput" id="modelInputLabel" class={modelTestingStyles.inputButton} className='inputButton'>
            Select Models
          </label>
                      
          <button id="benchmarkButton" class={modelTestingStyles.inputButton} onClick={benchmarkModels} disabled={selectedModels().length < 1}>Benchmark</button>
          <button id="clearButton" class={modelTestingStyles.inputButton} onClick={clearModels } disabled={selectedModels().length < 1}>Clear Models</button>
        </div>

        <div>
          <button class={modelTestingStyles.inputButton} id="advancedOptionsMenuButton" onClick={() => toggleAdvancedOptions()}>Advanced Options<br />⮟</button>
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
            <h5>Please Note: Not all models will have the same languages available for translation. If selected languages are not available, no translation will be conducted.</h5>
            <textarea id="translationTextArea" class={modelTestingStyles.inputArea}
            placeholder="Il existe une tendance émergente consistant à mettre en place des modèles linguistiques locaux pour l’analyse des données privées et sensibles."/>
            

            <label for="src_lang">From: </label>
            <select name="src_lang" id="src_lang" class={modelTestingStyles.dropDownMenu}>
              <option value="French">Select Language</option>
              <For each={defaultLanguages}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang" class={modelTestingStyles.dropDownMenu}>
              <option value="English">Select Language</option>
              <For each={defaultLanguages}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select>

          </div>
        </div>

        <div id="tableContainer" class={modelTestingStyles.tableContainer}>
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
                <th>Model Type</th>
                <th>Avg Upload Time</th>
                <th>Avg Generation Time</th>
                <th>Sample Output</th>
              </tr>
            </thead>
            <tbody>
              <For each={selectedModels()}>{(model) =>
                <tr>
                  <td><span class={modelTestingStyles.modelName} onClick={() => removeModel(model.name)}>{model.name}</span></td>
                  <td><span>{model.modelType}</span></td>
                  <td></td> {/* Upload Time Cell */}
                  <td></td> {/* Generation Time Cell */}
                  <td></td> {/* Sample Output Cell */}
                </tr>
              }</For>
            </tbody>
          </table>
        </div>
        <button class={modelTestingStyles.inputButton + " " + modelTestingStyles.copyButton} onClick={() => copyTable()}>Copy table to clipboard 📋</button>

        <br /><br /><br />

        <div id="modelRecommendationFeature" class={modelTestingStyles.recommendationArea}>
          <p>This is for recommending models based on an estimate of your devices performance. Please enter the times it takes to run the baseline model on your device. The list of baseline models can be found <a title="TODO">TODO: Here</a>.</p>
          
          <label for="modelTypeSelector">Model Type: </label>
          <select name="modelTypeSelector" id="modelTypeSelector" class={modelTestingStyles.dropDownMenu}>
            <option value="">Select Model Type</option>
            <For each={allowedModelTypes}>{(type) =>
              <option value={type}>{type}</option>
            }</For>
          </select> 

          <br /><br />

          <div class={modelTestingStyles.recommendationInputArea}>
            <div>
              <label for="averageUploadTime">Average Upload Time: </label>
              <input type="number" id="averageUploadTime" value="0" step={0.1} min={0}/>

              <label for="averageGenerationTime">Average Generation Time: </label>
              <input type="number" id="averageGenerationTime" value="0" step={0.1} min={0}/>
            </div>
          </div>
          
          <br />
          <button class={modelTestingStyles.inputButton} onClick={() => recommendModels()}>Recommend Models</button>
          <br />

        </div>
        <div id="recommendedModelContainer" classList={{ hidden: recommenedModels().length == 0}}>
          <p>These are a selection of recommended models based on your device:</p>
          <table class={modelTestingStyles.tableMMLU}>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>File Size</th>
                <th>Predicted Upload Time</th>
                <th>Predicted Generation Time</th>
                <th>Output Quality Score</th>
              </tr>
            </thead>
            <tbody>
              <For each={recommenedModels()}>{(model) =>
                <tr>
                  <td>{model.name}</td>
                  <td>{model.file_size}</td>
                  <td>{model.upload_time}</td>
                  <td>{model.infer_time}</td>
                  <td>{model.quality}</td>
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
