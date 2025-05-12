import { createSignal, createEffect } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import './ModelTesting.css'


const [selectedModels, setSelectedModels] = createSignal([]);

let tempModelCount = 0;
const addModel = () => {
    tempModelCount++;
    setSelectedModels([...selectedModels(), "Model" + tempModelCount]);
}

const benchmarkModels = async () => {
    document.getElementById("modelSelectButton").disabled = true;
    document.getElementById("benchmarkButton").disabled = true;
    
    let headerCount = document.getElementById("tableContainer").querySelector("table").querySelector("thead").querySelector("tr").children.length;
    let tbody = document.getElementById("tableContainer").querySelector("table").querySelector("tbody");

    for (let i = 0; i < selectedModels().length; i++) {
        await wait(1000);

        let currentRow = tbody.children[i];

        // Clear existing values;
        while (currentRow.children.length > 1) {
            currentRow.removeChild(currentRow.lastChild);
        }

        // Add temporary random values;
        for (let j = 1; j < headerCount; j++) {
            let newCell = document.createElement("th");
            newCell.innerHTML = Math.round(Math.random() * 100) / 100;
            currentRow.appendChild(newCell);
        }

    }

    document.getElementById("modelSelectButton").disabled = false;
    document.getElementById("benchmarkButton").disabled = false;
}

const clearModels = () => {
    setSelectedModels([]);
    tempModelCount = 0;
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function ModelTesting() {
    return (
        <>
            <div class="modelTesting">
                <h2>Model Testing:</h2>
                <h4>Select models to benchmark:</h4>

                <div>
                    <button id="modelSelectButton" class="inputButton" onClick={addModel}>Select Model</button>
                    <button id="benchmarkButton" class="inputButton" onClick={benchmarkModels}>Benchmark</button>
                    <button id="clearButton" class="inputButton" onClick={clearModels}>Clear Models</button>
                </div>

                <div id="tableContainer" class="tableContainer">
                    <table class="tableMMLU">
                        <thead>
                            <tr>
                                <th>Model</th>
                                <th>Overall Score</th>
                                <th>Benchmark 1</th>
                                <th>Benchmark 2</th>
                                <th>Benchmark 3</th>
                                <th>Benchmark 4</th>
                                <th>Benchmark 5</th>
                                <th>Benchmark 6</th>
                                <th>Benchmark 7</th>
                                <th>Benchmark 8</th>
                                <th>Benchmark 9</th>
                                <th>Benchmark 10</th>
                                <th>Benchmark 11</th>
                                <th>Benchmark 12</th>
                                <th>Benchmark 13</th>
                                <th>Benchmark 14</th>
                                <th>Benchmark 15</th>
                                <th>Benchmark 16</th>
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
    )
}

export default ModelTesting;