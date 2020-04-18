const UI = require('./UI');
const K8sCommands = require('./K8sCommands');

const ui = new UI();
const k8sCommands = new K8sCommands();

ui.on('item:select', async ({ list, index, value }) => {
  const nextIndex = index + 1;

  ui.setListItems(nextIndex, ['Loading...']);

  switch(list) {
    case 'contexts':
      const namespaces = await k8sCommands.listNamespaces(value);
      ui.setListItems(nextIndex, namespaces);
      break;

    case 'namespaces':
      const releases = await k8sCommands.listReleases(value);
      ui.setListItems(nextIndex, releases);
      break;

    case 'releases':
      const versions = await k8sCommands.listVersions(value);
      ui.setListItems(nextIndex, versions);
      break;

    case 'versions':
      await k8sCommands.rollback(value);
      break;

    default:
      break;
  }
});

(async () => ui.setListItems(0, await k8sCommands.listContexts()))();
