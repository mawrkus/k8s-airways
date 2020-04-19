const shell = require('shelljs');

class K8sCommands {
  constructor({ timeoutInMs = 30000 } = {}) {
    this.timeoutInMs = timeoutInMs;
  }

  exec(command) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.timeoutInMs}ms!`));
      }, this.timeoutInMs);

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
    const stdout = await this.exec('kubens');
    return stdout.split('\n').filter(Boolean);
  }

  async listReleases(context, namespace) {
    const command = `helm ls --kube-context ${context} --namespace ${namespace} -o json`;
    const stdout = await this.exec(command);
    const releases = JSON.parse(stdout);
    return releases.map(({ name }) => name);
  }

  async listRevisions(context, namespace, release) {
    const command = `helm history ${release} --kube-context ${context} --namespace ${namespace} --max 100 -o json`;
    const stdout = await this.exec(command);
    const revisions = JSON.parse(stdout);
    return K8sCommands.normalizeRevisions(revisions);
  }

  async listRevisionsForContexts(contexts, namespace, release) {
    const execP = contexts.map(async (context) => {
      const command = `helm history ${release} --kube-context ${context} --namespace ${namespace} --max 100 -o json`;

      try {
        const stdout = await this.exec(command);
        const revisions = K8sCommands.normalizeRevisions(JSON.parse(stdout));
        return { context, revisions };
      } catch (error) {
        return { context, error };
      }
    });

    return Promise.all(execP);
  }

  static normalizeRevisions(revisions) {
    return revisions
      .filter(({ description }) => description === 'Upgrade complete')
      .sort((a, b) => b.revision - a.revision);
  }

  async rollback(context, namespace, release, revision) {
    const command = `helm rollback ${release} ${revision} --kube-context ${context} --namespace ${namespace}`;
    const stdout = await this.exec(command);
    return stdout;
  }
}

module.exports = K8sCommands;
