import './style.css';

function getUserInput() {

  // Check if any files were uploaded.
  const fileInput = document.getElementById("fileInput");
  const folderInput = document.getElementById("folderInput");

  const inputFiles = fileInput.files;
  const inputFolder = folderInput.files;

  const allFiles = [...inputFiles, ...inputFolder];

  if (allFiles.length > 0) {

    for (const file of allFiles) {

      if (!file.name.endsWith(".txt")) {
        continue;
      }

      // Create the file reader for this file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        console.log(fileReader.result);
        addMessageToHistory("Added File " + file.name, true);
      };
      fileReader.readAsText(file);
    }

    fileInput.value = null;
    folderInput.value = null;

    document.getElementById("fileCount").innerText = "0 Files Selected";
  }

  // Check if a message was sent
  const inputTextArea = document.getElementById("inputTextArea");
  const userMessage = inputTextArea.value

  // Add the user message to the history
  if (userMessage != "") {
    addMessageToHistory(userMessage, true);
    inputTextArea.value = "";
  }
}

function addMessageToHistory(message, fromUser) {

  const messageContainer = document.getElementById("messageContainer");

  // Create a new message element.
  let newUserMessageElement = document.createElement("div");
  newUserMessageElement.innerText = message;

  if (fromUser) {
    newUserMessageElement.classList.add("userMessage");
  } else {
    newUserMessageElement.classList.add("chatbotMessage");
  }

  messageContainer.appendChild(newUserMessageElement);

}

function updateFileCount() {
  let fileCount = document.getElementById("fileInput").files.length;

  const folderInput = document.getElementById("folderInput").files;

  for (const file of folderInput) {

    // Check if the file is a valid selectable target.
    if (file.name.endsWith(".txt")) {
      fileCount++;
    }
  }

  console.log(fileCount)

  document.getElementById("fileCount").innerText = fileCount + " Files Selected";
}

document.querySelector("#submitUserQuery").addEventListener("click", getUserInput)
document.getElementById("fileInput").addEventListener("change", updateFileCount)
document.getElementById("folderInput").addEventListener("change", updateFileCount)

