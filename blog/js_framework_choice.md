# Choosing a JS Framework
The app is to be a single-page-application that can be ran directly from the filesystem using the `file:///` protocol.
Hence, all the required files (HTML, JS, CSS, WASM, etc.) should all be included within the distribution (a single 
downloadable directory). The smaller this distribution the better. Therefore, using either vanilla JS or a lightweight
framework is important.

This project chose to use SolidJS. This was due to SolidJS's light distributution size. 

Three web-apps were created using `npm create vite@latest`, one in VanillaJS, one in ReactJS, and one in SolidJS.
Using the default apps, they were bundled using vite: `npm run build`. Producing the following `dist` sizes on disk:
- VanillaJS - 16KB
- SolidJS - 24KB
- ReactJS - 204KB

SolidJS was chosen due to its small size whilst providing the benefits of a declarative JS framework.
Additionally, SolidJS provides a developer experience close to that of ReactJS, making it easy for onboarding developers.
