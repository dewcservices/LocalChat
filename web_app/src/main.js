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

function addMessageToHistory(message, fromUser, instant = false) {

  const messageContainer = document.getElementById("messageContainer");

  // Create a new message element.
  let newUserMessageElement = document.createElement("div");
  newUserMessageElement.innerText = message;

  if (fromUser) {
    newUserMessageElement.classList.add("userMessage");
  } else if (!fromUser && !instant) {
    newUserMessageElement.classList.add("chatbotMessage");
    newUserMessageElement.classList.add("thinkingMessage");
  } else if (!fromUser && instant){
    newUserMessageElement.classList.add("chatbotMessage");
  }

  messageContainer.appendChild(newUserMessageElement);

  newUserMessageElement.scrollIntoView({ behavior: "smooth"});

  if (!fromUser && !instant) {

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

function saveChatHistoryToBrowser(id) {

  // First, read the existing local storage to check if there is a chat history for this chat ID.
  let existingHistoryKeys = localStorage.getItem(id);
  console.log("Old History String: " + existingHistoryKeys);

  // Convert the chat history into a single string.
  const messageHistory = document.getElementById("messageContainer");
  let messageString = "";
  
  for (let message of messageHistory.children) {
    if (message.classList.contains("userMessage")) {
      messageString += "U";
    } else if (message.classList.contains("chatbotMessage")) {
      messageString += "C";
    }

    // Add a value representing the total length of the messages content.
    messageString += message.innerHTML.length + ":";

    // Add the message text to the string.
    messageString += message.innerHTML + ",";

    // The final string for this message would be something like the following:
    // "U20:example user message,"
    // indicating that the message is from the User, has a message length of 20, and then the message.
  }

  console.log("New History String: " + messageString);

  localStorage.setItem(id, messageString);
  
}

function buildChatHistory(id) {

  let chatHistory = localStorage.getItem(id);
  console.log(id, chatHistory)

  // Check if there is an existing chat history in local storage.
  if (chatHistory == null) {
    // There is no chat history to switch to.
  } else {
    
    // Clear the existing message history.
    document.getElementById("messageContainer").innerHTML = "";
    document.getElementById("historyID").innerText = id;

    let index = 0;

    while(index < chatHistory.length) {

      // Start by determining if the message is from a user or chatbot.
      let messageType = chatHistory.charAt(index);
      console.log(messageType)
      index++;

      // Get the position of the colon in the current message part of the string.
      let colonIndex = index; 

      while (chatHistory.charAt(colonIndex) != ":") {
        colonIndex++;
      }
      
      // Get the length of the message.
      let messageLength = Number(chatHistory.substring(index, colonIndex));

      let message = chatHistory.substring(colonIndex + 1, colonIndex + 1 + messageLength);

      if (messageType == "U") {
        addMessageToHistory(message, true, true);
      } else if (messageType == "C") {
        addMessageToHistory(message, false, true);
      }

      // Add 2 to the index to skip past the comma.
      index = colonIndex + messageLength + 2;
    }

  }

}

window.clearLocalStorage = function() {
  localStorage.clear();
  console.log("cleared")
}

window.swapChatHistory = function(id) {
  console.log("swapping to the chat history with an ID of " + id);

  saveChatHistoryToBrowser(id);

  console.log(document.getElementById("historyID").innerText != id)

  // Check if the swapped chat history matches the current chat history.
  if (document.getElementById("messageContainer").historyID !== id) {
    buildChatHistory(id);
  }
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

