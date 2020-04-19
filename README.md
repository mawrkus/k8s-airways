# K8s Airways

A terminal application to make Kubernetes rollbacks easy.

## ✈️  Requirements

- [Node.js](https://nodejs.org/) >= 10
- [Helm](https://helm.sh/) >= 3
- [kubectx + kubens](https://github.com/ahmetb/kubectx)

## ✈️  Installation & usage

### Using npx

```shell
npx k8s-airways -c [optional projects config]
```

### Using npm

```shell
npm install -g k8s-airways
k8s-airways -c [optional projects config]
```

### Cloning the repository

```shell
git clone https://github.com/mawrkus/k8s-airways.git
cd k8s-airways
npm install
```

To browse **contexts** -> **namespaces** -> **releases** -> **revisions** :

```shell
npm run start
```

To browse **projects** -> **releases** -> **revisions** :

Configure your project(s) in `./config/k8s-demo-projects.json` (see below).

Then execute:

```shell
npm run start:projects
```

### The projects config file

It's a simple JSON file containing an entry for each project, e.g.:

```json
{
  "Project Name": {
    "contexts": ["europe", "usa", "asia"],
    "namespace": "my-namespace",
    "releases": ["my-blue-release", "my-green-release"],
    "maxRevisionsPerContext": 3
  }
}
```

## ✈️  Contribute

1. Fork it: `git clone https://github.com/mawrkus/k8s-airways.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the tests: `npm run test`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :D
