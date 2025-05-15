
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

### To summarise:
- `index.html`is the **single-file**.
- `models/` is the directory that contains all the downloaded supported TransformerJS models.
- `fileserver` executable used for serving over HTTP.

#### Brower support over `file://`
As of now we have verified that the following browsers are supported:
| Browser     | Status      |
| ----------- | ----------- |
| Modern Chrome      | ✅          |
| Moden Edge        | ✅          |
| Modern FireFox| ❌* |
- *firefox as of now doesnt work, however if launched via the included `fileserver`, firefox works fine.

#### Debugging steps and other considerations:
- We did breifly look into why firefox doesn't work as to disable javascript minification during bundling as to get a clearer picture and pinpoint why it only errors on firefox.
- However, the specifications only requires both chrome and edge support over `file://`, thus we decided not to persue this any further.

#### Next steps
- Testing the `file://` with older versions of edge and chrome.
- We may come back and revisit the firefox support if time allows as to make a more **robust system**.