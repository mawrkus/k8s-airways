const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor({ debug }) {
    this.debug = debug;

    this.currentContext = null;
    this.currentNamespace = null;
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
    const stdout = await this.exec('kubectx');
    return stdout.split('\n').filter(Boolean);
  }

  async listNamespaces(context) {
    this.currentContext = context;
    await this.exec(`kubectx ${context}`);

    const stdout = await this.exec('kubens');
    return stdout.split('\n').filter(Boolean);
  }

  async listReleases(namespace) {
    this.currentNamespace = namespace;

    const command = `helm ls --kube-context ${this.currentContext} --namespace ${namespace} -o json`;
    this.debug('K8s', command);

    const { stdout: json } = await this.exec(command);
    this.debug('K8s', 'json=', json);

    try {
      const releases = JSON.parse(json);
      return releases.map(({ name }) => name);
    } catch(e) {
      return [json];
    }
  }

  async listVersions(release) {
    const command = `helm history ${release} --kube-context ${this.currentContext} --namespace ${this.currentNamespace} --max 50 -o json`;
    this.debug('K8s', command);

    const { stdout: json } = await this.exec(command);
    this.debug('K8s', 'json=', json);

    try {
      const versions = JSON.parse(json);

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
      return [json];
    }
  }
}

module.exports = K8sCommands;
