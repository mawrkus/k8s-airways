const UI = require('./UI');
const uiConfig = require('./config/ui-projects');

const K8sCommandsForProjects = require('./K8sCommandsForProjects');
const projects = require('./config/k8s-projects');

const formatRevision = require('./helpers/formatRevision');

const ui = new UI(uiConfig);
const k8sCommands = new K8sCommandsForProjects();

ui.on('item:select', async ({ list, index, value }) => {
  const nextIndex = index + 1;

  switch(list) {
    case 'projects':
      ui.showListLoader(nextIndex, 'Loading releases...');

      const project = projects[value];
      k8sCommands.setContexts(project.contexts);
      k8sCommands.setNamespace(project.namespace);

      ui.setListItems(nextIndex, project.releases);
      break;

    case 'releases':
      ui.showListLoader(nextIndex, 'Loading revisions...');

      try {
        const allRevisions = await k8sCommands.listProjectRevisions(value);
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

          [0, 1, 2]
            .filter((n) => revisions[n])
            .forEach((n) => prettyRevisions.push(
              formatRevision(revisions[n], context)),
            );
        });

        ui.setListItems(nextIndex, prettyRevisions);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    case 'revisions':
      const matches = value.match(/\[([^\]]+)\] .+\((.+)\)$/);
      if (!matches) {
        ui.showListError(nextIndex, 'Unknown revision!');
        return;
      }

      const [, context, revision] = matches;
      ui.showListLoader(nextIndex, `Rolling back to revision "${revision}"...`);

      try {
        k8sCommands.setContext(context);
        await k8sCommands.rollback(revision);

        ui.showListMessage(nextIndex, `Rollback to revision "${revision}" completed in "${context}"!`);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    default:
      break;
  }
});

ui.setListItems(0, Object.keys(projects));
