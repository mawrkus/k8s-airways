const dayjs = require('dayjs');

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

        const prettyRevisions = revisions.map(({ app_version, revision, updated }) => {
          const date = updated ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss') : '?';
          return `${date} -> v${app_version || '?'} (${revision})`;
        });

        ui.setListItems(nextIndex, prettyRevisions);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    case 'revisions':
      const [, revision] = value.match(/\((.+)\)$/);
      ui.showListLoader(index, `Rolling back to revision "${revision}"...`);

      try {
        await k8sCommands.rollback(revision);
        ui.showListMessage(index, `Rollback to revision "${revision}" completed!`);
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

  try {
    ui.setListItems(0, await k8sCommands.listContexts());
  } catch(e) {
    ui.showListError(0, e);
  }
})();
