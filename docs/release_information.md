# Release Versions

## Upcoming Releases

### v0.0.7
The team is now focusing on:
- A model recommendation tool to add to the 'Model Testing' page.
- Getting web-workers to work with the single-file packaging and file protocol (as to enable a responsive UI).
- A settings page that will allow users to set default models, translation languages, and the importing/exporting of chats.

## Released

### [v0.0.6](https://github.com/dewcservices/LocalChat/releases/tag/v0.0.6)
- Additions:
  - A model comparison tool. This can be accessed via the 'Model Testing' link in the side bar. This tool allows users 
    to run multiple models against the same prompt to see which responses they prefer, but also the average response times
    of each model. This is essentially an alpha release and is still being built out. Future directions include a 
    recommendation system, and improvements to the UI/UX of the page.
  - An option to export and import chat histories.
  - Ability to upload PDF documents.

### [v0.0.5](https://github.com/dewcservices/LocalChat/releases/tag/v0.0.5)
- Core functionality includes:
    - Summarizing text.
    - Answering questions given some context.
    - Translating text.
- Other functionality includes:
    - The dynamic loading of models, allowing the user to select the model of their preference.
    - CPU & GPU execution based on available esources and the user's choice.
    - Taking text files as input (`.txt`, `.html`, `.docx`).
