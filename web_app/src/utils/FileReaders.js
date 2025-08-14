import mammoth from "mammoth";

// PDF.js setup for text extraction
let pdfjsLib;

// Lazy load PDF.js only when needed
async function loadPdfJs() {
  if (!pdfjsLib) {
    try {
      // Try local package first
      pdfjsLib = await import('pdfjs-dist');
      // Disable worker for simpler setup
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    } catch (error) {
      console.warn("Local pdfjs-dist not found, trying CDN...");
      // Fallback to CDN if local package fails
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          pdfjsLib = window.pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = null;
          resolve();
        };
        script.onerror = reject;
      });
    }
  }
  return pdfjsLib;
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
 * Takes a PDF file and extracts raw text using PDF.js for local model processing.
 * @param {File} file the PDF file
 * @return {Promise<string>} the PDF file's text content
 */
export async function parsePdfFileAsync(file) {
  if (!file.name.endsWith('.pdf')) {
    throw new Error("A non PDF file was passed into parsePdfFile().");
  }

  try {
    // Load PDF.js dynamically
    const pdfjs = await loadPdfJs();
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .filter(str => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
        
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        fullText += `[Error extracting text from page ${pageNum}]\n\n`;
      }
    }
    
    // Clean up the extracted text for model processing
    const cleanedText = fullText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n\s*\n/g, '\n')  // Remove empty lines
      .trim();
    
    if (cleanedText.length > 50) {
      return cleanedText;
    } else {
      return `PDF "${file.name}" was processed but contains minimal extractable text. This could be due to:
- Scanned/image-based PDF (requires OCR)
- Encrypted or protected content
- Complex formatting that couldn't be parsed

Extracted content: ${cleanedText}`;
    }
    
  } catch (error) {
    console.error("PDF.js extraction failed:", error);
    
    // Fallback to simple method if PDF.js fails
    console.log("Falling back to simple text extraction...");
    return fallbackTextExtraction(file);
  }
}

/**
 * Fallback text extraction method when PDF.js fails
 */
async function fallbackTextExtraction(file) {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    
    fileReader.onload = () => {
      try {
        const arrayBuffer = fileReader.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        let text = textDecoder.decode(uint8Array);
        
        // Extract readable text patterns
        const cleanText = text
          .replace(/[^\x20-\x7E\n]/g, ' ')  // Keep only printable ASCII and newlines
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .split(' ')
          .filter(word => {
            return word.length > 2 && 
                   word.length < 50 &&  // Filter out very long strings
                   !/^[A-Z0-9]+$/.test(word) &&  // Not all uppercase/numbers
                   !/obj|endobj|stream|endstream/.test(word);  // Not PDF keywords
          })
          .join(' ')
          .trim();
        
        if (cleanText.length > 50) {
          resolve(cleanText);
        } else {
          resolve(`PDF "${file.name}" processed with fallback method. For better text extraction, try:
1. Copying text directly from the PDF
2. Converting to .txt or .docx format
3. Using a PDF with selectable text (not scanned images)

Limited content extracted: ${cleanText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.error("Fallback extraction error:", error);
        resolve("Failed to extract text from PDF. Please try converting to .txt or .docx format.");
      }
    };
    
    fileReader.onerror = () => {
      resolve("Failed to read PDF file. Please try converting to .txt or .docx format.");
    };
    
    fileReader.readAsArrayBuffer(file);
  });
}