# Offline Single Page Application Testing

The requirements state that we should create a single-page-application (SPA) that can be ran simply using the `file://` 
protocol. No server should be involved and the app should work offline (within a completely locked down environment).

The UI/UX requirements are minimal with the main focus of the project being the performance and operation of the 
ML models. Hence, vanilla JS will likely be used for the front-end, however, we would still like to use npm modules 
as the ONNX runtime web module is a promising way to run models within the browser.

JavaScript can import modules from CDNs, however, this app needs to work offline. Hence, we would like to bundle the
necessary JavaScript modules within the distributution of the app. This directory involves the testing of bundling an 
app using Vite, and attempting to run it offline.

The main goal is to bundle any NPM module and be able to run it offline/completely-locally. This test attempts to 
bundle a Solid JS app + the ONNX Runtime Web package.

## Getting a Solid JS App to Work Without a Server

Firstly we need to create the solid app. I am using a Linux device for this test.

1. Install `nvm` (node & npm), see (https://github.com/nvm-sh/nvm).

2. Once installed, we can create the solid application, `npm create vite@latest {desired project/folder name}`, when 
prompted, select `solid` and `javascript`. 

3. `cd {desired project/folder name}` and run `npm install`

4. We can now install ONNX Runtime Web with `npm install onnxruntime-web`. 

5. We can add the following code into `src/App.jsx`:

```jsx
import * as ort from 'onnxruntime-web'

async function inference() {
  try {
      // create a new session and load the specific model.
      //
      // the model in this example contains a single MatMul node
      // it has 2 inputs: 'a'(float32, 3x4) and 'b'(float32, 4x3)
      // it has 1 output: 'c'(float32, 3x3)
      const session = await ort.InferenceSession.create('/model.onnx');

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
```

Within the HTML of the component we can add a button to call this function:

```jsx
<button onClick={() => inference()}>
  inference
</button>
```

Next we download the ONNX file from this github repo: https://github.com/microsoft/onnxruntime-inference-examples/blob/main/js/quick-start_onnxruntime-node/model.onnx

Place this ONNX file the public folder.

6. `npm run build`, this bundles the SPA into the `./dist` directory to facilitate easy distribution of the SPA.

7. Open a browser and attempt to access the `file:///{your_path}/dist/index.html` file. This should not work. In 
the developer console you should see a [CORS error](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp). 
This is a limitation with using the `file:///` protocol, we can still load JavaScript files in with `script` tags 
that use relative paths. However, any imports within the JavaScript files will not work; 
`import data from './data.json'` will not work. This makes it practically impossible to use any npm modules.
Additionally, `fetch('file.txt')` will not work.

8. To get around this we can use a lightweight fileserver hosted on the client device. However, using GoLang, this 
fileserver can be as simple as an executable included in the `dist` folder.
This goes against requirements, but still enables a user to easily run the application locally, without 
tampering with the system or going to complicated lengths to setup a server. Additionally, this allows us to use 
front-end frameworks AND npm modules. This means that rather than using WASM we can use established modules such 
as ONNX runtime web which is optimized for the browser, and uses WASM under the hood, with functionality for WebGL 
support (GPU utilization).

However, this is still undesirable for the desired use case. Hence, in future we'd like to support a build that does 
not require an executable to be ran. And will likely take an approach similar to TiddlyWiki (bundling the code into
a single HTML file).
