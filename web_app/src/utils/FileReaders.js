import mammoth from "mammoth";

// PDF.js setup - simplified loading
let pdfjsLib;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  try {
    console.log("Attempting to load local pdfjs-dist...");
    // Use the correct path for version 5.x
    pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs');
    
    // For newer versions, either don't set workerSrc or set it to a valid worker path
    if (pdfjsLib.GlobalWorkerOptions) {
      // Try to set the worker to the local worker file
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
      } catch {
        // If that fails, just don't set it (let PDF.js handle it)
        console.log("Using default worker configuration");
      }
    }
    console.log("Local pdfjs-dist loaded successfully");
    return pdfjsLib;
  } catch (error) {
    console.log("Local pdfjs-dist not available, error:", error.message);
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
    console.log("Starting PDF parsing for:", file.name);
    const pdfjs = await loadPdfJs();
    console.log("PDF.js loaded, reading file...");
    
    const arrayBuffer = await file.arrayBuffer();
    console.log("File read, creating PDF document...");
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded successfully, ${pdf.numPages} pages found`);
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Extracting text from page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log("Text extraction completed");
    return fullText.trim() || "Failed to extract text from PDF. Please try converting to .txt format.";
    
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "Failed to extract text from PDF. Please try converting to .txt format.";
  }
}