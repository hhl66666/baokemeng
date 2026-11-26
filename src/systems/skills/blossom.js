import { castAreaSkill } from './area.js';

export function cast(context) {
  castAreaSkill({ ...context, id: 'blossom', target: context.targets[0] });
}