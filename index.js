const UI = require('./UI');
const K8sCommands = require('./K8sCommands');

const ui = new UI();
const k8sCommands = new K8sCommands({ debug: ui.debug.bind(ui) });

ui.on('item:select', async ({ list, index, value }) => {
  const nextIndex = index + 1;
  let items = [];

  ui.setListItems(nextIndex, ['Loading...']);

  switch(list) {
    case 'contexts':
      items = await k8sCommands.listNamespaces(value);
      break;

    case 'namespaces':
      items = await k8sCommands.listReleases(value);
      break;

    case 'releases':
      items = await k8sCommands.listVersions(value);
      break;

    default:
      break;
  }

  ui.setListItems(nextIndex, items);
});

(async () => ui.setListItems(0, await k8sCommands.listContexts()))();
