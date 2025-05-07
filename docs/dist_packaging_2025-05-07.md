
The team has made progress with improving the build and distribution of the app to adhere with the security constraints.

To reiterate on some of the security constraints:
- the web-app should work on an air-gapped device.
- the web-app should be able to run using the file protocol.

The team has made progress with both of these constraints.

Firstly, the last blog discussed how the team was able to inject models into the browser's cache as an adapter/patch
around how the TransformersJS library works. That allowed the app to function without making network requests. This 
week, the team edited the build script to download the models from hugging face to include them in the created dist 
folder.

Secondly, the team has integrated a single-file plugin for the Vite bundler. The web-app now compiles into a single 
html file to be run using the file protocol. 

Hence, the web-app build script now compiles the web-app into a single html file, alongside a 'models' directory
containing standard/default models. The team has tested this distribution and the web-app works for modern chrome and
edge browsers. 

Unfortunately, the app is not working with FireFox when running using the file protocol. However, when ran using the
basic fileserver executable included in the distribution the app does work on FireFox. 

Additionally, the web-app has yet to be tested on older browser versions.

To summarise:
- the app distribution now consists of `index.html` (the app), a `models` folder containing the supported models, and a
`fileserver` executable.
- `index.html` can be ran using modern Chrome and Edge browsers using the file protocol.
- Firefox cannot run the `index.html` file using the file protocol, however, can run the app using the `fileserver` 
executable.
