import { SKILLS, PASSIVES, EVOLUTIONS, RULES, REWARDS } from '../config.js';

/** 候选池只返回当前可生效的升级；界面不参与资格判断。 */
export function legalChoices(run) {
  const choices = [];
  for (const [id, skill] of Object.entries(SKILLS)) {
    if ((id === 'foam' || run.skillPool.includes(id)) &&
        (run.skills[id] ?? 0) < RULES.maxSkillLevel && (run.skills[id] || Object.keys(run.skills).length < run.skillLimit)) {
      choices.push({ id, type: 'skill', name: skill.name, description: skill.description, level: (run.skills[id] ?? 0) + 1 });
    }
  }
  for (const [id, passive] of Object.entries(PASSIVES)) {
    if ((run.passives[id] ?? 0) < RULES.maxPassiveLevel) choices.push({ id, type: 'passive', ...passive, level: (run.passives[id] ?? 0) + 1 });
  }
  for (const [id, evolution] of Object.entries(EVOLUTIONS)) {
    if (!run.evolutions.includes(id) && evolution.pair.every(skill => run.skills[skill] === RULES.maxSkillLevel)) choices.push({ id, type: 'evolution', ...evolution });
  }
  return choices;
}
export function choose(run, choice) {
  // 点击前重新校验，避免旧面板、连续点击或过期存档应用非法升级。
  if (run.pending < 1) throw new Error('没有待处理的升级');
  if (choice.type === 'heal') {
    if (legalChoices(run).length) throw new Error('仍有可用升级');
    run.player.hp = Math.min(RULES.maxHealth, run.player.hp + REWARDS.upgradeHeal);
  } else {
    if (!legalChoices(run).some(c => c.id === choice.id && c.type === choice.type)) throw new Error('升级选项已失效');
    if (choice.type === 'skill') run.skills[choice.id] = (run.skills[choice.id] ?? 0) + 1;
    if (choice.type === 'passive') run.passives[choice.id] = (run.passives[choice.id] ?? 0) + 1;
    if (choice.type === 'evolution') run.evolutions.push(choice.id);
  }
  run.pending--;
}
export function offerChoices(run, random = Math.random) {
  const choices = legalChoices(run);
  if (Array.isArray(run.offered) && run.offered.length &&
      run.offered.every(c => c && choices.some(v => v.id === c.id && v.type === c.type))) {
    // 恢复已抽取的 ID，但文案与等级重新取自合法池，不信任存档中的 HTML 字段。
    return run.offered.map(c => choices.find(v => v.id === c.id && v.type === c.type));
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices.length ? choices.slice(0, 3) : [
    { id: 'heal', type: 'heal', name: '温暖补给', description: '构筑已完成，恢复 20 生命；满生命时无额外收益。' },
  ];
}
