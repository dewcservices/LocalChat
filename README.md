# LocalChat
LocalChat is a AI chatbot that can anaylse, summarise, translate, and answer questions given text-based documents as 
input.

The app differentiates itself from other LLM services by running entirely locally within the user's web-browser.
The app does make any requests over the local-network or the internet - ensuring that your data exists only 
within your local device, and that the processing is sand-boxed and contained within the browser environment.

Additionally, the app does not require any software dependencies to run. Simply download the distribution and run the
index HTML file with the file protocol.

![LocalChat-Translation](./docs/figures/LocalChat-Translation.png)

> Note: This app is still in development and contains various incomplete features.

## Downloading and Running the Application

Download the app from the [release page](https://github.com/dewcservices/LocalChat/releases) and unzip to a location of
your choice. The distribution contains an `index.html` file alongside a `models` folder.

The app runs simply via double-clicking the `index.html` file included within the app distribution. This opens the file
using the `file:///` protocol, requiring only the browser to run the app. Meaning the app will be sand-boxed within the 
browser's execution environment.

When using the application, models must be loaded in for use. The distribution contains some models out of the box for
this purpose, however, the app also supports custom models (refer to the GitHub Pages for more details).

> Note: Currently the app works on Chrome and Edge browsers, however, to run on Firefox, one must access the app via a
> fileserver. Hence, the distribution contains a filerserver executable that runs on localhost:8080. This is not 
> required to run the app and will not be touched when running the app via the file protocol. For extra insurance, feel
> free to delete this file.

## Development

The section below is for developers of the project.

### Building from Source

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
