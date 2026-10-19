import { hasOwn } from '../visibility/nodes';
import { SCALE_TYPES } from '../validation/type-checks';
import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';
import { CONTAINS } from './conditions';

export function versionWarnings({ definition, nodes, conditions }: CheckContext): DefinitionIssue[] {
  const [major, minor = 0] = String(definition.formatVersion ?? '1.0')
    .split('.')
    .map(Number);
  const list = conditions.find(({ condition }) => CONTAINS.some((operator) => hasOwn(condition, operator)));
  const scale = nodes.find(({ node }) => SCALE_TYPES.includes(node.type));
  const container = nodes.find(({ node }) => node.type === 'section' || node.type === 'group');
  const [problem, needed] =
    list && minor < 4
      ? [`${list.path} uses "${CONTAINS.find((operator) => hasOwn(list.condition, operator))}"`, 4]
      : scale && minor < 3
        ? [`${scale.path} is a ${scale.node.type}`, 3]
        : [container && `${container.path} is a ${container.node.type}`, 1];
  if (!problem || major !== 1 || minor >= needed) return [];
  return [
    warning(
      'outdated-format-version',
      '/formatVersion',
      `${problem}, which needs format 1.${needed}`,
      needed > 1
        ? `Set "formatVersion": "1.${needed}". Older versions of @formhaus/core ${needed > 3 ? 'reject this operator' : 'treat this type as a custom type and do not validate it'}. Upgrade the server that runs validateSubmission() first`
        : 'Set "formatVersion": "1.1", so that older versions of @formhaus/core reject the definition instead of skipping the fields inside',
    ),
  ];
}
