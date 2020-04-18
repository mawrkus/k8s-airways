const UI = require('./UI');
const K8sCommands = require('./K8sCommands');

const ui = new UI();
const k8sCommands = new K8sCommands();

ui.on('item:select', async ({ list, index, value }) => {
  const nextIndex = index + 1;

  switch(list) {
    case 'contexts':
      ui.showListLoader(nextIndex, 'Loading namespaces...');

      try {
        const namespaces = await k8sCommands.listNamespaces(value);
        ui.setListItems(nextIndex, namespaces);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    case 'namespaces':
      ui.showListLoader(nextIndex, 'Loading releases...');

      try {
        const releases = await k8sCommands.listReleases(value);
        ui.setListItems(nextIndex, releases);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    case 'releases':
      ui.showListLoader(nextIndex, 'Loading revisions...');

      try {
        const revisions = await k8sCommands.listRevisions(value);
        ui.setListItems(nextIndex, revisions);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    case 'revisions':
      const [, revision] = value.match(/\((.+)\)$/);
      ui.showListLoader(index, `Rolling back to revision "${revision}"...`);

      try {
        // TODO: result=?
        const result = await k8sCommands.rollback(revision);
        ui.showListMessage(index, `Rollback to revision "${revision}" complete!`);
        ui.focusOnList(index - 1);
      } catch(e) {
        ui.showListError(index, e);
      }
      break;

    default:
      break;
  }
});

(async () => {
  ui.showListLoader(0, 'Loading contexts...');
  ui.setListItems(0, await k8sCommands.listContexts());
})();
