const dayjs = require('dayjs');

module.exports = (revisionData, context) => {
  const { app_version: appVersion, revision, updated } = revisionData;

  const date = updated ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss') : '?';

  return context
    ? `[${context}] ${date} -> v${appVersion || '?'} (${revision})`
    : `${date} -> v${appVersion || '?'} (${revision})`;
};
