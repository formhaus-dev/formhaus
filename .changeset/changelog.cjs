const bullet = (summary) => {
  const text = summary.trim();
  return text.startsWith('- ') ? text : `- ${text}`;
};

module.exports = {
  getReleaseLine: async (changeset) => bullet(changeset.summary),
  getDependencyReleaseLine: async (changesets, dependencies) => {
    if (!changesets.length || !dependencies.length) return '';
    const list = dependencies.map(({ name, newVersion }) => `\`${name}\` ${newVersion}`).join(' and ');
    return `- Requires ${list}.`;
  },
};
