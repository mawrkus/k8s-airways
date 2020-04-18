const shell = require('shelljs');
const dayjs = require('dayjs');

class K8sCommands {
  constructor() {
    const listCommandsMap = [
      () => 'kubectx',
      ({ ctx }) => [`kubectx ${ctx}`, 'kubens'],
      ({ ctx, ns }) => [`helm ls --namespace ${ns}`],
      ({ ctx, ns, rel }) => [`helm history "${rel}" --kube-context "${ctx}" --namespace "${ns}" --max 50 -o json`],
    ];

    // helm rollback "${release_name}" "${revision}" --namespace "${namespace}" --kube-context "${cluster_name}"
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
    const { stdout: json } = shell.exec(`helm ls --kube-context ${this.currentContext} --namespace ${namespace} -o json`, { silent: true });
    const releases = JSON.parse(json);
    return releases.map(({ name }) => name);
  }

  listVersions(release) {
    const { stdout: json } = shell.exec(`helm history ${release} --kube-context ${this.currentContext} --namespace ${this.currentNamespace} --max 50 -o json`, { silent: true });
    const versions = JSON.parse(json);
    return versions
      .filter(({ description }) => description === 'Upgrade complete')
      .sort((a, b) => b.revision - a.revision)
      .map(({ app_version, revision, updated }) => {
        const date = dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss');
        return `${date} -> v${app_version} (${revision})`;
      });
  }
}

module.exports = K8sCommands;
