const App = require('./App');

const K8sCommands = require('./K8sCommands');
const projectsConfig = require('./config/k8s-projects');

const UI = require('./UI');
const uiConfig = require('./config/ui-projects');

const k8s = new K8sCommands();
const ui = new UI(uiConfig);

const app = new App({ k8s, ui, projectsConfig });

app.run();
