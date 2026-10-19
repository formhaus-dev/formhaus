import { hasOwn } from '../visibility/nodes';
import { SCALE_TYPES } from '../validation/type-checks';
import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';
import { CONTAINS } from './conditions';
import { recallTexts } from './recall-warnings';
import { formatOf } from '../engine/recall';

export function versionWarnings(context: CheckContext): DefinitionIssue[] {
  const { definition, nodes, conditions } = context;
  const [major, minor = 0] = formatOf(definition);
  const recall = recallTexts(context)[0];
  const list = conditions.find(({ condition }) => CONTAINS.some((operator) => hasOwn(condition, operator)));
  const scale = nodes.find(({ node }) => SCALE_TYPES.includes(node.type));
  const container = nodes.find(({ node }) => node.type === 'section' || node.type === 'group');
  const [problem, needed] =
    recall && minor < 5
      ? [`${recall.path} recalls "{{${recall.keys[0]}}}"`, 5]
      : list && minor < 4
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
      needed > 4
        ? 'Set "formatVersion": "1.5". Below 1.5 the text shows the braces as written'
        : needed > 1
          ? `Set "formatVersion": "1.${needed}". Older versions of @formhaus/core ${needed > 3 ? 'reject this operator' : 'treat this type as a custom type and do not validate it'}. Upgrade the server that runs validateSubmission() first`
          : 'Set "formatVersion": "1.1", so that older versions of @formhaus/core reject the definition instead of skipping the fields inside',
    ),
  ];
}
