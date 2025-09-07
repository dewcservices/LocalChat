# Status Update – PDF parsing update and process flow

## Root Cause Identification
The PDF parsing functionality works correctly, but worker initialisation failures stem from **Vite's module bundling interfering with PDF.js worker path resolution**. This is not a JavaScript or Web Worker limitation but more specifically how vite handles module resolution for external workers.

The core problem lies in how Vite processes and bundles modules during the build phase. While PDF.js expects its worker script to be available at a predictable path, Vite's optimisation processes create conflicts with these expectations.

## PDF vs Text Parsing Complexity
comparing both the way in which the system processes/parses PDF in comparison to documents such as plain text files showcases why without the help of worker threads initiallising correctly will impact performance dramatically.

### Plain Text Parsing
Plain text parsing represents the simplest form of file processing - essentially a direct byte-to-string conversion with minimal processing overhead. The entire operation involves reading the file bytes and interpreting them as UTF-8 encoded characters, making it nearly instantaneous regardless of file size.

### PDF Parsing Process
PDF parsing is whole different story as the process involves a complex multi-stage process that places great stress on the systems CPU:

**Stage 1: Binary Structure Decoding** - Firstly the system must parse the complex PDF binary format, including cross-reference tables that map object locations within the file. This involves understanding a given PDF's internal object structure and handling various compression algorithms.

**Stage 2: Font & Glyph Processing** - PDFs contain embedded fonts with character encoding systems that must be decoded. The parser handles font substitutions, glyph mapping, and text rendering metrics to accurately extract readable characters.

**Stage 3: Text Extraction with Positioning** - Unlike plain text, PDF text exists as positioned fragments scattered throughout the document. The parser must extract these fragments along with their spatial coordinates and reconstruct proper reading order with some semblance of formatting.

**Stage 4: Content Assembly** - Finally, the system reconstructs readable text from the dispersed content blocks, handling line breaks, paragraph structure, and maintaining logical document flow.

## Notable Performance Impacts and Solutions
When the dedicated worker fails to initialise, the PDF.js library will fall back to a "fake worker" that processes everything on the main event thread. While this maintains functionality, it creates several significant performance problems that directly impact user experience.

Some of the notable issues being:

- **Main Thread Blocking**: Sequential page processing without yielding control back to the browser will create notable UI freezes that can last several seconds this effect will only compound wither larger documents.

- **No Progress Feedback**: From the users POV they will encounter an unresponsive interface during the parsing with no indication of progress or time remaining.

- **Memory Accumulation**: All PDF processing data structures remain in main thread memory, which could potentially cause memory pressure on resource-constrained devices.

- **Perceived Application Hangs**: Large documents create extended periods of complete unresponsiveness, making the application appear crashed or frozen.

### Primary Bottleneck
The core performance issue stems from the sequential processing approach without proper yielding:

```javascript
// Sequential processing without yielding
for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  // No control yielding between iterations
}
```

This processing loop runs continuously iterating through each page of an uploaded PDF type document without yielding control back to the browser's event loop. For smaller documents this is not an issue but for documents with many pages, this can block the main thread for extended periods, making the entire application appear frozen to users.

The worker initialisation failure is a **Vite configuration issue**, not a fundamental platform limitation. The fake worker fallback functions correctly but creates performance bottlenecks due to PDF parsing complexity running entirely on the main thread.