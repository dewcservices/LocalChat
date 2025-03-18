# Choosing a JS Framework
The app is to be a single-page-application that can be ran directly from the filesystem using the `file:///` protocol.
Hence, all the required files (HTML, JS, CSS, WASM, etc.) should all be included within the distribution (a single 
downloadable directory). The smaller this distribution the better. Therefore, using either vanilla JS or a lightweight
framework is important.

Three web-apps were created using `npm create vite@latest`, one in VanillaJS, one in ReactJS, and one in SolidJS.
Using the default apps, they were bundled using vite: `npm run build`. Producing the following `dist` sizes on disk:
- VanillaJS - 16KB
- SolidJS - 24KB
- ReactJS - 204KB

For now the team chose to just use VanillaJS as the project scope is fairly small in terms of the front-end.

However, in future, if it does become difficult to maintain the codebase in VanillaJS, we may move to SolidJS.
