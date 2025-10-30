import { createSignal, For, onMount } from 'solid-js';

import styles from './ModelBenchmarking.module.css';
import { modelBenchmarks } from './modelBenchmarks.js';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';


function filterForModels(models, allModels = false) {

  if (allModels) return models;

  const qualitySortedModels = models.sort((a,b) => b.quality - a.quality);

  if (qualitySortedModels.length <= 5) {
    return qualitySortedModels;
  }

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

function changeRecommendingAllModels(modelTypes, status) {
  let models = {}
  for (const modelType of modelTypes) {
    models[modelType] = filterForModels(modelBenchmarks[modelType], status);
  }
  return models
}

function ModelRecommendation() {
  
  const speedTiers = {"fast":5,"average":10,"slow":15};
  const [sortedDefaultModels, setSortedDefaultModels] = createSignal([]);
  const allowedModelTypes = ["summarization","question-answering","translation"];
  setSortedDefaultModels(changeRecommendingAllModels(allowedModelTypes, false));

  const [sortingState, setSortingState] = createSignal({type:null,col:null,order:"desc"})
  const [defaultRecommendationType, setDefaultRecommendationType] = createSignal(allowedModelTypes[0]);

  // Recommendation Tour
  const driverObj = driver({
    showProgress: true,
    allowHtml: true,
    scrollToElement: false,
    steps: [
      { 
        element: '.pageContainer', 
        popover: { 
          title: "Getting Recommended Models", 
          description: `This page aims to help you find the best models for your needs. Click anywhere outside the highlighted area to exit this tutorial.`
        } 
      },
      {
        element: '#modelTypeTabs',
        popover: {
          title: "Choosing a Model Type",
          description: `These buttons will change which model type is shown in the table below them, the highlighted tab is the currently selected option.`
        }
      },
      {
        element: "#ModelTableArea",
        popover: {
          title: "Recommendation Table",
          description: `This table will list the best models that this program by default supports. Hover over any of the headers for more detail about a column.`
        }
      },
      {
        element: "#summarizationRecommendationSubmenu table thead",
        popover: {
          title: "Sorting the Columns",
          description: `Click any of the column headers to sort the table in descending, then ascending order by that column.`
        }
      },
      {
        element: "#showFilteredModelsOption",
        popover: {
          title: "Show More Models",
          description: `In case the filtered list of models is not enough, disabling this checkbox will show every model this application has knowledge of.`
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

  onMount(async () => {
    let tutorialSaves = JSON.parse(localStorage.getItem("tutorials")) || {};
    if (!tutorialSaves["recommendation"]) {
      driverObj.drive();
      tutorialSaves["recommendation"] = true;
      localStorage.setItem("tutorials", JSON.stringify(tutorialSaves));
    }
  });

  return (
    <>
      <div class={styles.modelTesting} id="rootElement">
        <h2>Model Recommendations</h2>
        <p>
          LocalChat currently supports three features: summarisation, question-answering, and translation.
        </p>
        <p>
          Each feature requires a 'model' to be uploaded and selected to perform the task. I.e. a summarisation model
          must be chosen to summarise some text. A default model for each task is provided in the 'web_app_[version].zip'
          under the 'models' folder.
        </p>
        <p>
          Optionally, more models can be downloaded from the <a href="https://github.com/dewcservices/LocalChat/releases">release page</a>.
          These models are described in the table below.
          Click the name of a model to be taken directly to its Hugging Face page (if internet access is available).
        </p>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <ul class={styles.optionMenuSubTabs} id="modelTypeTabs">
              <For each={allowedModelTypes}>{(type) =>
                <li><button onClick={() => setDefaultRecommendationType(type)} class={defaultRecommendationType() == type ? styles.selectedOptionMenuSubTab : ""}>{type.charAt(0).toUpperCase() + type.slice(1)}</button></li>
              }</For>
            </ul>
            
            <div id="showFilteredModelsOption">
              <label for="includeAllModels">Show filtered model list: </label>
              <input id="includeAllModels" type="checkbox" checked="true" onChange={(e) => setSortedDefaultModels(changeRecommendingAllModels(allowedModelTypes, !e.target.checked))}></input>
            </div>
            
          </div>
          <div id="ModelTableArea">
            <For each={allowedModelTypes}>{(type) =>
              <div id={type + "RecommendationSubmenu"} class={styles.defaultRecommendationMenu} classList={{ hidden: defaultRecommendationType() !== type}}>
                <table class={styles.tableMMLU}>
                  <colgroup>
                    <col style="width: 25vw;" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th rowspan="2"><button id onClick={() => sortTable(type, "Name")} title="Sort my model name">Model Information {sortingState().col == "Name" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                      <th rowspan="2"><button onClick={() => sortTable(type, "Quality")} title="Sort by (currently) output quality estimation">Output Quality {sortingState().col == "Quality" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                      <th rowspan="2"><button onClick={() => sortTable(type, "FileSize")} title="Sort my file size (Gigabytes)">File Size {sortingState().col == "FileSize" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                      <th rowspan="2"><button onClick={() => sortTable(type, "Upload")} title="Sort by speed it takes model to get the model ready to run">Upload Time Tier {sortingState().col == "Upload" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                      <th rowspan="2"><button onClick={() => sortTable(type, "Generation")} title="Sort by speed it takes model to generate an output">Run Time Tier {sortingState().col == "Generation" && sortingState().type == type ? sortingState().order == "desc" ? "⇊" : "⇈" : "⇅" }</button></th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={sortedDefaultModels()[type]}>{(model) => 
                      <tr>
                        <td><a href={model.link} target="_blank" rel="noopener noreferrer" style="color:var(--link-colour)"><b>{model.name}</b></a></td>
                        <td>{model.quality} / 10</td>
                        <td>{model.file_size} GB</td> 
                        <td
                          class={
                            model.upload_tier == "fast" ? styles.fastTierModel : "" +
                            model.upload_tier == "average" ? styles.averageTierModel : "" +
                            model.upload_tier == "slow" ? styles.slowTierModel : ""
                          }
                        >{model.upload_tier.charAt(0).toUpperCase() + model.upload_tier.slice(1)}</td> 
                        <td
                          class={
                            model.inference_tier == "fast" ? styles.fastTierModel : "" +
                            model.inference_tier == "average" ? styles.averageTierModel : "" +
                            model.inference_tier == "slow" ? styles.slowTierModel : ""
                          }>
                          {model.inference_tier.charAt(0).toUpperCase() + model.inference_tier.slice(1)}</td> 
                      </tr>
                    }</For>
                  </tbody>
                </table>
              </div>
            }</For>
          </div>
        </div>
        <br />
        <button class={styles.inputButton} id="redoTutorial" onClick={() => driverObj.drive()}>Redo tutorial</button>
      </div>
    </>
  );
}

export default ModelRecommendation;
