# Getting started

## Pre-requisites

- [ ] Install [Node.js v18+](https://nodejs.org/en/download/). This will also install `npm`, the Node.js package manager.
- [ ] Install [Yarn](https://yarnpkg.com/en/docs/install). This is a package manager for JavaScript.(Optional)
- [ ] Install Visual Studio Code (VS Code) or any other IDE of your choice


## Make changes locally

* Clone the repository to your local machine
* Open the project in your IDE, start the development server and make changes
* Commit and push your changes to main branch

## Publish to npm registry

* Update the version in `package.json` file. Refer to [Semantic Versioning](https://semver.org/) for versioning guidelines.
* Merge the changes to release branch.
* Push the changes to release branch. This will trigger the release pipeline which will publish the package to npm registry.

