# Running ONNX Models

## What is ONNX and ONNX Runtime

"ONNX is an open format built to represent machine learning models. ONNX defines a common set of operators - the 
building blocks of machine learning and deep learning models - and a common file format to enable AI developers to use 
models with a variety of frameworks, tools, runtimes, and compilers." - [https://onnx.ai/](https://onnx.ai/)

Developers can create models using a framework of their choice (such as PyTorch or TensorFlow), then convert these 
models to ONNX format. Developers can then use various [ONNX Runtimes](https://onnxruntime.ai/) to deploy their models.
In our case, we would like to use [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/). 

This is ideal for this project as we'll be able to run various models regardless of the framework used to create them.
We'll be able to use PyTorch and TensorFlow models without needing to install their relevant JS libraries. 

Additionally, ONNX Runtime Web supports [GPU acceleration](https://onnxruntime.ai/docs/tutorials/web/#:~:text=With%20onnxruntime-web,WebGPU%20and%20WebNN.).

## Getting Started

This section runs through step-by-step instructions to run a basic ONNX model using ONNX Runtime Web.

Firstly, in a new working directory run `npm install onnxruntime-web`.

Copy [this ONNX model](https://github.com/microsoft/onnxruntime-inference-examples/blob/main/js/quick-start_onnxruntime-node/model.onnx) 
into the working directory. ONNX models can be visualised using [Netron](https://netron.app/), this can be used to 
determine the models input and output layers.

Create a file `inference.js` and add the following code:

```js
import * as ort from 'onnxruntime-web';

async function main() {
    try {
        // create a new session and load the specific model.
        //
        // the model in this example contains a single MatMul node
        // it has 2 inputs: 'a'(float32, 3x4) and 'b'(float32, 4x3)
        // it has 1 output: 'c'(float32, 3x3)
        const session = await ort.InferenceSession.create('./model.onnx');

        // prepare inputs. a tensor need its corresponding TypedArray as data
        const dataA = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        const dataB = Float32Array.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
        const tensorA = new ort.Tensor('float32', dataA, [3, 4]);
        const tensorB = new ort.Tensor('float32', dataB, [4, 3]);

        // prepare feeds. use model input names as keys.
        const feeds = { a: tensorA, b: tensorB };

        // feed inputs and run
        const results = await session.run(feeds);

        // read from results
        const dataC = results.c.data;
        console.log(`data of result tensor 'c': ${dataC}`);

    } catch (e) {
        console.error(`failed to inference ONNX model: ${e}.`);
    }
}

main();
```

Now you should be able to run `node inference.js` that should successfully inference the data using the model.

To the most part this covers ONNX-Runtime-Web's interface for running ONNX models. When it comes to running LLMs
or other models, the code that differs is the pre-processing and post-processing required. 
