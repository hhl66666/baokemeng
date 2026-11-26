import { castAreaSkill } from './area.js';

export function cast(context) {
  castAreaSkill({ ...context, id: 'storm', target: context.targets[0] });
}