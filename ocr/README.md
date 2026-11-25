Self-hosted OCR dependencies, loaded only when a user requests plate recognition.
Photos are processed in the browser; no photo upload service is used.

- tesseract.js 6.0.1 (Apache-2.0): tesseract.min.js, worker.min.js
- tesseract.js-core 6.1.2 (Apache-2.0): tesseract-core-lstm.wasm.js
- @tesseract.js-data/eng 1.0.0 and @tesseract.js-data/kor 1.0.0,
  4.0.0_best_int language data (Apache-2.0), from the official Tesseract.js data packages.

Bundled license files and minified-code notices are included in this directory.
