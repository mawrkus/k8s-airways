const UI = require('./UI');
const uiConfig = require('./config/ui-projects');

const K8sCommands = require('./K8sCommands');
const projects = require('./config/k8s-projects');

const formatRevision = require('./helpers/formatRevision');

const ui = new UI(uiConfig);
const k8sCommands = new K8sCommands();

let currentProject = null;
let currentRelease = null;
let currentPrettyRevision = null;

ui.on('item:select', async ({ listName, listIndex, itemValue }) => {
  const nextListIndex = listIndex + 1;

  /* eslint-disable no-case-declarations */
  switch (listName) {
    case 'projects':
      currentProject = projects[itemValue];
      ui.showListLoader(nextListIndex, 'Loading releases...');
      ui.setListItems(nextListIndex, currentProject.releases);
      break;

    case 'releases':
      currentRelease = itemValue;
      ui.showListLoader(nextListIndex, 'Loading revisions...');

      try {
        const {
          contexts: projectContexts,
          namespace: projectNamespace,
          maxRevisionsPerContext,
        } = currentProject;

        const allRevisions = await k8sCommands.listRevisionsForContexts(
          projectContexts,
          projectNamespace,
          currentRelease,
        );

        const prettyRevisions = [];

        allRevisions.forEach(({ context, revisions, error }) => {
          if (error) {
            prettyRevisions.push(`[${context}] ${error}`);
            return;
          }

          if (!revisions.length) {
            prettyRevisions.push(`[${context}] No revisions!`);
            return;
          }

          for (let n = 0; n < maxRevisionsPerContext && revisions[n]; n += 1) {
            prettyRevisions.push(formatRevision(revisions[n], context));
          }
        });

        ui.setListItems(nextListIndex, prettyRevisions);
      } catch (e) {
        ui.showListError(nextListIndex, e);
      }
      break;

    case 'revisions':
      currentPrettyRevision = itemValue;
      const matches = currentPrettyRevision.match(/\[([^\]]+)\] .+\((.+)\)$/);

      if (!matches) {
        ui.showListError(nextListIndex, 'Unknown revision!');
        return;
      }

      const { namespace: currentNamespace } = currentProject;
      const [, currentContext, currentRevision] = matches;

      ui.showListLoader(nextListIndex, `Rolling back to revision "${currentRevision}"...`);

      try {
        await k8sCommands.rollback(
          currentContext,
          currentNamespace,
          currentRelease,
          currentRevision,
        );

        ui.showListMessage(
          nextListIndex,
          `Rollback to revision "${currentRevision}" completed in "${currentContext}"!`,
        );
      } catch (e) {
        ui.showListError(nextListIndex, e);
      }
      break;

    default:
      break;
  }
});

ui.setListItems(0, Object.keys(projects));
