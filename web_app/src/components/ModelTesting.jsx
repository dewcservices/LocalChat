import { createSignal, createEffect } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import './ModelTesting.css'

const selectedModels = [];

function ModelTesting() {
    return (
        <>
            <div class="modelTesting">
                <h2>Model Testing:</h2>
                <h4>Select models to benchmark:</h4>

                <div>
                    <label for="modelSelect" class="modelSelectLabel">Select Models</label>
                    <input type="file" id="modelSelect" webkitdirectory multiple />
                </div>

                <Show if={selectedModels.length > 0}>
                    <div class="tableContainer">
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
                                <For each={{selectedModels}}>{() =>
                                    <tr>
                                        <td>Yes</td>
                                    </tr>
                                }</For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>
        </>
    )
}

export default ModelTesting;