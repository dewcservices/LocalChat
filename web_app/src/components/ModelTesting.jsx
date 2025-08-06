import { createSignal } from 'solid-js';
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

    let fileText = await configFile.text();
    fileText = JSON.parse(fileText);

    setSelectedModels([...selectedModels(), fileText.fileName]);
  }

  const benchmarkModels = async () => {
    selectedModels().forEach(modelName => console.log(modelName));
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
                  <td>{model}</td>
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
