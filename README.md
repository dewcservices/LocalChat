# Index

- [LocalChat Introduction](#LocalChat)
    - [Downloading & Running the Application](#downloading-and-running-the-application)
- [Developer Information](#development)
    - [Building from Source](#building-from-source)
    - [Project Information](#project-information)
        - [LLMs/Machine-Learning in Web Browsers](#llmsmachine-learning-in-web-browsers)

# LocalChat
LocalChat is a AI chatbot that can analyze, summarize, translate, and answer questions given text-based documents as 
input.

The app differentiates itself from other LLM services by running entirely locally within the user's web-browser.
The app does make any requests over the local-network or the internet - ensuring that your data exists only 
within your local device, and that the processing is sand-boxed and contained within the browser environment.

Additionally, the app does not require any software dependencies to run. Simply download the distribution and run the
index HTML file with the file protocol.

![LocalChat-Translation](./docs/figures/LocalChat-Translation.png)

## Downloading and Running the Application

Download the app from the [release page](https://github.com/dewcservices/LocalChat/releases) and unzip to a location of
your choice. The distribution contains an `index.html` file alongside a `models` folder.

The app runs simply via double-clicking the `index.html` file included within the app distribution. This opens the file
using the `file:///` protocol, requiring only the browser to run the app. Meaning the app will be sand-boxed within the 
browser's execution environment.

When using the application, models must be loaded in for use. The distribution contains some models out of the box for
this purpose, however, the app also supports custom models (refer to the GitHub Pages for more details).

> Note: Currently the app works on Chrome and Edge browsers, however, to run on Firefox, the app must be ran via a
> fileserver. Hence, the distribution contains fileserver executables (Windows & Linux) that runs on localhost:8080.
> This is not required to run the app and will not be touched when running the app via the file protocol. For extra 
> insurance, feel free to delete these files.

# Development

The section below is for developers.

## Building from Source

Prerequisites:
- Install the Go toolchain - https://go.dev/doc/install
- Install nvm (node & npm) - [nvm for linux](https://github.com/nvm-sh/nvm) or [nvm for windows](https://github.com/coreybutler/nvm-windows)

Clone the repo to your local device with `git clone https://github.com/dewcservices/LocalChat.git`.

Cd into the web_app folder, `cd LocalChat/web_app`.

Run `npm install` to install the npm dependencies.

Run `npm run build-local-chat` to build the distribution. This distribution should be found in the root directory
of the project, `LocalChat/dist`.

> Optionally, run `npm run build-local-chat wm` to build the distribution without downloading the models.

If using chrome or edge browsers simply double-click the `LocalChat/dist/index.html` file to run the app (this should
open the app in the browser using the file protocol).

If using Firefox, the app must be ran with a local fileserver executable, on Windows `LocalChat/dist/fileserver.exe`,
on Linux `LocalChat/dist/fileserver`. Open http://localhost:8080/ in your browser and the app should be running.

## Project Information

### LLMs/Machine-Learning in Web Browsers

The dev team has identified four main frameworks to run LLM/machine-learning models within the browser:

- [TensorFlow.js](https://www.tensorflow.org/js)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [Transformers.js](https://huggingface.co/docs/transformers.js/index)
- [WebLLM](https://webllm.mlc.ai/docs/)

#### TensorFlow.js
A platform for machine learning tasks, supporting the creation, training, and inferencing of neural networks.
TensorFlow initially released in 2015, and has since grown into a large ecosystem primarily built in Python. 
A JavaScript port of the API was released in 2019.

Hence, TensorFlow.js taps into a large pre-existing ecosystem with extensive documentation & tutorials.

#### ONNX Runtime Web
ONNX Runtime Web is used to run ONNX models in web environments.

Each framework (TensorFlow, Pytorch, etc.) has their own model format, which limits interoperability. The ONNX model
format was created to address this - providing a single model format that frameworks could export their models to and
import their models from. 

In addition, ONNX runtimes were created to simplify the deployment of these models - de-coupling the inferencing code
from the framework used to create/train the model.

Hence, ONNX Runtime Web is the web version of the runtime. ONNX Runtimes support generalized machine learning models,
the provided APIs are low-level, requiring the developer to handle inputs, outputs, and tensor shapes manually. The
documentation assumes some level of experience with machine learning.

#### Transformers.js
Similarly to TensorFlow.js, Transformers.js is the JavaScript port of an existing Python library, namely Transformers.
Transformers is part of the Hugging Face ecosystem, known for its simple APIs and the ability to easily load pre-trained
models included within their public online library.

Transformers.js is built on top of ONNX Runtime Web - i.e. an abstraction simplifying the process of running language,
vision, and audio processing tasks.

#### WebLLM
As the name implies, WebLLM is specially built to run LLMs in the web rather than general machine learning models.
Hence, WebLLM is better optimized for running models such as LLaMA, Mistral, and Phi than the other frameworks.

#### Framework Choice for LocalChat
As LocalChat aims to focus on language processing tasks, the team leant towards Transformers.js and WebLLM.

The app currently uses Transformer.js, providing a UI for the features, and packaging the app in a way that allows
it to be ran offline, using the file protocol.

More details on this can be seen within the Github Pages.

In terms of future development, the app could also integrate WebLLM and allow users to interact with conversational 
models. The app currently does not due to limitations with web workers and WebLLM performance. See Github Pages for
more details. The TLDR is that web workers cannot be used given the current requirements, and WebLLM can take minutes 
to generate a response to a prompt. Combined, this means that the app will hang for minutes at a time.
