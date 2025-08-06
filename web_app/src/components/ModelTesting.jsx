import { createSignal } from 'solid-js';
import { pathJoin } from '../utils/PathJoin';
import { pipeline, env } from '@huggingface/transformers';
import styles from './ModelTesting.module.css'


function ModelTesting() {
  const [selectedModels, setSelectedModels] = createSignal([]);

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
      name: fileText.fileName,
      files: files,
    };

    setSelectedModels([...selectedModels(), model]);
  }

  const benchmarkModels = async () => {

    // configure transformer js environment
    env.useBrowserCache = true;
    env.allowRemoteModels = true;

    // inject models into browser cache
    let cache = await caches.open('transformers-cache');

    for (const model of selectedModels()) {
      console.log(model.name);
      // Upload models to browsers cache.
      for (let file of model.files) {
  
        let cacheKey = pathJoin(
          env.remoteHost, 
          env.remotePathTemplate
            .replaceAll('{model}', model.name)
            .replaceAll('{revision}', 'main'),
          file.name.endsWith(".onnx") ? 'onnx/' + file.name : file.name
        );
  
        let fileReader = new FileReader();
        fileReader.onload = async () => {
          let arrayBuffer = fileReader.result;
          let uint8Array = new Uint8Array(arrayBuffer);
          
          //console.log(file.webkitRelativePath, uint8Array);
          await cache.put(cacheKey, new Response(uint8Array));
        };
        fileReader.readAsArrayBuffer(file);
      }
  
      // TODO: Add line to config files to say what type of model this is.
      let generator = await pipeline('summarization', model.name);
      console.log("finished for" + model.name);
    }
  };

  const clearModels = () => {
    setSelectedModels([]);
    tempModelCount = 0;
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <>
      <div class={styles.modelTesting}>
        <h2>Model Testing:</h2>
        <h4>Select models to benchmark:</h4>

        <div>
          {/* Select Model/s for benchmarking */}
          <label for="modelInput" id="modelInputLabel" class={styles.inputButton}>
            Select Models
          </label>
          <input type="file" id="modelInput" class={styles.hidden} webkitdirectory multiple onChange={addModel} />
                      
          <button id="benchmarkButton" class={styles.inputButton} onClick={benchmarkModels}>Benchmark</button>
          <button id="clearButton" class={styles.inputButton} onClick={clearModels}>Clear Models</button>
        </div>

        {/* TODO: Add sample input field */}

        <div id="tableContainer" class={styles.tableContainer}>
          <table class={styles.tableMMLU}>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Upload Time</th>
                <th>Generation Time</th>
                <th>Sample Output</th>
              </tr>
            </thead>
            <tbody>
              <For each={selectedModels()}>{(model) =>
                <tr>
                  <td>{model.name}</td>
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
