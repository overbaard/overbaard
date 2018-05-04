# Overbård
Overbård is a Kanban board integrating with Jira. It is implemented as a Jira plugin with an Angular client running in the browser. It's evolution of Jirban project https://github.com/jirban/jirban-jira/

## Build and test UI
```bash
cd webapp/
node --version ## ensure you have version >=4 <=9
yarn install && yarn build
yarn start
yarn test ## or yarn test:travis-headless
```
Downgrade Node 9 in MacOS - https://medium.com/@mahasakpijittum/downgrade-node-9-in-macos-18a3a55d5436

## Build the package
 * Install Atlassian SDK - https://developer.atlassian.com/docs/getting-started/set-up-the-atlassian-plugin-sdk-and-build-a-project.
 * Run `atlas-package -Dob.ui.deps -Dob.ui`