import { createSignal, onMount } from 'solid-js';
import { pathJoin } from '../utils/PathJoin';
import { pipeline, env } from '@huggingface/transformers';
import modelTestingStyles from './ModelTesting.module.css';

function ModelTesting() {
  const [selectedModels, setSelectedModels] = createSignal([]);

  const allowedModelTypes = ["summarization","question-answering","translation"];
  const defaultLanguages = {"Acehnese (Arabic script)":"ace_Arab","Acehnese (Latin script)":"ace_Latn","Mesopotamian Arabic":"acm_Arab","Taâ€™izzi-Adeni Arabic":"acq_Arab","Tunisian Arabic":"aeb_Arab","Afrikaans":"afr_Latn","South Levantine Arabic":"ajp_Arab","Akan":"aka_Latn","Amharic":"amh_Ethi","North Levantine Arabic":"apc_Arab","Modern Standard Arabic":"arb_Arab","Modern Standard Arabic (Romanized)":"arb_Latn","Najdi Arabic":"ars_Arab","Moroccan Arabic":"ary_Arab","Egyptian Arabic":"arz_Arab","Assamese":"asm_Beng","Asturian":"ast_Latn","Awadhi":"awa_Deva","Central Aymara":"ayr_Latn","South Azerbaijani":"azb_Arab","North Azerbaijani":"azj_Latn","Bashkir":"bak_Cyrl","Bambara":"bam_Latn","Balinese":"ban_Latn","Belarusian":"bel_Cyrl","Bemba":"bem_Latn","Bengali":"ben_Beng","Bhojpuri":"bho_Deva","Banjar (Arabic script)":"bjn_Arab","Banjar (Latin script)":"bjn_Latn","Standard Tibetan":"bod_Tibt","Bosnian":"bos_Latn","Buginese":"bug_Latn","Bulgarian":"bul_Cyrl","Catalan":"cat_Latn","Cebuano":"ceb_Latn","Czech":"ces_Latn","Chokwe":"cjk_Latn","Central Kurdish":"ckb_Arab","Crimean Tatar":"crh_Latn","Welsh":"cym_Latn","Danish":"dan_Latn","German":"deu_Latn","Southwestern Dinka":"dik_Latn","Dyula":"dyu_Latn","Dzongkha":"dzo_Tibt","Greek":"ell_Grek","English":"eng_Latn","Esperanto":"epo_Latn","Estonian":"est_Latn","Basque":"eus_Latn","Ewe":"ewe_Latn","Faroese":"fao_Latn","Fijian":"fij_Latn","Finnish":"fin_Latn","Fon":"fon_Latn","French":"fra_Latn","Friulian":"fur_Latn","Nigerian Fulfulde":"fuv_Latn","Scottish Gaelic":"gla_Latn","Irish":"gle_Latn","Galician":"glg_Latn","Guarani":"grn_Latn","Gujarati":"guj_Gujr","Haitian Creole":"hat_Latn","Hausa":"hau_Latn","Hebrew":"heb_Hebr","Hindi":"hin_Deva","Chhattisgarhi":"hne_Deva","Croatian":"hrv_Latn","Hungarian":"hun_Latn","Armenian":"hye_Armn","Igbo":"ibo_Latn","Ilocano":"ilo_Latn","Indonesian":"ind_Latn","Icelandic":"isl_Latn","Italian":"ita_Latn","Javanese":"jav_Latn","Japanese":"jpn_Jpan","Kabyle":"kab_Latn","Jingpho":"kac_Latn","Kamba":"kam_Latn","Kannada":"kan_Knda","Kashmiri (Arabic script)":"kas_Arab","Kashmiri (Devanagari script)":"kas_Deva","Georgian":"kat_Geor","Central Kanuri (Arabic script)":"knc_Arab","Central Kanuri (Latin script)":"knc_Latn","Kazakh":"kaz_Cyrl","KabiyÃ¨":"kbp_Latn","Kabuverdianu":"kea_Latn","Khmer":"khm_Khmr","Kikuyu":"kik_Latn","Kinyarwanda":"kin_Latn","Kyrgyz":"kir_Cyrl","Kimbundu":"kmb_Latn","Northern Kurdish":"kmr_Latn","Kikongo":"kon_Latn","Korean":"kor_Hang","Lao":"lao_Laoo","Ligurian":"lij_Latn","Limburgish":"lim_Latn","Lingala":"lin_Latn","Lithuanian":"lit_Latn","Lombard":"lmo_Latn","Latgalian":"ltg_Latn","Luxembourgish":"ltz_Latn","Luba-Kasai":"lua_Latn","Ganda":"lug_Latn","Luo":"luo_Latn","Mizo":"lus_Latn","Standard Latvian":"lvs_Latn","Magahi":"mag_Deva","Maithili":"mai_Deva","Malayalam":"mal_Mlym","Marathi":"mar_Deva","Minangkabau (Arabic script)":"min_Arab","Minangkabau (Latin script)":"min_Latn","Macedonian":"mkd_Cyrl","Plateau Malagasy":"plt_Latn","Maltese":"mlt_Latn","Meitei (Bengali script)":"mni_Beng","Halh Mongolian":"khk_Cyrl","Mossi":"mos_Latn","Maori":"mri_Latn","Burmese":"mya_Mymr","Dutch":"nld_Latn","Norwegian Nynorsk":"nno_Latn","Norwegian BokmÃ¥l":"nob_Latn","Nepali":"npi_Deva","Northern Sotho":"nso_Latn","Nuer":"nus_Latn","Nyanja":"nya_Latn","Occitan":"oci_Latn","West Central Oromo":"gaz_Latn","Odia":"ory_Orya","Pangasinan":"pag_Latn","Eastern Panjabi":"pan_Guru","Papiamento":"pap_Latn","Western Persian":"pes_Arab","Polish":"pol_Latn","Portuguese":"por_Latn","Dari":"prs_Arab","Southern Pashto":"pbt_Arab","Ayacucho Quechua":"quy_Latn","Romanian":"ron_Latn","Rundi":"run_Latn","Russian":"rus_Cyrl","Sango":"sag_Latn","Sanskrit":"san_Deva","Santali":"sat_Olck","Sicilian":"scn_Latn","Shan":"shn_Mymr","Sinhala":"sin_Sinh","Slovak":"slk_Latn","Slovenian":"slv_Latn","Samoan":"smo_Latn","Shona":"sna_Latn","Sindhi":"snd_Arab","Somali":"som_Latn","Southern Sotho":"sot_Latn","Spanish":"spa_Latn","Tosk Albanian":"als_Latn","Sardinian":"srd_Latn","Serbian":"srp_Cyrl","Swati":"ssw_Latn","Sundanese":"sun_Latn","Swedish":"swe_Latn","Swahili":"swh_Latn","Silesian":"szl_Latn","Tamil":"tam_Taml","Tatar":"tat_Cyrl","Telugu":"tel_Telu","Tajik":"tgk_Cyrl","Tagalog":"tgl_Latn","Thai":"tha_Thai","Tigrinya":"tir_Ethi","Tamasheq (Latin script)":"taq_Latn","Tamasheq (Tifinagh script)":"taq_Tfng","Tok Pisin":"tpi_Latn","Tswana":"tsn_Latn","Tsonga":"tso_Latn","Turkmen":"tuk_Latn","Tumbuka":"tum_Latn","Turkish":"tur_Latn","Twi":"twi_Latn","Central Atlas Tamazight":"tzm_Tfng","Uyghur":"uig_Arab","Ukrainian":"ukr_Cyrl","Umbundu":"umb_Latn","Urdu":"urd_Arab","Northern Uzbek":"uzn_Latn","Venetian":"vec_Latn","Vietnamese":"vie_Latn","Waray":"war_Latn","Wolof":"wol_Latn","Xhosa":"xho_Latn","Eastern Yiddish":"ydd_Hebr","Yoruba":"yor_Latn","Yue Chinese":"yue_Hant","Chinese (Simplified)":"zho_Hans","Chinese (Traditional)":"zho_Hant","Standard Malay":"zsm_Latn","Zulu":"zul_Latn"};

  const [menuIsOpen, setMenuIsOpen] = createSignal([]);
  const [subMenuID, setSubMenuID] = createSignal([]);
  setSubMenuID(0);

  // Variable to store most recent benchmarking data.
  const [benchmarkData, setBenchmarkData] = createSignal([]);

  const [processor, setProcessor] = createSignal("wasm");
  setProcessor("wasm");

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

      // Run the model multiple times based on the global model run count
      for (let j = 1; j < (globalModelRunCount + 1); j++) {
        // reset browser cache to clear any previous models
        caches.delete('transformers-cache');
        let cache = await caches.open('transformers-cache');

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
          const fromLanguageCode = document.getElementById("src_lang").value;
          const toLanguageCode = document.getElementById("tgt_lang").value;

          // Get user input and languages, or use default.
          let userInput = textArea.value;
          if (userInput == "") {
            userInput = textArea.placeholder;
          }

          let availableLanguages = model.languages;

          if (!Object.values(availableLanguages).includes(fromLanguageCode) || !Object.values(availableLanguages).includes(toLanguageCode)) {
            currentRow.cells[tableGenerationTimeCol].innerText = "N/A";
            currentRow.cells[tableMessageCol].innerText = "Language/s Unavailable";
            continue;
          }

          // Benchmark the model
          startTime = performance.now();

          // Generate model output
          try {
            output = await generator(userInput, {src_lang: fromLanguageCode, tgt_lang: toLanguageCode});
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

        currentRow.cells[tableGenerationTimeCol].innerText = "Uploading: " + j + "/" + globalModelRunCount;
        await new Promise(resolve => setTimeout(() => requestAnimationFrame(resolve)));
      }

      let totalGenerationTimes = benchmarkData()[model.name + "-Generate"];

      // Get the average generation time by using the reduce pattern to sum and then divide by total amount.
      let avgGenerationTime = totalGenerationTimes.reduce((a, b) => a + b) / totalGenerationTimes.length;

      totalTime = (avgGenerationTime).toFixed(2) + "s";
      currentRow.cells[tableGenerationTimeCol].innerText = totalTime;
      currentRow.cells[tableGenerationTimeCol].title = totalGenerationTimes;
      currentRow.cells[tableMessageCol].innerText = output;

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

        <div class={`${modelTestingStyles.advancedOptionsMenu} ${!menuIsOpen() ? modelTestingStyles.menuOpen : ""}`} id='advancedOptionsMenu'>
          <ul class={modelTestingStyles.optionMenuSubTabs}>
            <li><button onClick={() => setSubMenuID(0)} class={subMenuID() == 0 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>General</button></li>
            <li><button onClick={() => setSubMenuID(1)} class={subMenuID() == 1 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Summarisation</button></li>
            <li><button onClick={() => setSubMenuID(2)} class={subMenuID() == 2 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Question Answering</button></li>
            <li><button onClick={() => setSubMenuID(3)} class={subMenuID() == 3 ? modelTestingStyles.selectedOptionMenuSubTab : ""}>Translation</button></li>
          </ul>

          {/* TODO: General Options Sub Menu */}
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

          {/* Summarisatiion Sub Menu */}
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
              <option value="fra_Latn">Select Language</option>
              <For each={Object.entries(defaultLanguages)}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
              }</For>
            </select> 
            <label for="tgt_lang">To: </label>
            <select name="tgt_lang" id="tgt_lang" class={modelTestingStyles.dropDownMenu}>
              <option value="eng_Latn">Select Language</option>
              <For each={Object.entries(defaultLanguages)}>{([lang, langCode]) =>
                <option value={langCode}>{lang}</option>
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
      </div>
    </>
  );
}

export default ModelTesting;
