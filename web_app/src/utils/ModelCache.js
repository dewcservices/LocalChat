// This file contains functions relating to model cacheing.
//
// TranformersJS caches models downloaded from the internet. This allows the user to upload models from their
// local filesystem. Injecting them into where TransformersJS would expect them, preventing the need for TransformersJS
// to reach out to other servers.

import { pathJoin } from "./PathJoin";
import { env } from "@huggingface/transformers";


/**
 * Returns the names of cached models.
 * @param {string} task the task (e.g. 'summarization', 'question_answer', 'translation')
 * @returns an array of strings
 */
export async function getCachedModelsNames(task) {
  let modelNames = [];

  let cache = await caches.open('transformers-cache');
  let cacheKeys = await cache.keys();
  let urls = cacheKeys.map(k => k.url);

  loop1:
  for (let k of cacheKeys) {
    if (!k.url.includes('model_files.json')) continue;

    let response = await cache.match(k);
    let array = await response.arrayBuffer();
    let decoder = new TextDecoder();
    let modelFiles = JSON.parse(decoder.decode(array));

    if (modelFiles.task != task) continue;
    
    loop2:
    for (let fileKey of modelFiles.cacheKeys) {
      if (!urls.includes(fileKey)) continue loop1;
    }

    modelNames.push(modelFiles.modelName);
  }

  return modelNames;
}

/**
 * Caches a model.
 * @param {*} files 
 * @returns the model name
 */
export async function cacheModel(files) {
  let cache = await caches.open('transformers-cache');

  let config = files.find(f => f.name == "browser_config.json")
  config = JSON.parse(await config.text());

  // This will be saved into the cache, this is a record of the initial files that were uploaded for the model.
  // This is used upon chat load when reading the cache for available models. More specifically, to validate that
  // all the required files for the model is still cached.
  let modelFiles = {
    modelName: config.modelName,
    task: config.task,
    cacheKeys: []
  };

  // Upload models to browsers cache.
  for (let file of files) {

    let cacheKey = pathJoin(
      env.remoteHost, 
      env.remotePathTemplate
        .replaceAll('{model}', config.modelName)
        .replaceAll('{revision}', 'main'),
      file.name.endsWith(".onnx") ? 'onnx/' + file.name : file.name
    );

    modelFiles.cacheKeys.push(cacheKey);

    let fileReader = new FileReader();
    fileReader.onload = async () => {
      let arrayBuffer = fileReader.result;
      let uint8Array = new Uint8Array(arrayBuffer);
      
      await cache.put(cacheKey, new Response(uint8Array));
    };
    fileReader.readAsArrayBuffer(file);
  }

  await cache.put(pathJoin(env.remoteHost, config.modelName, "model_files.json"),
    new Response((new TextEncoder()).encode(JSON.stringify(modelFiles)))
  );

  return config.modelName;
}
