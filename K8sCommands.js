const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor() {
    this.currentContext = null;
    this.currentNamespace = null;
    this.currentRelease = null;
    this.currentRevision = null;

    this.currentContexts = [];
  }

  /* start of the additional methods used for the "per project" version of K8s Airways */
  setContexts(contexts) {
    this.currentContexts = contexts;
  }

  setContext(context) {
    this.currentContext = context;
  }

  setNamespace(namespace) {
    this.currentNamespace = namespace;
  }

  async listProjectRevisions(release) {
    const execP = this.currentContexts.map(async (context) => {
      const command = `helm history ${release} --kube-context ${context} --namespace ${this.currentNamespace} --max 100 -o json`;

      try {
        const stdout = await this.exec(command);
        const mostRecent = this.normalizeRevisions(JSON.parse(stdout))[0];
        return `[${context}] ${mostRecent}`;
      } catch(e) {
        return `[${context}] ${e}`;
      }
    });

    return Promise.all(execP);
  }
  /* end of the additional methods used for the "per project" version of K8s Airways */

  exec(command, timeoutInMs = 30000) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutInMs}ms!`))
      }, timeoutInMs);

      shell.exec(command, { silent: true, fatal: true }, (code, stdout, stderr) => {
        if (stderr) {
          return reject(stderr);
        }
        return resolve(stdout);
      });
    });
  }

  async listContexts() {
    const stdout = await this.exec('kubectx');
    return stdout.split('\n').filter(Boolean);
  }

  async listNamespaces(context) {
    await this.exec(`kubectx ${context}`);
    this.currentContext = context;

    const stdout = await this.exec('kubens');
    return stdout.split('\n').filter(Boolean);
  }

  async listReleases(namespace) {
    const command = `helm ls --kube-context ${this.currentContext} --namespace ${namespace} -o json`;
    const stdout = await this.exec(command);

    this.currentNamespace = namespace;

    const releases = JSON.parse(stdout);
    return releases.map(({ name }) => name);
  }

  async listRevisions(release) {
    const command = `helm history ${release} --kube-context ${this.currentContext} --namespace ${this.currentNamespace} --max 100 -o json`;
    const stdout = await this.exec(command);

    this.currentRelease = release;

    const revisions = JSON.parse(stdout);

    return this.normalizeRevisions(revisions);
  }

  normalizeRevisions(revisions) {
    return revisions
      .filter(({ description }) => description === 'Upgrade complete')
      .sort((a, b) => b.revision - a.revision)
      .map(({ app_version, revision, updated }) => {
        const date = updated
          ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss')
          : '?';
        return `${date} -> v${app_version || '?'} (${revision})`;
      });
  }

  async rollback(revision) {
    const command = `helm rollback ${this.currentRelease} ${revision} --kube-context ${this.currentContext} --namespace ${this.currentNamespace}`;
    const stdout = await this.exec(command);

    this.currentRevision = revision;

    return stdout;
  }
}

module.exports = K8sCommands;
