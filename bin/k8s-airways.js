#!/usr/bin/env node

/* eslint-disable no-console, import/no-dynamic-require */

const path = require('path');

const program = require('commander');
const { version } = require('../package');

const UI = require('../UI');
const K8sCommands = require('../K8sCommands');
const App = require('../App');

program
  .version(version)
  .option('-p, --projects [file]', 'projects config file, required', String, '')
  .option('-u, --ui [file]', 'UI config file, required', String, '')
  .parse(process.argv);

['projects', 'ui'].forEach((f) => {
  if (!program[f]) {
    console.error(`Have you forgotten to specify a ${f} config file? ;)`);
    program.help();
  }
});

const projectsConfig = require(path.join(process.cwd(), program.projects));
const uiConfig = require(path.join(process.cwd(), program.ui));

const k8s = new K8sCommands();
const ui = new UI(uiConfig);

const app = new App({ k8s, ui, projectsConfig });

app.run();
