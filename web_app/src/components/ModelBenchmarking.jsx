import { createSignal, For, onMount, createMemo } from 'solid-js';
import { pipeline, env } from '@huggingface/transformers';

import styles from './ModelBenchmarking.module.css';
import { cacheModels } from '../utils/ModelCache';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';


function ModelBenchmarking() {

  const [selectedModels, setSelectedModels] = createSignal([]);
  
  const defaultLanguages = ["English","French"];
  const [shownLanguages, setShownLanguages] = createSignal([...defaultLanguages]);
  const [currentLanguageOption, setCurrentLanguageOption] = createSignal("unionLanguages");

  const allowedModelTypes = ["summarization","question-answering","translation"];

  const [menuIsOpen, setMenuIsOpen] = createSignal([]);
  const [subMenuID, setSubMenuID] = createSignal([]);
  setSubMenuID(0);

  // Variable to store most recent benchmarking data.
  const [benchmarkData, setBenchmarkData] = createSignal([]);

  const [processor, setProcessor] = createSignal("wasm");
  setProcessor("wasm");

  const [tourProgress, setTourProgress] = createSignal(0);
  const tempTourModel = {"modelName":"TestModel","task":"summarization"};

  // Recommendation Tour
  const driverObj = driver({
    showProgress: true,
    allowHtml: true,
    steps: [
      { 
        element: '.pageContainer', 
        popover: { 
          title: "Benchmarking Models", 
          description: `This page lets you test your AI models, to run and compare them against eachother. Click anywhere outside the highlighted area to exit this tutorial.`
        } 
      },
      {
        element: '#modelInputLabel',
        popover: {
          title: "Uploading Models",
          description: `Clicking this button will let you upload models. You can upload one or multiple models at a time, and even upload multiple different types of models at once.`,
          onNextClick: () => {
            setTourProgress(1);
            driverObj.moveNext();
          }
        }
      },
      {
        element: "#clearButton",
        popover: {
          title: "Removing Upload Models",
          description: `If you accidentally upload a model you dont want to test, or want to remove all uploaded models, you can click this button.`
        }
      },
      {
        element: "#advancedOptionsMenuButton",
        popover: {
          title: "Customising Model Benchmarking",
          description: `Clicking this button will open a menu that allows you to customise the input provided to each model during benchmarking.`,
          onNextClick: () => {
            setSubMenuID(0);
            setTourProgress(2);
            driverObj.moveNext();
          }
        }
      },
      {
        element: "#advancedOptionsMenu",
        popover: {
          title: "Advanced Options Menu",
          description: `This is the menu that appears.`
        }
      },
      {
        element: "#optionMenuSubTabs",
        popover: {
          title: "Changing the Tabs",
          description: `These Tabs change the options shown. The options within each tab apply to the models of the matching type. The general options shown in this selected tab appy to all models.`
        }
      },
      {
        element: "#generalOptions",
        popover: {
          title: "General Options",
          description: `These options appy to all models. The input changes how many times each model will run. This is useful for reducing the chances of seeing an outlier time. The CPU/GPU selector changes what models are run on. The GPU option is disabled if none is available.`,
          onNextClick: () => {
            setTourProgress(3);
            driverObj.moveNext();
          }
        }
      },
      {
        element: "#tourTableContainer",
        popover: {
          title: "Model Table",
          description: `This is an example of what the model table will look like when models are added. The table is seperated by model type.`
        }
      },
      {
        element: "#tourTableContainer",
        popover: {
          title: "Copy Buttons",
          description: `The Copy buttons will copy the table above them to the clipboard.`
        }
      },
      {
        element: "#benchmarkButton",
        popover: {
          title: "Benchmarking",
          description: `Once you have uploaded your models and customised the settings you want, you can click this benchmarking button to start testing the models.`,
          onNextClick: () => {
            setTourProgress(4);
            driverObj.moveNext();
          }
        }
      },
      {
        element: "#tourTableContainer",
        popover: {
          title: "Finished Benchmarking",
          description: `Once your models have finished benchmarking, the table will look something similar to this. The average upload and runtime columns will show how long it took the models to run, and the final column will show what the models output.`
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
    ],

    onDestroyStarted: () => {
      setTourProgress(0);
      driverObj.destroy();
    }
  });

  const saveBenchmarkSettings = () => {

    // Get all elements to save
    const runAmount = document.getElementById("globalBenchmarkRunCount").value;
    let summarizationInput = document.getElementById("summarizationTextArea").innerHTML;
    let QAContext = document.getElementById("QAContextTextArea").innerHTML;
    let QAQuestion = document.getElementById("QAQuestionTextArea").innerHTML;
    let translationInput = document.getElementById("translationTextArea").innerHTML;
    const languageOption = currentLanguageOption();
    console.log(currentLanguageOption());

    let saveSettings = {
      "runAmount":runAmount,
      "summarizationInput":summarizationInput,
      "QAContext":QAContext,
      "QAQuestion":QAQuestion,
      "translationInput":translationInput,
      "languageOption":languageOption
    };
    localStorage.setItem("benchmarkingSettings", JSON.stringify(saveSettings));
    
    console.log(saveSettings);
  }

  const addModel = async (event) => {

    let files = [...event.target.files];
    if (files.length == 0) return;

    let configFile = files.find(file => file.name == "browser_config.json");
    
    if (!configFile) {
      alert("Unsupported or Malformed Model");
      return;
    }

    let uploadedModels = await cacheModels(files);

    // add models to list of available models
    let models = selectedModels().slice();

    for (let model of uploadedModels) {

      if (models.some(m => m.name == model.modelName)) continue;

      if (model.task == 'translation') {
        let cache = await caches.open('transformers-cache');
        let cacheKeys = await cache.keys();
        let configKey = cacheKeys.filter(k => k.url.includes("browser_config.json") && k.url.includes(model.modelName))[0];

        let response = await cache.match(configKey);
        let array = await response.arrayBuffer();
        let config = JSON.parse((new TextDecoder()).decode(array));

        model.languages = config.languages;
      }

      model.name = model.modelName;
      model.modelType = model.task;
      models.push(model);
    }

    setSelectedModels(models);

    // Reset the input incase the model is removed and needs to be re-added.
    event.target.value = "";

    adjustLanguageVisibility({ target: { id: currentLanguageOption() } });
  };

  const benchmarkModels = async () => {

    const tables = document.getElementById("tableContainer").querySelectorAll("table");

    const tableUploadTimeCol = 1;
    const tableGenerationTimeCol = 2;
    const tableMessageCol = 3;

    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    let globalModelRunCount = Math.round(document.getElementById("globalBenchmarkRunCount").value);
    if (globalModelRunCount <= 1) globalModelRunCount = 1;

    let startTime;
    let endTime;
    let totalTime;

    document.getElementById("modelInput").disabled = true;
    document.getElementById("modelInputLabel").setAttribute("disabled","disabled");
    document.getElementById("benchmarkButton").disabled = true;
    document.getElementById("clearButton").disabled = true;

    for (let table of tables) {

      for (let i = 1; i < table.rows.length; i++) {
        let currentRow = table.rows[i];

        let model = selectedModels().find(m => m.name == currentRow.cells[0].innerText);

        currentRow.classList.add(styles.currentTableRow);

        let generator;

        // upload model multiple times and measure times
        currentRow.cells[tableUploadTimeCol].innerText = "Uploading 0/" + globalModelRunCount;
        for (let j = 1; j < (globalModelRunCount + 1); j++) {

          // correctly dispose of generator
          if (generator) {
            if (generator.session) await generator.session.release();

            try {
              await generator.dispose();
            } catch (error) {
              console.warn(error);
            }

            generator = null;
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // upload & measure
          startTime = performance.now();
          try {
            generator = await pipeline(model.modelType, model.name, { device: processor() });
          } catch (error) {
            generator = null;
            console.warn(error);
            continue;
          }
          endTime = performance.now();
          totalTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));

          // record
          let timings = {...benchmarkData()};
          if (!timings[`${model.name}-Upload`]) timings[`${model.name}-Upload`] = [];
          
          timings[model.name + "-Upload"].push(totalTime);
          setBenchmarkData(timings);

          // update text
          currentRow.cells[tableUploadTimeCol].innerText = `Uploading: ${j}/${globalModelRunCount}`;
          await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
        }

        let totalUploadTimes = benchmarkData()[model.name + "-Upload"];

        if (generator == null) {
          currentRow.cells[tableUploadTimeCol].innerText = "pipeline creation failed";
          continue;
        }

        let avgUploadTime = totalUploadTimes.reduce((a, b) => a + b) / totalUploadTimes.length;

        totalTime = avgUploadTime.toFixed(2) + "s";
        currentRow.cells[tableUploadTimeCol].innerText = totalTime;
        currentRow.cells[tableUploadTimeCol].title = totalUploadTimes;

        // inference multiple times and measure times
        currentRow.cells[tableGenerationTimeCol].innerText = "Genarting 0/" + globalModelRunCount;
        await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
        let output = "";
        for (let j = 1; j < (globalModelRunCount + 1); j++) {
          
          if (model.modelType == "summarization") {

            const textArea = document.getElementById("summarizationTextArea");

            let userInput = textArea.value ? textArea.value : textArea.placeholder;

            startTime = performance.now();
            try {
              output = await generator(userInput, { max_new_tokens: 100 });
            } catch (error) {
              console.warn(error);
              output == null;
              continue;
            }
            endTime = performance.now();
            output = output[0].summary_text;

          } else if (model.modelType == "question-answering") {

            const contextTextArea = document.getElementById("QAContextTextArea");
            const questionTextArea = document.getElementById("QAQuestionTextArea");

            let context = contextTextArea.value ? contextTextArea.value : contextTextArea.placeholder;
            let question = questionTextArea.value ? questionTextArea.value : questionTextArea.placeholder;

            startTime = performance.now();
            try {
              output = await generator(context, question);
            } catch (error) {
              console.warn(error);
              output == null;
              continue;
            }
            endTime = performance.now();
            output = output.answer;

          } else if (model.modelType == "translation") {

            const textArea = document.getElementById("translationTextArea");
            const srcLang = document.getElementById("src_lang").value;
            const tgtLang = document.getElementById("tgt_lang").value;

            let srcLangCode = model.languages[srcLang];
            let tgtLangCode = model.languages[tgtLang];

            if (!srcLangCode || !tgtLangCode) {
              currentRow.cells[tableGenerationTimeCol].innerText = "N/A";
              currentRow.cells[tableMessageCol].innerText = "Language(s) Unavailable";
              continue;
            }

            let userInput = textArea.value ? textArea.value : textArea.placeholder;

            startTime = performance.now();
            try {
              output = await generator(userInput, {src_lang: srcLangCode, tgt_lang: tgtLangCode});
            } catch (error) {
              console.warn(error);
              output == null;
              continue;
            }
            endTime = performance.now();
            output = output[0].translation_text;

          }

          let timings = {...benchmarkData()};
          if (!timings[`${model.name}-Generate`]) timings[`${model.name}-Generate`] = [];
          
          totalTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));

          timings[`${model.name}-Generate`].push(totalTime);
          setBenchmarkData(timings);

          currentRow.cells[tableGenerationTimeCol].innerText = `Generating: ${j}/${globalModelRunCount}`;
          await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
        }

        let totalGenerationTimes = benchmarkData()[`${model.name}-Generate`];

        if (totalGenerationTimes) {
          let avgGenerationTime = totalGenerationTimes.reduce((a, b) => a + b) / totalGenerationTimes.length;

          totalTime = (avgGenerationTime).toFixed(2) + "s";
          currentRow.cells[tableGenerationTimeCol].innerText = totalTime;
          currentRow.cells[tableGenerationTimeCol].title = totalGenerationTimes;
          currentRow.cells[tableMessageCol].innerText = output;
        } else {
          currentRow.cells[tableGenerationTimeCol].innerText = "Model Generation Failed";
        }

        currentRow.classList.remove(styles.currentTableRow);
        generator.dispose();
        await new Promise(requestAnimationFrame);
      }
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
  };

  const toggleAdvancedOptions = () => {
    setMenuIsOpen(!menuIsOpen());
  };

  const copyTable = (tableId) => {

    const table = document.getElementById(tableId);

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
        currentModelType = row.firstChild.firstChild.querySelector("span").innerHTML.toLowerCase()
      }
    }

    console.log(tableString);
    navigator.clipboard.writeText(tableString);
  };

  const adjustLanguageVisibility = async (languageID) => {
    //console.log(languageID);
    setCurrentLanguageOption(languageID);

    let languages = [...defaultLanguages];
    if (languageID == "allLanguages") {
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

    } else if (languageID == "unionLanguages") {
      let firstModel = true;
      for (let i = 0; i < selectedModels().length; i++) {

        if (selectedModels()[i].modelType != "translation") {
          continue;
        }

        // Load Languages
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
  };

  // Change the active processor.
  const changeProcessor = (newProcessor) => {
    if (processor() == newProcessor) return;

    console.log("Switching to", newProcessor);
    setProcessor(newProcessor);
  };

  onMount(async () => {

    // Load saved settings
    let saveSettings = JSON.parse(localStorage.getItem("benchmarkingSettings")) || {};

    document.getElementById("summarizationTextArea").innerHTML = saveSettings["summarizationInput"] || "";
    document.getElementById("QAContextTextArea").innerHTML = saveSettings["QAContext"] || "";
    document.getElementById("QAQuestionTextArea").innerHTML = saveSettings["QAQuestion"] || "";
    document.getElementById("translationTextArea").innerHTML = saveSettings["translationInput"] || "";
    document.getElementById("globalBenchmarkRunCount").value = saveSettings["runAmount"] || 1;

    if (saveSettings != {}) {
      setCurrentLanguageOption(saveSettings["languageOption"]);
    }

    if (currentLanguageOption() == "unionLanguages") {
      document.getElementById("unionLanguages").checked = true;
    } else {
      document.getElementById("allLanguages").checked = true;
    }
    
    let tutorialSaves = JSON.parse(localStorage.getItem("tutorials")) || {};
    if (!tutorialSaves["benchmarking"]) {
      driverObj.drive();
      tutorialSaves["benchmarking"] = true;
      localStorage.setItem("tutorials", JSON.stringify(tutorialSaves));
    }

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
      <div class={styles.modelTesting}>

        <h2>Model Benchmarking</h2>
        <p>
          This page can be used to benchmark and test models. Start by uploading your model(s).
          Once models have been uploaded hit the 'Benchmark' button to run some prompts through the model. 
          To customise the prompts/run-configuration hit the cogwheel.
        </p>

        <h4>Select models to benchmark</h4>
        <div class={styles.benchmarkingButtons}>
          <div class={styles.leftButtons}>
            {/* Select Model/s for benchmarking */}
            <input type="file" id="modelInput" className='hidden' webkitdirectory multiple onChange={addModel} />
            <label for="modelInput" id="modelInputLabel" class={styles.inputButton} className='inputButton'>
              Select Models
            </label>
                        
            <button id="benchmarkButton" class={styles.inputButton} onClick={benchmarkModels} disabled={selectedModels().length == 0 && tourProgress() == 0} classList={{ hidden: selectedModels().length == 0 && tourProgress() == 0}}>Benchmark</button>
          </div>
          <div class={styles.rightButtons}>
            <button id="clearButton" class={styles.inputButton} onClick={clearModels } disabled={selectedModels().length == 0 && tourProgress() == 0} classList={{ hidden: selectedModels().length == 0 && tourProgress() == 0}}>Clear Models</button>
            <button class={styles.inputButton} id="advancedOptionsMenuButton" onClick={() => toggleAdvancedOptions()} classList={{ hidden: selectedModels().length == 0 && tourProgress() == 0}}>⚙︎</button>
          </div>
        </div>

        <div class={`${styles.advancedOptionsMenu} ${(!menuIsOpen() || tourProgress() == 2) ? "" : styles.menuClosed}`} id='advancedOptionsMenu'>
          <ul class={styles.optionMenuSubTabs} id="optionMenuSubTabs">
            <li><button onClick={() => setSubMenuID(0)} class={subMenuID() == 0 ? styles.selectedOptionMenuSubTab : ""}>General</button></li>
            <li><button onClick={() => setSubMenuID(1)} class={subMenuID() == 1 ? styles.selectedOptionMenuSubTab : ""}>Summarisation</button></li>
            <li><button onClick={() => setSubMenuID(2)} class={subMenuID() == 2 ? styles.selectedOptionMenuSubTab : ""}>Question Answering</button></li>
            <li><button onClick={() => setSubMenuID(3)} class={subMenuID() == 3 ? styles.selectedOptionMenuSubTab : ""}>Translation</button></li>
          </ul>

          {/* General Options Sub Menu */}
          <div id="generalOptions" class={styles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 0 && tourProgress() != 2 }}>

            <div class={styles.inputOption}>
              <label for="enableGlobalBenchmarkAmount">Run Models X number of times: </label>
              <input type="number" id="globalBenchmarkRunCount" min="1" max="99" value="1" onChange={() => saveBenchmarkSettings()} />

              <div id="processorSelector" class={styles.processSelector}>
                <button 
                  onClick={() => changeProcessor("wasm")}
                  class={styles.inputButton + " " + `${processor() == "wasm" ? styles.processorButtonSelected : ""}`}
                  id="CPUButton" title="Swap to using CPU"
                >
                  CPU
                </button>
                <button 
                  onClick={() => changeProcessor("webgpu")}
                  class={styles.inputButton + " " + `${processor() == "webgpu" ? styles.processorButtonSelected : ""}`}
                  id="GPUButton" disabled title="No GPU Detected"
                >
                  GPU
                </button>
              </div>
            </div>
            
          </div>

          {/* Summarization Sub Menu */}
          <div id="summarizationOptions" class={styles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 1 }}>

            <h3>Summarisation test input field. Leave blank to use default input.</h3>
            <textarea id="summarizationTextArea" class={styles.inputArea} onChange={() => saveBenchmarkSettings()}
            placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
          </div>

          {/* Question-Answering Sub Menu */}
          <div id="QAOptions" class={styles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 2 }}>
            <h3>Question Answering input fields. Leave blank to use default input.</h3>
            <div>
              <textarea id="QAContextTextArea" class={styles.inputArea} onChange={() => saveBenchmarkSettings()}
              placeholder='There is an emerging trend of standing up local language models for analysing private and sensitive data (for example, Ollama, Open WebUI). Typically, these solutions require provisioning a server that is capable of hosting the model and then providing a REST API for others on the network. This solution is not always ideal in Defence. Defence is a very siloed organisation by design, where need-to-know is a critical security mechanism. Some teams work with extremely sensitive data and may not have the expertise or the infrastructure necessary to set up a local LLM service. All teams however have access to a Windows machine with a web browser. Some of these machines have GPUs, but many do not. By enabling AI inference in the browser we can empower more teams in Defence to have access to state-of-the-art chatbots to help them understand their data.' />
            
              <textarea id="QAQuestionTextArea" class={styles.inputArea} onChange={() => saveBenchmarkSettings()}
              placeholder="Why can't LLM's be used in the defense industry and what benefits does this technolgy bring?" />
            </div>
          </div>

          {/* Translation Sub Menu */}
          <div id="translationOptions" class={styles.optionsSubMenu}
          classList={{ hidden: subMenuID() !== 3 }}>
            <h3>Translation input field and language selection. Ignore to use default input and languages.</h3>
            <textarea id="translationTextArea" class={styles.inputArea} onChange={() => saveBenchmarkSettings()}
            placeholder="Il existe une tendance émergente consistant à mettre en place des modèles linguistiques locaux pour l’analyse des données privées et sensibles."/>
                      
            <label for="src_lang">From: </label>
            <select name="src_lang" id="src_lang" class={styles.dropDownMenu} onChange={() => saveBenchmarkSettings()}>
              <option value="French">Select Language</option>
              <For each={shownLanguages()}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang" class={styles.dropDownMenu} onChange={() => saveBenchmarkSettings()}>
              <option value="English">Select Language</option>
              <For each={shownLanguages()}>{(lang) =>
                <option value={lang}>{lang}</option>
              }</For>
            </select>

            <div>
              <p>The options below determine whether the language selection boxes will show languages that all uploaded models have in common, or all models. If the former is selected, some models will fail to benchmark.</p>
              <input type="radio" name="languagesVisibilityOption" id="unionLanguages" onChange={() => {adjustLanguageVisibility("unionLanguages"); saveBenchmarkSettings()}} />
              <label for="unionLanguages">Only show common languages.</label>
              <br />
              <input type="radio" name="languagesVisibilityOption" id="allLanguages" onChange={() => {adjustLanguageVisibility("allLanguages"); saveBenchmarkSettings()}} />
              <label for="allLanguages">Show all languages.</label>
            </div>
          </div>
        </div>

        <div id="tableContainer" class={styles.tableContainer} classList={{ hidden: selectedModels().length == 0 || tourProgress() >= 3}}>

          <For each={allowedModelTypes}>{(type) => {
            const filteredModels = createMemo(() =>
              selectedModels().filter(m => m.modelType == type)
            );
            return (
              <Show when={filteredModels().length > 0}>
                <br/><br/>
                <h3><span>{type.charAt(0).toUpperCase() + type.slice(1)}</span> Models</h3>
                <table id={`${type}-table`} class={styles.tableMMLU}>
                  <colgroup>
                    <col/>
                    <col/>
                    <col span="2" class={styles.tableColShrink} />
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
                  <tbody>
                    <For each={filteredModels()}>{(model) =>
                      <tr>
                        <td>
                          <span 
                            class={styles.modelName} 
                            onClick={() => removeModel(model.name)}
                          >
                            {model.name}
                          </span>
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    }</For>
                  </tbody>
                </table>
                <button 
                  class={styles.inputButton + " " + styles.copyButton} 
                  onClick={() => copyTable(`${type}-table`)} 
                  classList={{ hidden: selectedModels().length == 0}}
                >
                  Copy table to clipboard 📋
                </button>
              </Show>
            );
          }}</For>

        </div>
        <div id="tourTableContainer" class={styles.tableContainer} classList={{ hidden: tourProgress() < 3}}>
          <For each={allowedModelTypes}>{(type) => {
            return (
              <div>
                <br/><br/>
                <h3><span>{type.charAt(0).toUpperCase() + type.slice(1)}</span> Models</h3>
                <table id={`${type}-table`} class={styles.tableMMLU}>
                  <colgroup>
                    <col/>
                    <col/>
                    <col span="2" class={styles.tableColShrink} />
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
                  <tbody>
                      <tr>
                      <td>
                        <span 
                          class={styles.modelName} 
                        >
                          Model Name Here
                        </span>
                      </td>
                      <Show when={tourProgress() == 4} fallback={
                        <>
                          <td></td>
                          <td></td>
                          <td></td>
                        </>
                      }>
                      <td>1.5s</td>
                      <td>3.1s</td>
                      <td>Sample Output Example</td>
                      </Show>
                    </tr>
                  </tbody>
                </table>
                <button 
                  class={styles.inputButton + " " + styles.copyButton} 
                >
                  Copy table to clipboard 📋
                </button>
              </div>
            )
          }}</For>
        </div>
        <br />
        <button class={styles.inputButton} id="redoTutorial" onClick={() => driverObj.drive()}>Redo tutorial</button>
      </div>
    </>
  );
}

export default ModelBenchmarking;
