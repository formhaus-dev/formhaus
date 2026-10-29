const bullet = (summary) =>
  summary
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
    .join('\n');

module.exports = {
  getReleaseLine: async (changeset) => bullet(changeset.summary),
  getDependencyReleaseLine: async (changesets, dependencies) => {
    if (!changesets.length || !dependencies.length) return '';
    const list = dependencies.map(({ name, newVersion }) => `\`${name}\` ${newVersion}`).join(' and ');
    return `- Requires ${list}.`;
  },
};
