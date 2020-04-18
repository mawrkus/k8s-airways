const UI = require('./UI');
const K8sCommands = require('./K8sCommands');

const ui = new UI();
const k8sCommands = new K8sCommands();

ui.on('item:select', ({ list, index, value }) => {
  const nextIndex = index + 1;
  let items = [];

  ui.setListItems(nextIndex, ['Loading...']);

  switch(list) {
    case 'contexts':
      items = k8sCommands.listNamespaces(value);
      break;

    case 'namespaces':
      items = k8sCommands.listReleases(value);
      break;

    case 'releases':
      items = k8sCommands.listVersions(value);
      break;

    default:
      break;
  }

  ui.setListItems(nextIndex, items);
});

ui.setListItems(0, k8sCommands.listContexts());
