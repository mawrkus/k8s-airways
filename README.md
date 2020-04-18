# K8s Airways

A terminal application to make Kubernetes rollbacks easy.

## ✈️  Installation & usage

```shell
git clone https://github.com/mawrkus/k8s-airways.git
cd k8s-airways
npm install
```

To browse **contexts** -> **namespaces** -> **releases** -> **revisions**:

```shell
npm run start
```

After configuring your projects in `./config/projects.json`:

```shell
npm run start:projects
```

You'll be able to browse **projects** -> **releases** -> **revisions**:

## ✈️  Contribute

1. Fork it: `git clone https://github.com/mawrkus/k8s-airways.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the build: `npm run build`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :D
