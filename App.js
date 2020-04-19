const formatRevision = require('./helpers/formatRevision');

class App {
  constructor({ k8s, ui, projectsConfig }) {
    this.k8s = k8s;
    this.ui = ui;
    this.projectsConfig = projectsConfig;

    this.currentProject = null;
    this.currentRelease = null;

    this.onItemSelected = this.onItemSelected.bind(this);
  }

  run() {
    this.ui.on('item:select', this.onItemSelected);
    this.ui.setListItems(0, Object.keys(this.projectsConfig));
  }

  onItemSelected({ listName, listIndex, itemValue }) {
    switch (listName) {
      case 'projects':
        this.loadReleases(listIndex, itemValue);
        break;

      case 'releases':
        this.loadRevisions(listIndex, itemValue);
        break;

      case 'revisions':
        this.rollback(listIndex, itemValue);
        break;

      default:
        break;
    }
  }

  async loadReleases(listIndex, projectName) {
    const nextListIndex = listIndex + 1;
    this.currentProject = this.projectsConfig[projectName];
    this.ui.showListLoader(nextListIndex, 'Loading releases...');
    this.ui.setListItems(nextListIndex, this.currentProject.releases);
  }

  async loadRevisions(listIndex, releaseName) {
    const nextListIndex = listIndex + 1;
    this.currentRelease = releaseName;
    this.ui.showListLoader(nextListIndex, 'Loading revisions...');

    try {
      const {
        contexts: projectContexts,
        namespace: projectNamespace,
        maxRevisionsPerContext,
      } = this.currentProject;

      const allRevisions = await this.k8s.listRevisionsForContexts(
        projectContexts,
        projectNamespace,
        releaseName,
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

      this.ui.setListItems(nextListIndex, prettyRevisions);
    } catch (error) {
      this.ui.showListError(nextListIndex, error);
    }
  }

  async rollback(listIndex, prettyRevision) {
    const nextListIndex = listIndex + 1;
    const matches = prettyRevision.match(/\[([^\]]+)\] .+\((.+)\)$/);

    if (!matches) {
      this.ui.showListError(nextListIndex, 'Unknown revision!');
      return;
    }

    const [, context, revision] = matches;

    this.ui.showListLoader(nextListIndex, `Rolling back to revision "${revision}" in "${context}"...`);

    try {
      await this.k8s.rollback(
        context,
        this.currentProject.namespace,
        this.currentRelease,
        revision,
      );

      this.ui.showListMessage(
        nextListIndex,
        `Rollback to revision "${revision}" completed in "${context}"!`,
      );
    } catch (e) {
      this.ui.showListError(nextListIndex, e);
    }
  }
}

module.exports = App;
