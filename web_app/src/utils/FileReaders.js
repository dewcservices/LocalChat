import mammoth from "mammoth";


/**
 * Takes a txt file and return the text within it.
 * @param {File} file the txt file
 * @return {Promise<string>} the txt file's contents
 */
export function parseTxtFileAsync(file) {

  if (!file.name.endsWith('.txt')) {
    throw new Error("A non txt file was passed into parseTxtFile().");
  }

  return new Promise((resolve) => {
    let fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsText(file);
  });
}

/**
 * Takes a HTML file and returns the text within it.
 * @param {File} file the HTML file
 * @return {Promise<string>} the HTML file's contents
 */
export function parseHTMLFileAsync(file) {

  if (!file.name.endsWith('.html')) {
    throw new Error("A non HTML file was passed into parseHTMLFile().");
  }

  return new Promise((resolve) => {
    let fileReader = new FileReader();
    fileReader.onload = () => {
      let fileContent = fileReader.result;

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
      let parsedString = "";

      for (let line of unCleanedContent) {
        if (line !== "") {
          parsedString += line + "\n";
        }
      }

      resolve(parsedString);
    };
    fileReader.readAsText(file);
  });
}

/**
 * Takes in a docx file and returns the text within it.
 * @param {File} file the docx file
 * @return {Promise<string>} the docx file's contents
 */
export function parseDocxFileAsync(file) {
    
  if (!file.name.endsWith('.docx')) {
    throw new Error("A non docx file was passed into parseDocxFile().");
  }

  return new Promise((resolve) => {
    let fileReader = new FileReader();
    
    fileReader.onload = () => {
      let arrayBuffer = event.target.result;

      mammoth.extractRawText({ arrayBuffer })
        .then(function(result) {
          resolve(result.value);
        })
        .catch(function(err) {
          console.error("Error processing DOCX file:", err);
        });
    };
    fileReader.readAsArrayBuffer(file);
  });
}
