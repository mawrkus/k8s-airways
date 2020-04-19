const UI = require('./UI');
const K8sCommands = require('./K8sCommands');
const formatRevision = require('./helpers/formatRevision');

const ui = new UI();
const k8sCommands = new K8sCommands();

let currentContext = null;
let currentNamespace = null;
let currentRelease = null;
let currentPrettyRevision = null;

ui.on('item:select', async ({ listName, listIndex, itemValue }) => {
  const nextListIndex = listIndex + 1;

  /* eslint-disable no-case-declarations */
  switch (listName) {
    case 'contexts':
      currentContext = itemValue;
      ui.showListLoader(nextListIndex, 'Loading namespaces...');

      try {
        const namespaces = await k8sCommands.listNamespaces(currentContext);
        ui.setListItems(nextListIndex, namespaces);
      } catch (e) {
        ui.showListError(nextListIndex, e);
      }
      break;

    case 'namespaces':
      currentNamespace = itemValue;
      ui.showListLoader(nextListIndex, 'Loading releases...');

      try {
        const releases = await k8sCommands.listReleases(currentContext, currentNamespace);
        ui.setListItems(nextListIndex, releases);
      } catch (e) {
        ui.showListError(nextListIndex, e);
      }
      break;

    case 'releases':
      currentRelease = itemValue;
      ui.showListLoader(nextListIndex, 'Loading revisions...');

      try {
        const revisions = await k8sCommands.listRevisions(
          currentContext,
          currentNamespace,
          currentRelease,
        );

        const prettyRevisions = revisions.map((r) => formatRevision(r, null));

        ui.setListItems(nextListIndex, prettyRevisions);
      } catch (e) {
        ui.showListError(nextListIndex, e);
      }
      break;

    case 'revisions':
      currentPrettyRevision = itemValue;
      const [, currentRevision] = currentPrettyRevision.match(/\((.+)\)$/);
      ui.showListLoader(listIndex, `Rolling back to revision "${currentRevision}"...`);

      try {
        await k8sCommands.rollback(
          currentContext,
          currentNamespace,
          currentRelease,
          currentRevision,
        );

        ui.showListMessage(listIndex, `Rollback to revision "${currentRevision}" completed!`);
      } catch (e) {
        ui.showListError(listIndex, e);
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
  } catch (e) {
    ui.showListError(0, e);
  }
})();
