//import './style.css';
// I don't think this is needed and can be included in the html file
// I'm mainly commenting this out because it makes testing easier for me.

const allowedFileTypes = [".txt", ".html"];
let canSendMessage = true;

function getUserInput() {

  if (!canSendMessage) {
    return;
  }

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

        addMessageToHistory("Uploading 📄 " + file.name, true);
      };
      fileReader.readAsText(file);
    }

    fileInput.value = null;
    folderInput.value = null;

    document.getElementById("fileCount").innerText = "0 Files Selected";

    canSendMessage = false;
  }

  // Check if a message was sent
  const inputTextArea = document.getElementById("inputTextArea");
  const userMessage = inputTextArea.value

  // Add the user message to the history
  if (userMessage != "") {

    canSendMessage = false;
    addMessageToHistory(userMessage, true);
  }

  // Send AI response message if the user just sent a message.
  if (!canSendMessage) {
    setTimeout(() => {
      addMessageToHistory("", false);
    }, 300);
    
  }

  // Clear the message input
  inputTextArea.value = "";

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
    newUserMessageElement.classList.add("thinkingMessage");
  }

  messageContainer.appendChild(newUserMessageElement);

  newUserMessageElement.scrollIntoView({ behavior: "smooth"});

  if (!fromUser) {

    // Wait 3 seconds and then send a sample AI message.
    setTimeout(() => {

      newUserMessageElement.innerText = "Sample Message";
      newUserMessageElement.classList.remove("thinkingMessage");
      canSendMessage = true;

    }, 3000);
  }

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

let shiftKeyBeingPressed = false;

window.onload = function() {

  // Add a listener for detecting shift and enter key presses to send message.
  document.getElementById("inputTextArea").addEventListener("keydown", function (event) {
    
    if (event.key == "Shift") {
      shiftKeyBeingPressed = true;
    }
    
    // Prevent the enter key lone from moving to a new line.
    if (event.key == "Enter" && !shiftKeyBeingPressed) {
      event.preventDefault();

      // If the user can send a message, send one.
      if (canSendMessage) {
        getUserInput();
      }
      
    }

  });

  document.getElementById("inputTextArea").addEventListener("keyup", function (event) {
    
    if (event.key == "Shift") {
      shiftKeyBeingPressed = false;
    }
  });
}

