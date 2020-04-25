#!/usr/bin/env node

/* eslint-disable no-console, import/no-dynamic-require */

const fs = require('fs');
const path = require('path');

const program = require('commander');
const { version } = require('../package');

const UI = require('../src/UI');
const K8sCommands = require('../src/K8sCommands');
const App = require('../src/App');

// eslint-disable-next-line consistent-return
function loadProjectsConfig(filePath) {
  try {
    const json = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    return JSON.parse(json);
  } catch (e) {
    console.error(`Error while loading projects config file "${filePath}"!`);
    console.error(e);
    process.exit(1);
  }
}

program
  .version(version)
  .option('-c, --config [file]', 'optional config file for projects', String, '')
  .parse(process.argv);

const projectsConfig = program.config
  ? loadProjectsConfig(program.config)
  : null;

const uiConfig = projectsConfig
  ? require(path.join(__dirname, '../config/ui-projects.json'))
  : require(path.join(__dirname, '../config/ui.json'));

const k8s = new K8sCommands();
const ui = new UI(uiConfig);

const app = new App({ k8s, ui, projectsConfig });

app.run();
