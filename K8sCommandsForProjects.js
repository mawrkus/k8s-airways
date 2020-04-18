const K8sCommands = require('./K8sCommands');

class K8sCommandsProjects extends K8sCommands {
  constructor() {
    super();
    this.currentContexts = [];
  }

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
    this.currentRelease = release;

    const execP = this.currentContexts.map(async (context) => {
      const command = `helm history ${release} --kube-context ${context} --namespace ${this.currentNamespace} --max 100 -o json`;

      try {
        const stdout = await this.exec(command);
        const revisions = this.normalizeRevisions(JSON.parse(stdout));
        return { context, revisions };
      } catch(error) {
        return { context, error };
      }
    });

    return Promise.all(execP);
  }
}

module.exports = K8sCommandsProjects;
