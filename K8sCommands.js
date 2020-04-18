const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor() {
    this.currentContext = null;
    this.currentNamespace = null;
    this.currentRelease = null;
    this.currentRevision = null;
  }

  exec(command, timeoutInMs = 10000) {
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

    const versions = JSON.parse(stdout);

    return versions
      .filter(({ description }) => description === 'Upgrade complete')
      .sort((a, b) => b.revision - a.revision)
      .map(({ app_version, revision, updated }) => {
        const date = updated
          ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss')
          : '?';
        return `${date} -> ${release} v${app_version || '?'} (${revision})`;
      });
  }

  async rollback(revision) {
    const command = `helm rollback ${this.currentRelease} ${revision} --kube-context ${this.currentContext} --namespace ${this.currentNamespace}`;
    // const stdout = await this.exec(command);
    this.currentRevision = revision;
    // return stdout;
    return [command];
  }
}

module.exports = K8sCommands;
