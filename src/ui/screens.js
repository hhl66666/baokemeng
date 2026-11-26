import { createApp, shallowRef } from 'vue';
import ScreenPanel from './ScreenPanel.vue';
import { SKILLS, EVOLUTIONS } from '../config.js';
import { MAPS, mapFor } from '../data/maps.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters.js';
import { SKINS, FRAGMENTS, skinUnlocked, skillUnlocked, validateLoadout } from '../data/progression.js';
import { timeText } from './hud.js';

export class Screens {
  constructor(game, doc = document) {
    this.game = game;
    this.state = shallowRef(null);
    this.app = createApp(ScreenPanel, { state: this.state });
    this.app.mount(doc.getElementById('screens-root'));
  }
  show(data) {
    this.state.value = data;
    this.game.input.reset();
  }
  hide() { this.state.value = null; }
  settings() {
    const game = this.game;
    return {
      sound: game.store.settings.sound,
      changeSound: checked => {
        game.store.settings.sound = checked;
        game.audio.unlock();
        game.store.saveSettings();
      },
    };
  }
  menu(draft = this.game.store.profile.loadout, previewSkin = draft.skinId, view = 'lobby') {
    const game = this.game;
    const { profile, savedRun } = game.store;
    const selection = structuredClone(draft);
    selection.characterId = CHARACTERS[selection.characterId] ? selection.characterId : DEFAULT_CHARACTER.id;
    const canContinue = Boolean(savedRun && !savedRun.result);
    const sourceFor = (kind, id) => Object.values(MAPS).find(map => map.reward[kind] === id)?.name;
    const refresh = changes => this.menu({ ...selection, ...changes }, previewSkin, view);
    game.world.configure(selection.mapId, previewSkin, selection.characterId);
    this.show({
      kind: 'menu', view, selection, previewSkin, profile, canContinue,
      characters: Object.values(CHARACTERS), character: CHARACTERS[selection.characterId],
      navigate: next => this.menu(selection, previewSkin, next),
      map: MAPS[selection.mapId], skin: SKINS[previewSkin],
      stores: Object.values(MAPS), skins: Object.values(SKINS), skills: Object.entries(SKILLS).filter(([id]) => id !== 'foam'),
      SKINS, SKILLS, FRAGMENTS, sourceFor,
      valid: validateLoadout(selection, profile),
      skinUnlocked: id => skinUnlocked(profile, id),
      skillUnlocked: id => skillUnlocked(profile, id),
      evolutions: ['snow', 'pulse'].map(id => ({ name: EVOLUTIONS[id].name, reachable: EVOLUTIONS[id].pair.every(skill => skill === 'foam' || selection.skillPool.includes(skill)) })),
      selectStore: mapId => refresh({ mapId }),
      selectCharacter: id => { if (CHARACTERS[id]) refresh({ characterId: id }); },
      previewSkinAction: id => this.menu(selection, id, view),
      preview: canvas => game.world.preview(canvas, selection.mapId, previewSkin, selection.characterId),
      selectSkill: (id, checked) => refresh({ skillPool: checked ? [...new Set([...selection.skillPool, id])] : selection.skillPool.filter(skill => skill !== id) }),
      equip: () => { if (skinUnlocked(profile, previewSkin)) refresh({ skinId: previewSkin }); },
      save: () => { if (game.store.saveLoadout(selection)) { this.menu(selection, previewSkin, view); game.hud.notify('出战配置已保存，仅影响新局。'); } },
      start: () => {
        if (!game.store.saveLoadout(selection)) return;
        game.audio.unlock();
        if (canContinue) this.show({ kind: 'confirm', title: '开始新冒险？', description: '旧局按主动结束结算已获得的精英材料；技能与经验不保留。', confirmId: 'confirm-new', confirmLabel: '结算旧局并重开', confirm: () => game.replaceSavedRun(), cancelId: 'back', cancelLabel: '返回', cancel: () => game.menu() });
        else game.begin(false);
      },
      continue: () => { game.audio.unlock(); game.begin(true); },
      ...this.settings(),
    });
  }
  pause(title, description) {
    const game = this.game;
    this.show({
      kind: 'pause', title, description, time: timeText(game.run.time), kills: game.run.kills, level: game.run.level,
      resume: () => { game.audio.unlock(); game.resume(); },
      quit: () => this.show({ kind: 'confirm', title: '结束本局？', description: '已击败精英获得的材料将保留，技能和经验不保留。想稍后继续，可返回暂停并关闭页面。', confirmId: 'confirm-quit', confirmLabel: '结束并结算', confirm: () => game.finish('quit'), cancelId: 'cancel', cancelLabel: '返回暂停', cancel: () => this.pause('歇一小会儿', '世界已暂停。准备好了，随时回来继续。') }),
      ...this.settings(),
    });
  }
  upgrade(choices) {
    this.show({ kind: 'upgrade', level: this.game.run.level, pending: this.game.run.pending,
      choices: choices.map(choice => ({ ...choice, category: choice.type === 'evolution' ? '组合进阶' : choice.type === 'skill' ? `自动技能 · Lv. ${choice.level}` : choice.type === 'passive' ? `辅助能力 · Lv. ${choice.level}` : '构筑已完成' })),
      choose: index => this.game.selectUpgrade(choices[index]),
    });
  }
  result() {
    const game = this.game;
    const { run, store } = game;
    const map = mapFor(run);
    const receipt = store.profile.receipts.find(item => item.id === run.id);
    const rewards = receipt ? ['skin', 'skill'].flatMap(kind => {
      const reward = receipt[kind];
      if (!reward) return [];
      const name = kind === 'skin' ? SKINS[reward.id].name : SKILLS[reward.id].name;
      const inventory = kind === 'skin' ? store.profile.skinFragments : store.profile.skillFragments;
      const required = kind === 'skin' ? FRAGMENTS.skinRequired : FRAGMENTS.skillRequired;
      return [`${name}碎片 +${reward.amount} · ${inventory[reward.id]}/${required}${reward.converted ? ` · 已解锁转材料 +${reward.converted}` : ''}`];
    }) : [];
    this.show({ kind: 'result', run, map, receipt, rewards,
      title: run.result === 'win' ? `${map.name}，恢复如常。` : run.result === 'lose' ? '休息一下，再来一杯。' : '这次冒险，先到这里。',
      time: timeText(run.time), summary: Object.entries(run.skills).map(([id, level]) => `${SKILLS[id].name} Lv.${level}`).join(' / '),
      evolutions: run.evolutions.map(id => EVOLUTIONS[id].name).join(' / '),
      savedMessage: store.error ? '奖励尚未保存，请重试，保存成功后再离开。' : `奖励已入账 · 材料共 ${store.profile.materials}。皮肤与技能达到碎片门槛自动解锁。`,
      again: () => { if (game.persist()) game.begin(false); }, home: () => { if (game.persist()) game.menu(); },
    });
  }
  dispose() { this.app.unmount(); }
}

export function showStartupError(doc = document) {
  const root = doc.getElementById('screens-root');
  root.__vue_app__?.unmount();
  createApp(ScreenPanel, { state: shallowRef({ kind: 'error' }) }).mount(root);
}