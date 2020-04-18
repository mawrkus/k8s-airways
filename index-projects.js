const UI = require('./UI');
const uiConfig = require('./config/ui-projects');

const K8sCommandsProjects = require('./K8sCommands-projects');
const projects = require('./config/k8s-projects');

const ui = new UI(uiConfig);
const k8sCommands = new K8sCommandsProjects();

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
        const revisions = await k8sCommands.listProjectRevisions(value);
        ui.setListItems(nextIndex, revisions);
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
        ui.focusOnList(index);
      } catch(e) {
        ui.showListError(nextIndex, e);
      }
      break;

    default:
      break;
  }
});

(async () => {
  ui.setListItems(0, Object.keys(projects));
})();