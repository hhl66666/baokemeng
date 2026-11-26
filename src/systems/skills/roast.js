import { castAreaSkill } from './area.js';

export function cast(context) {
  castAreaSkill({ ...context, id: 'roast', target: context.targets[0] });
}