const dayjs = require('dayjs');

module.exports = (revisionData, context) => {
  const { app_version, revision, updated } = revisionData;

  const date = updated ? dayjs(updated).format('ddd DD/MM/YYYY HH:mm:ss') : '?';

  return context
    ? `[${context}] ${date} -> v${app_version || '?'} (${revision})`
    : `${date} -> v${app_version || '?'} (${revision})`;
}
