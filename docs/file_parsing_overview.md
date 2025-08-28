# File Parsing System Overview

## Supported File Formats

### Plain Text Files (.txt)

Plain text files represent the simplest form of document processing, requiring only direct UTF-8 string conversion using the browser's native FileReader API with no dependencies. The processing is instantaneous regardless of file size, making it ideal for configuration files, logs, and documentation where immediate text access is needed without any computational overhead.

### HTML Files (.html)

HTML parsing strips markup tags and extracts clean text content using native JavaScript string processing methods with no external dependencies. The system systematically removes JavaScript blocks, CSS stylesheets, meta tags, and structural elements while preserving readable content and normalising whitespace, making it perfect for web page archiving and content migration with fast processing speeds.

### Word Documents (.docx)

Word document processing is done through the Mammoth.js library to translate Microsoft's Office Open XML format, extracting text from compressed XML structures while preserving paragraph breaks and handling complex formatting. The moderate processing time scales with document complexity, making it suitable for business reports, contracts, and manuscripts where structured content extraction is essential.

### PDF Files (.pdf)

PDF parsing represents the most complex operation, using the PDF.js library to perform page-by-page analysis that decodes embedded fonts and glyph positions and reconstructs readable text from positionally-scattered content fragments. This CPU bound intensive processing requires Web Worker support for optimal performance and can create noticeable delays for large documents, but handles a large range of solely text based documentation.


## Performance Characteristics Summary

| Format | Processing Speed | Memory Usage | CPU Impact |
|--------|------------------|--------------|------------|
| TXT    | Instant          | Minimal      | None       |
| HTML   | Fast             | Low          | Minimal    |
| DOCX   | Moderate         | Moderate     | Low        |
| PDF    | Variable         | High         | High       |