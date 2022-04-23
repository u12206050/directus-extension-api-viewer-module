# Directus Api Viewer Module

View your Directus Api documentation within the App.

Documentation is based on the permissions for the current user.

![ApiViewer](./screenshots/ApiViewer.gif "ApiViewer")


## Installation

 - Download the latest [release](https://github.com/u12206050/directus-extension-api-viewer-module/releases/latest)
 - Unzip and move `index.js` to `[YOUR_PROJECT]/extensions/modules/api-viewer/index.js`

## Shoutout

Based on the awesome rapidoc component by [@mrin9](https://github.com/mrin9/RapiDoc)

## Development

 - Pull repo to `[YOUR_PROJECT]/packages/modules/api-viewer`
 - Run `npm install`
 - Run `npm run dev`
   - Watches and rebuilds on changes
   - Moves built index.js to `[YOUR_PROJECT]/extensions/modules/api-viewer/index.js`
 - Run `npm run build`
   - Builds index.js to `[YOUR_PROJECT]/extensions/modules/api-viewer/index.js`

## Contributing

 - Fork this repo
 - Create a new branch
   - `feat/[YOUR_FEATURE]`
   - `fix/[YOUR_BUG | ISSUE]`
 - Make your changes
 - Commit and push
 - Create a pull request