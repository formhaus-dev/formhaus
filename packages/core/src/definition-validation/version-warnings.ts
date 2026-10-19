import { hasOwn } from '../visibility/nodes';
import { SCALE_TYPES } from '../validation/type-checks';
import type { CheckContext } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';
import { CONTAINS } from './conditions';
import { recallTexts } from './recall-warnings';
import { formatOf } from '../engine/recall';

const UPGRADE = 'Upgrade the server that runs validateSubmission() first';

export function versionWarnings(context: CheckContext): DefinitionIssue[] {
  const { definition, nodes, conditions, entries } = context;
  const [major, minor = 0] = formatOf(definition);
  const recall = recallTexts(context)[0];
  const exclusive = entries.find(({ field }) => field.options?.some((option) => option.exclusive));
  const fill = entries.find(({ field }) => field.autocomplete !== undefined);
  const list = conditions.find(({ condition }) => CONTAINS.some((operator) => hasOwn(condition, operator)));
  const scale = nodes.find(({ node }) => SCALE_TYPES.includes(node.type));
  const container = nodes.find(({ node }) => node.type === 'section' || node.type === 'group');
  const [problem, needed, hint] =
    recall && minor < 5
      ? [`${recall.path} recalls "{{${recall.keys[0]}}}"`, 5, 'Below 1.5 the text shows the braces as written']
      : exclusive && minor < 5
        ? [`${exclusive.path} has an exclusive option`, 5, `Older versions of @formhaus/core ignore "exclusive". ${UPGRADE}`]
        : fill && minor < 5
          ? [`${fill.path}/autocomplete is set`, 5, 'Older versions of @formhaus/core report "autocomplete" as an unknown property']
          : list && minor < 4
            ? [
                `${list.path} uses "${CONTAINS.find((operator) => hasOwn(list.condition, operator))}"`,
                4,
                `Older versions of @formhaus/core reject this operator. ${UPGRADE}`,
              ]
            : scale && minor < 3
              ? [
                  `${scale.path} is a ${scale.node.type}`,
                  3,
                  `Older versions of @formhaus/core treat this type as a custom type and do not validate it. ${UPGRADE}`,
                ]
              : [
                  container && `${container.path} is a ${container.node.type}`,
                  1,
                  'so that older versions of @formhaus/core reject the definition instead of skipping the fields inside',
                ];
  if (!problem || major !== 1 || minor >= needed) return [];
  return [
    warning(
      'outdated-format-version',
      '/formatVersion',
      `${problem}, which needs format 1.${needed}`,
      `Set "formatVersion": "1.${needed}"${needed > 1 ? '.' : ','} ${hint}`,
    ),
  ];
}
