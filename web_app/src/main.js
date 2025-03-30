//import './style.css';
// I don't think this is needed and can be included in the html file
// I'm mainly commenting this out because it makes testing easier for me.

const allowedFileTypes = [".txt", ".html"];

function getUserInput() {

  // Check if any files were uploaded.
  const fileInput = document.getElementById("fileInput");
  const folderInput = document.getElementById("folderInput");

  const inputFiles = fileInput.files;
  const inputFolder = folderInput.files;

  const allFiles = [...inputFiles, ...inputFolder];

  if (allFiles.length > 0) {

    for (const file of allFiles) {

      if (!checkFileType(file.name)) {
        continue;
      }

      // Create the file reader for this file
      const fileReader = new FileReader();
      fileReader.onload = () => {

        if (file.name.endsWith(".html") && document.getElementById("parseHTML").checked) {
          console.log(processHTMLFile(fileReader.result));
        } else {
          console.log(fileReader.result);
        }

        addMessageToHistory("📄 " + file.name, true);
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

  newUserMessageElement.scrollIntoView({ behavior: "smooth"});

}

function updateFileCount() {
  let fileCount = document.getElementById("fileInput").files.length;

  const folderInput = document.getElementById("folderInput").files;

  for (const file of folderInput) {

    // Check if the file is a valid selectable target.
    if (checkFileType(file.name)) {
      fileCount++;
    }
  }

  document.getElementById("fileCount").innerText = fileCount + " Files Selected";
}

function processHTMLFile(fileContent) {

  // Remove JS from the parsed html file content.
  fileContent = fileContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Remove CSS from the parsed html file content.
  fileContent = fileContent.replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Remove other design or meta tags from the parsed html file content.
  fileContent = fileContent.replace(/<meta[^>]*>/gi, '');
  fileContent = fileContent.replace(/<link[^>]*>/gi, '');
  fileContent = fileContent.replace(/<html[^>]*>/gi, '');
  fileContent = fileContent.replace("</html>", '');
  fileContent = fileContent.replace(/<head[^>]*>/gi, '');
  fileContent = fileContent.replace("</head>", '');
  fileContent = fileContent.replace(/<!doctype[^>]*>/gi, '');
  fileContent = fileContent.replace(/<body[^>]*>/gi, '');
  fileContent = fileContent.replace("</body>", '');

  // Remove tab characters.
  fileContent = fileContent.replace(/\t/g, "");
  fileContent = fileContent.replace(/    /g, "");

  // Remove newline characters.
  let unCleanedContent = fileContent.split("\r\n");
  let parsedString = ""

  for (let line of unCleanedContent) {
    if (line !== "") {
      parsedString += line + "\n";
    }
  }

  return parsedString;
}

function checkFileType(fileName) {
  const fileExtension = fileName.slice(fileName.lastIndexOf("."));

  for (let extension of allowedFileTypes) {
    if (extension === fileExtension) {
      return true;
    }
  }
  return false;
}

document.querySelector("#submitUserQuery").addEventListener("click", getUserInput)
document.getElementById("fileInput").addEventListener("change", updateFileCount)
document.getElementById("folderInput").addEventListener("change", updateFileCount)

window.onload = function() {
  const webkitdirectoryEnabled = 'webkitdirectory' in document.createElement('input')
  if (!webkitdirectoryEnabled) {
    document.getElementById("folderInput").disabled = true;
    document.getElementById("folderInputLabel").classList.add("disabledButton");
    document.getElementById("folderInputLabel").title = "Disabled due to outdated browser."
  }
}

