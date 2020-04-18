const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor() {
    this.currentContext = null;
    this.currentNamespace = null;
    this.currentRelease = null;
    this.currentVersion = null;
  }

  exec(command) {
    return new Promise((resolve, reject) => {
      shell.exec(command, { silent: true, fatal: true }, (code, stdout, stderr) => {
        if (stderr) {
          return reject(stderr);
        }
        return resolve(stdout);
      });
    });
  }

  async listContexts() {
    try {
      const stdout = await this.exec('kubectx');
      return stdout.split('\n').filter(Boolean);
    } catch(e) {
      return [];
    }
  }

  async listNamespaces(context) {
    try {
      await this.exec(`kubectx ${context}`);
      this.currentContext = context;

      const stdout = await this.exec('kubens');
      return stdout.split('\n').filter(Boolean);
    } catch(e) {
      return [];
    }
  }

  async listReleases(namespace) {
    try {
      const command = `helm ls --kube-context ${this.currentContext} --namespace ${namespace} -o json`;
      const stdout = await this.exec(command);
      this.currentNamespace = namespace;

      const releases = JSON.parse(stdout);
      return releases.map(({ name }) => name);
    } catch(e) {
      return [];
    }
  }

  async listRevisions(release) {
    try {
      const command = `helm history ${release} --kube-context ${this.currentContext} --namespace ${this.currentNamespace} --max 100 -o json`;
      const stdout = await this.exec(command);
      this.currentRelease = release;

      const versions = JSON.parse(stdout);

      return versions
        .filter(({ description }) => description === 'Upgrade complete')
        .sort((a, b) => b.revision - a.revision)
        .map(({ app_version, revision, updated }) => {
          const date = updated
            ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss')
            : '?';
          return `${date} -> v${app_version || '?'} (${revision})`;
        });
    } catch(e) {
      return [];
    }
  }

  async rollback(version) {
    // TODO
    this.currentVersion = version;
  }
}

module.exports = K8sCommands;
