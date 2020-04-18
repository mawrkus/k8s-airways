const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor({ debug }) {
    this.debug = debug;

    this.currentContext = null;
    this.currentNamespace = null;
  }

  listContexts() {
    const { stdout } = shell.exec('kubectx', { silent: true });
    return stdout.split('\n').filter(Boolean);
  }

  listNamespaces(context) {
    this.currentContext = context;
    shell.exec(`kubectx ${context}`, { silent: true });

    const { stdout } = shell.exec('kubens', { silent: true });
    return stdout.split('\n').filter(Boolean);
  }

  listReleases(namespace) {
    this.currentNamespace = namespace;

    const command = `helm ls --kube-context ${this.currentContext} --namespace ${namespace} -o json`;
    this.debug('K8s', command);

    const { stdout: json } = shell.exec(command, { silent: true });
    this.debug('K8s', 'json=', json);

    try {
      const releases = JSON.parse(json);
      return releases.map(({ name }) => name);
    } catch(e) {
      return [json];
    }
  }

  listVersions(release) {
    const command = `helm history ${release} --kube-context ${this.currentContext} --namespace ${this.currentNamespace} --max 50 -o json`;
    this.debug('K8s', command);

    const { stdout: json } = shell.exec(command, { silent: true });
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
