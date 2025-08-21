import mammoth from "mammoth";

/**
 * Loads the PDF.js library.
 * @return {Promise<Object>} the PDF.js library
 */
let pdfjsLib;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  try {
    pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs');
    
    if (pdfjsLib.GlobalWorkerOptions) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      } catch {
        // fallback to default worker configuration
      }
    }
    return pdfjsLib;
  } catch (error) {
    throw new Error("PDF.js library not available");
  }
}

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
    
    fileReader.onload = (event) => {
      let arrayBuffer = event.target.result;

      mammoth.extractRawText({ arrayBuffer })
        .then(function(result) {
          resolve(result.value);
        })
        .catch(function(err) {
          console.error("Error processing DOCX file:", err);
          resolve("Error processing DOCX file. Please try converting to .txt format.");
        });
    };
    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Takes a PDF file and extracts raw text using PDF.js.
 */
export async function parsePdfFileAsync(file) {
  if (!file.name.endsWith('.pdf')) {
    throw new Error("A non PDF file was passed into parsePdfFile().");
  }

  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim() || "Failed to extract text from PDF. Please try converting to .txt format.";
    
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "Failed to extract text from PDF. Please try converting to .txt format.";
  }
}