const dayjs = require('dayjs');

function formatRevision(revisionData, context) {
  const { app_version: appVersion, revision, updated } = revisionData;

  const date = updated ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss') : '?';

  return context
    ? `[${context}] ${date} -> v${appVersion || '?'} (${revision})`
    : `${date} -> v${appVersion || '?'} (${revision})`;
}

class App {
  constructor({ k8s, ui, projectsConfig }) {
    this.k8s = k8s;
    this.ui = ui;
    this.projectsConfig = projectsConfig;

    this.currentProject = null;
    this.currentContext = null;
    this.currentNamespace = null;
    this.currentRelease = null;

    this.onProjectItemSelected = this.onProjectItemSelected.bind(this);
    this.onItemSelected = this.onItemSelected.bind(this);
  }

  async run() {
    if (this.projectsConfig) {
      this.ui.on('item:select', this.onProjectItemSelected);

      this.ui.showListLoader(0, 'Loading projects...');
      this.ui.setListItems(0, Object.keys(this.projectsConfig));
    } else {
      this.ui.on('item:select', this.onItemSelected);

      this.ui.showListLoader(0, 'Loading contexts...');
      try {
        this.ui.setListItems(0, await this.k8s.listContexts());
      } catch (error) {
        this.ui.showListError(0, error);
      }
    }
  }

  onProjectItemSelected({ itemsName, listIndex, itemValue }) {
    switch (itemsName) {
      case 'projects':
        this.loadProjectReleases(listIndex, itemValue);
        break;

      case 'releases':
        this.loadProjectRevisions(listIndex, itemValue);
        break;

      case 'revisions':
        this.rollbackProject(listIndex, itemValue);
        break;

      default:
        break;
    }
  }

  async loadProjectReleases(listIndex, projectName) {
    const nextListIndex = listIndex + 1;
    this.currentProject = this.projectsConfig[projectName];
    this.ui.showListLoader(nextListIndex, `Loading "${projectName}" releases...`);
    this.ui.setListItems(nextListIndex, this.currentProject.releases);
  }

  async loadProjectRevisions(listIndex, namespaceAndRelease) {
    const nextListIndex = listIndex + 1;
    const [namespace, release] = namespaceAndRelease.split(':');

    this.currentNamespace = namespace;
    this.currentRelease = release;

    this.ui.showListLoader(nextListIndex, `Loading "${release}" revisions...`);

    try {
      const {
        contexts: projectContexts,
        maxRevisionsPerContext,
      } = this.currentProject;

      const allRevisions = await this.k8s.listRevisionsForContexts(
        projectContexts,
        namespace,
        release,
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

  async rollbackProject(listIndex, prettyRevision) {
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
    } catch (error) {
      this.ui.showListError(nextListIndex, error);
    }
  }

  onItemSelected({ itemsName, listIndex, itemValue }) {
    switch (itemsName) {
      case 'contexts':
        this.loadNamespaces(listIndex, itemValue);
        break;

      case 'namespaces':
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

  async loadNamespaces(listIndex, context) {
    const nextListIndex = listIndex + 1;
    this.currentContext = context;
    this.ui.showListLoader(nextListIndex, `Loading "${context}" namespaces...`);

    try {
      const namespaces = await this.k8s.listNamespaces(context);
      this.ui.setListItems(nextListIndex, namespaces);
    } catch (error) {
      this.ui.showListError(nextListIndex, error);
    }
  }

  async loadReleases(listIndex, namespace) {
    const nextListIndex = listIndex + 1;
    this.currentNamespace = namespace;
    this.ui.showListLoader(nextListIndex, `Loading "${namespace}" releases...`);

    try {
      const releases = await this.k8s.listReleases(this.currentContext, namespace);
      this.ui.setListItems(nextListIndex, releases);
    } catch (error) {
      this.ui.showListError(nextListIndex, error);
    }
  }

  async loadRevisions(listIndex, release) {
    const nextListIndex = listIndex + 1;
    this.currentRelease = release;
    this.ui.showListLoader(nextListIndex, 'Loading revisions...');

    try {
      const revisions = await this.k8s.listRevisions(
        this.currentContext,
        this.currentNamespace,
        release,
      );

      const prettyRevisions = revisions.map((r) => formatRevision(r, null));

      this.ui.setListItems(nextListIndex, prettyRevisions);
    } catch (error) {
      this.ui.showListError(nextListIndex, error);
    }
  }

  async rollback(listIndex, prettyRevision) {
    const [, currentRevision] = prettyRevision.match(/\((.+)\)$/);
    this.ui.showListLoader(listIndex, `Rolling back to revision "${currentRevision}"...`);

    try {
      await this.k8s.rollback(
        this.currentContext,
        this.currentNamespace,
        this.currentRelease,
        currentRevision,
      );

      this.ui.showListMessage(listIndex, `Rollback to revision "${currentRevision}" completed!`);
    } catch (error) {
      this.ui.showListError(listIndex, error);
    }
  }
}

module.exports = App;
