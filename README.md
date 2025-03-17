# LocalChat
LocalChat is a AI chatbot that can anaylse, summarise, and answer questions given text-based documents as input.

The app differentiates itself from other LLM services by running entirely locally within the user's web-browser.
The app does make any requests over the local-network or the internet - ensuring that your data exists only 
within your local device.

Additionally, the app does not require any software dependencies to run. Simply download and run.

## Running the Application
In future, the app should run simply via double-clicking the `index.html` file included within the app distribution. 
This opens the file using the `file:///` protocol, requiring only the browser to run the app. Meaning the app will be
sand-boxed within the browser's execution environment.

However, initial versions of the app require a basic fileserver executable to be ran on the local device due to CORS
restrictions.
