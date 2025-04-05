# Issues with Xenova's Transformers JS

In a [previous blog](xenova_transformers.md) the team talked about Xenova's Transformers JS library and how it could 
be used to in LocalChat. The previous blog showed some basic code and ran it using the node runtime. 

Since then the team has attempted to integrate it into the app which has led to the discovery of a current bug and 
limitation within Xenova's Transformers JS library.

Firstly, we'll discuss how the library handles models. The npm package does not included any of the models within the 
initial download. This makes sense as we wouldn't want to bloat the library with models that the user never uses.
Instead, upon the first api call and reference to a specific model, the model will be downloaded and cached for 
further use. In node, these models are stored under the node modules directory 
(`node_modules/@xenova/transformers/.cache/Xenova/{model}/`).

When running the library in the browser, the models are cached in the browser. However, there currently exists a bug 
where if the app is bundled then the library will not be able to load the model JSON correctly. Meaning that the cache
feature will not work. Details of the bug can be seen on [this github issue](https://github.com/huggingface/transformers.js/issues/366).

The current fix is to add the following lines, restricting the use of caching models:
```js
import {pipeline, env} from '@xenova/transformers';
env.allowLocalModels = false;
env.useBrowserCache = false;
```

However, this also means that Xenova's transformer library may not be suitable for our use case. We need a way of packaging 
the models within the distributable, as devices may be air-gapped. Meaning that they will not be able to download the model.

The team will further investigate whether this is possible.

2025/04/05 Update: `@xenova/transformers` is an older fork of `@huggingface/transformers`, hence, the team switched to
Hugging Face however the bug is still occurring. The team will now look into how models are cached and see if we can 
package the app with the models then inject the models into the cache.
