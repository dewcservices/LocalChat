import { createSignal, For } from 'solid-js';
import modelTestingStyles from './ModelTesting.module.css';
import { modelBenchmarks } from './modelBenchmarks.js';
import { A } from "@solidjs/router";

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

function ModelRecommendation() {
  
  const speedTiers = {"fast":5,"average":10,"slow":15};
  const [sortedDefaultModels, setSortedDefaultModels] = createSignal([]);
  const allowedModelTypes = ["summarization","question-answering","translation"];
  setSortedDefaultModels(changeRecommendingAllModels(allowedModelTypes, false));


  const [sortingState, setSortingState] = createSignal({type:null,col:null,order:"desc"})
  const [defaultRecommendationType, setDefaultRecommendationType] = createSignal(allowedModelTypes[0]);

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

  return (
    <>
      <div class={modelTestingStyles.modelTesting}>
        <h2>Model Recommendations</h2>
        <p>
          This table contains the list of models available from the LocalChat Github release page. You can choose a model type to focusm which is by default "Summarization", and sort by each column type to find the model that is best for your needs.
          Hover over a column name for a further description on what it lists.
          This program cannot estimate how long each model will take to run on your hardware, but the models is the "fast" speed tier should almost always be the fastest available.
          If you want to directly test any models you have downloaded to your device, or want to see how models not on this table compare, try the <A href="/testing">Model Testing Page</A>.
        </p>

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
                      >{model.upload_tier.charAt(0).toUpperCase() + model.upload_tier.slice(1)}</td> 
                      <td
                        class={
                          model.inference_tier == "fast" ? modelTestingStyles.fastTierModel : "" +
                          model.inference_tier == "average" ? modelTestingStyles.averageTierModel : "" +
                          model.inference_tier == "slow" ? modelTestingStyles.slowTierModel : ""
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
    </>
  );
}

export default ModelRecommendation;
