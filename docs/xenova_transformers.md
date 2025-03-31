# Transformer JS

After little progress being made on getting the T5 ONNX model to work. The team looked into the Transformer JS library.

Transformer JS is a npm package that runs transformers in the browser. The library uses ONNX Runtimes under the hood 
and supports many natural language processing tasks as well as many models out of the box. Providing the `pipeline` 
interface to allow users to easily choose tasks, models, and run inferencing.

## Getting Started

See the [official documentation](https://www.npmjs.com/package/@xenova/transformers).

Run `npm install @xenova/transformers`.

Then create a inference.js file with the following code:

```js
import { pipeline } from '@xenova/transformers';

let summarizer = await pipeline('summarization', 'Xenova/t5-base');

let text = `Some long piece of text...`;

let summary = await summarizer(text, { max_length: 50 });

console.log(summary);
```

This is all that is required to run a summarisation model. 
Other models that can be used can be seen within the [official documentation](https://www.npmjs.com/package/@xenova/transformers#:~:text=supported%20tasks%2Fmodels).

Alternatively, a question-answer pipeline can be seen below:

```js
import { pipeline } from '@xenova/transformers';


let answerer = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad');

let question = 'Who was Jim Henson?';

let context = 'Jim Henson was a nice puppet.';

let output = await answerer(question, context);

console.log(output);
```

See the documentation for all supported tasks.

