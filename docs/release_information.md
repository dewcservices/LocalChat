# Release Versions

## Upcoming Releases

### v0.0.6
The core focus of this version is to provide model testing and comparison functionality. This will allow users to
run various models against a prompt so that the user can see, the execution times of each model alongside the outputs.
Making it easier for the user to decide which model to use. Furthermore, users will be able to export this data to csv 
format.

Additionally, this aims to fix/improve various other miscellaneous items:
- A known issue is that toggling between the CPU/GPU options will not reload the current pipeline to use the 
  corresponding option. Only upon changing of the model, will the pipeline be updated to use the corresponding option.
- Editing the chat history elements so that clicking anyway on the element will take you to the chat, rather than, just
  the text.
- An option to export and import chat history. Allowing users to move between different devices or browsers.
- The ability to upload PDF documents.
- Various other UI/UX changes.
- General error handling improvements.

The team will also begin looking into the prospect of running more powerful models within the browser.

## Released

### [v0.0.5](https://github.com/dewcservices/LocalChat/releases/tag/v0.0.5)
- Core functionality includes:
    - Summarizing text.
    - Answering questions given some context.
    - Translating text.
- Other functionality includes:
    - The dynamic loading of models, allowing the user to select the model of their preference.
    - CPU & GPU execution based on available esources and the user's choice.
    - Taking text files as input (`.txt`, `.html`, `.docx`).
