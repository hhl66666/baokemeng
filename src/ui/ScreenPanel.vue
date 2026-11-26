<script setup>
import { computed, ref, watch, watchPostEffect } from 'vue';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Coffee, Flame, FlaskConical, Flower2, Gem, Leaf, LockKeyhole, Play, Save, Settings2, Shield, Snowflake, Sparkles, Trophy, Users, Waves, Zap } from 'lucide-vue-next';

const props = defineProps({ state: { type: Object, required: true } });
const screen = computed(() => props.state.value);
const preview = ref(null);
const panel = ref(null);
const search = ref('');
const unlockedOnly = ref(false);
const settingsOpen = ref(false);
const portrait = new URL('../image/role/xiaoman-portrait.svg', import.meta.url).href;
const skillIcons = { foam: Coffee, ice: Snowflake, espresso: Zap, caramel: Waves, matcha: Leaf, cocoa: Sparkles, storm: Waves, blossom: Flower2, roast: Flame };
const filteredSkins = computed(() => screen.value?.skins?.filter(skin => skin.name.includes(search.value.trim()) && (!unlockedOnly.value || screen.value.skinUnlocked(skin.id))) ?? []);
const collected = computed(() => screen.value?.skins?.filter(skin => screen.value.skinUnlocked(skin.id)).length ?? 0);
watch(() => screen.value?.view, () => {
  settingsOpen.value = false;
  panel.value?.scrollTo?.(0, 0);
}, { flush: 'post' });
watchPostEffect(() => {
  const current = screen.value;
  if (current?.kind === 'menu' && preview.value) current.preview(preview.value);
});
</script>

<template>
  <section id="overlay" class="overlay" :class="{ 'menu-overlay': screen?.kind === 'menu' }" :hidden="!screen">
    <div id="panel" ref="panel" class="panel" :class="{ 'menu-panel': screen?.kind === 'menu' }">
  <template v-if="screen">
    <template v-if="screen.kind === 'menu'">
      <div class="game-menu" :data-view="screen.view">
        <header class="menu-header">
          <a v-if="screen.view === 'lobby'" class="game-logo" href="#" @click.prevent="screen.navigate('lobby')"><Coffee :size="36" /><span>杯中<span>伙伴</span><small>CUP COMPANIONS</small></span><i>试玩版</i></a>
          <div v-else class="page-heading"><button class="menu-button back-button" data-nav="lobby" @click="screen.navigate('lobby')"><ArrowLeft :size="18" />返回</button><h2 class="striped coral">{{ { collection: '伙伴图鉴', research: '灵感研究所', stores: '门店地图', records: '冒险记录' }[screen.view] }}</h2></div>
          <div class="player-wallet"><img v-if="screen.character.id === 'xiaoman'" :src="portrait" alt="小满" /><span v-else class="character-monogram" aria-hidden="true">龙</span><b class="player-name">角色 · {{ screen.character.name }}</b><span title="装饰材料"><Gem :size="20" />{{ screen.profile.materials }}</span><span title="累计通关"><Trophy :size="20" />{{ screen.profile.wins }}</span><span title="已解锁围裙"><Users :size="20" />{{ collected }}/{{ screen.skins.length }}</span><button id="save-loadout" class="wallet-save" :disabled="!screen.valid" title="保存出战配置" aria-label="保存出战配置" @click="screen.save"><Save :size="18" /><span>保存配置</span></button></div>
        </header>

        <main v-if="screen.view === 'lobby'" class="lobby-layout">
          <section class="lobby-main" aria-label="冒险大厅">
            <div class="play-grid">
              <button id="start" class="play-tile striped coral" :disabled="!screen.valid" @click="screen.start"><span class="tile-symbol"><Coffee :size="40" /></span><span><strong>开始<br>冒险</strong><small>{{ screen.map.name }} · 生存挑战</small></span><ArrowRight class="tile-arrow" :size="26" /></button>
              <div class="mode-stack"><button v-if="screen.canContinue" id="continue" class="mode-tile striped mint" @click="screen.continue"><Play :size="28" /><span><b>继续冒险</b><small>接着上次的灵感</small></span><ChevronRight :size="18" /></button><button class="mode-tile striped lilac" data-nav="research" @click="screen.navigate('research')"><FlaskConical :size="28" /><span><b>灵感配方</b><small>技能池 {{ screen.selection.skillPool.length }}/5</small></span><ChevronRight :size="18" /></button><button v-if="!screen.canContinue" class="mode-tile striped mint" data-nav="collection" @click="screen.navigate('collection')"><Users :size="28" /><span><b>出战伙伴</b><small>{{ screen.SKINS[screen.selection.skinId].name }}</small></span><ChevronRight :size="18" /></button></div>
              <button class="collection-tile striped gold" data-nav="collection" @click="screen.navigate('collection')"><Sparkles :size="38" /><b>伙伴图鉴</b><small>选择角色与造型</small></button>
            </div>
            <div class="event-strip"><div><span class="event-icon"><Flame :size="30" /></span><div><small>本次门店挑战</small><b>{{ screen.map.boss.name }}</b></div></div><div class="event-reward"><Gem :size="22" /><span>通关奖励<b>围裙碎片 +3 · 技能碎片 +2</b></span></div></div>
            <nav class="lobby-shortcuts" aria-label="大厅入口">
              <button data-nav="collection" @click="screen.navigate('collection')"><span class="shortcut-icon mint"><BookOpen /></span><b>伙伴图鉴</b><small>{{ collected }}/{{ screen.skins.length }} 已收集</small></button>
              <button data-nav="research" @click="screen.navigate('research')"><span class="shortcut-icon lilac"><FlaskConical /></span><b>研究所</b><small>{{ screen.selection.skillPool.length }}/5 出战配方</small></button>
              <button data-nav="stores" @click="screen.navigate('stores')"><span class="shortcut-icon peach"><Coffee /></span><b>门店地图</b><small>{{ screen.stores.length }} 家营业中</small></button>
              <button data-nav="records" @click="screen.navigate('records')"><span class="shortcut-icon gold"><Trophy /></span><b>冒险记录</b><small>{{ screen.profile.wins }} 次通关</small></button>
            </nav>
            <div class="lobby-bottom"><button class="menu-button" :aria-expanded="settingsOpen" @click="settingsOpen = !settingsOpen"><Settings2 :size="19" />设置</button><span>一杯灵感，一起出发。</span><small>原创试玩 · 非官方联名</small></div>
          </section>
          <aside class="challenge-board" aria-label="门店挑战">
            <header class="striped gold"><Trophy :size="28" /><div><b>门店挑战</b><small>本日也要灵感满杯</small></div><span>{{ screen.profile.wins }} 胜</span></header>
            <div class="board-body"><div class="board-tabs"><span><Coffee :size="16" />全部门店</span><span>通关收集奖励</span></div><button v-for="(store, index) in screen.stores" :key="store.id" class="challenge-row" :class="{ active: store.id === screen.map.id }" :data-store="store.id" :aria-pressed="store.id === screen.map.id" @click="screen.selectStore(store.id)"><span class="store-emblem" :class="store.id"><component :is="[Coffee, Waves, Flower2][index]" :size="29" /></span><span class="store-copy"><b>{{ store.name }}</b><small>{{ store.subtitle }}</small><em>{{ screen.profile.receipts.some(item => item.mapId === store.id && item.result === 'win') ? '已通关' : '等待挑战' }}</em></span><Check v-if="store.id === screen.map.id" :size="20" /><ChevronRight v-else :size="20" /></button><div class="board-footer"><Shield :size="17" /><span>首领登场 <b>05:00</b></span></div></div>
          </aside>
        </main>

        <main v-else-if="screen.view === 'collection'" class="collection-layout" :class="{ 'xiaolong-selected': screen.character.id === 'xiaolong' }">
          <section class="partner-detail">
            <div class="partner-identity"><span class="partner-number">伙伴 · {{ screen.character.title }}</span><h2>{{ screen.character.name }} <span v-if="screen.character.id === 'xiaoman'">{{ screen.skin.name }}</span></h2><span class="partner-tag">当前出战</span></div>
            <div class="character-picker" role="group" aria-label="选择出战角色"><button v-for="character in screen.characters" :key="character.id" :class="{ active: screen.selection.characterId === character.id }" :data-character="character.id" :aria-pressed="screen.selection.characterId === character.id" @click="screen.selectCharacter(character.id)"><b>{{ character.name }}</b><small>{{ character.title }}</small></button></div>
            <canvas id="skin-preview" ref="preview" width="360" height="360" :aria-label="`${screen.skin.name}三维角色预览`"></canvas>
            <div class="partner-stats"><div><span>起始技能</span><b><Coffee :size="18" />{{ screen.SKILLS[screen.character.startingSkill].name }}</b></div><div><span>{{ screen.character.id === 'xiaoman' ? '围裙碎片' : '角色状态' }}</span><b>{{ screen.character.id === 'xiaoman' ? (screen.previewSkin === 'classic' ? '初始伙伴' : `${screen.profile.skinFragments[screen.previewSkin]}/${screen.FRAGMENTS.skinRequired}`) : '已加入图鉴' }}</b></div><div><span>当前门店</span><b>{{ screen.map.name }}</b></div></div>
            <div v-if="screen.character.id === 'xiaoman'" class="partner-action"><span>{{ screen.skinUnlocked(screen.previewSkin) ? '小满，准备出发！' : `收集来源 · ${screen.sourceFor('skin', screen.previewSkin)}` }}</span><button id="equip-skin" class="striped coral" :disabled="!screen.skinUnlocked(screen.previewSkin)" @click="screen.equip"><Check v-if="screen.selection.skinId === screen.previewSkin" :size="22" /><Users v-else :size="22" />{{ screen.selection.skinId === screen.previewSkin ? '已加入出战' : '我选你了！' }}</button></div>
          </section>
          <section class="partner-browser" aria-label="围裙图鉴"><div class="collection-tabs" role="group" aria-label="围裙筛选"><button :aria-pressed="!unlockedOnly" :class="{ active: !unlockedOnly }" @click="unlockedOnly = false">全部伙伴</button><button :aria-pressed="unlockedOnly" :class="{ active: unlockedOnly }" @click="unlockedOnly = true">已解锁 {{ collected }}</button></div><input v-model="search" class="partner-search" type="search" placeholder="按围裙名称搜索…" aria-label="按围裙名称搜索"><div class="equipped-partner"><span>我的出战伙伴</span><b><Check :size="16" />{{ screen.SKINS[screen.selection.skinId].name }}</b></div><div class="partner-grid"><button v-for="skin in filteredSkins" :key="skin.id" class="partner-card" :class="{ active: screen.previewSkin === skin.id, 'is-locked': !screen.skinUnlocked(skin.id) }" :data-skin="skin.id" :aria-pressed="screen.previewSkin === skin.id" :style="{ '--apron': skin.colors.apron }" @click="screen.previewSkinAction(skin.id)"><LockKeyhole v-if="!screen.skinUnlocked(skin.id)" class="partner-lock" :size="16" /><Check v-else-if="screen.selection.skinId === skin.id" class="partner-lock" :size="17" /><img :src="portrait" alt=""><span class="apron-swatch"></span><b>{{ skin.name }}</b><small>{{ screen.skinUnlocked(skin.id) ? '已解锁' : `${screen.profile.skinFragments[skin.id]}/${screen.FRAGMENTS.skinRequired} 碎片` }}</small></button></div><p v-if="!filteredSkins.length" class="menu-empty">没有找到这件围裙</p><p class="collection-note">围裙碎片 {{ screen.FRAGMENTS.skinRequired }} 枚解锁 · 门店通关收集</p></section>
        </main>

        <main v-else-if="screen.view === 'research'" class="research-layout"><div class="research-heading"><h3>出战配方 <small>技能池 {{ screen.selection.skillPool.length }}/5</small></h3><span><Coffee :size="18" />固定起始 · 奶泡弧弹</span></div><div class="research-grid"><label v-for="[id, skill] in screen.skills" :key="id" class="research-card" :class="{ chosen: screen.selection.skillPool.includes(id), locked: !screen.skillUnlocked(id) }"><div class="research-card-top striped" :class="['ice', 'storm'].includes(id) ? 'sky' : ['matcha', 'blossom'].includes(id) ? 'mint' : ['caramel', 'roast'].includes(id) ? 'gold' : 'lilac'"><span class="research-badge">{{ screen.skillUnlocked(id) ? (screen.selection.skillPool.includes(id) ? '已加入配方' : '已解锁') : '待解锁' }}</span><span class="skill-medallion"><component :is="skillIcons[id]" :size="32" /></span></div><div class="research-card-body"><h3>{{ skill.name }}</h3><p>{{ skill.description }}</p><div class="fragment-track"><i v-for="step in 6" :key="step" :class="{ filled: screen.skillUnlocked(id) || screen.profile.skillFragments[id] >= step }"></i></div><span v-if="!screen.skillUnlocked(id)" class="skill-source">{{ screen.sourceFor('skill', id) }} · {{ screen.profile.skillFragments[id] }}/{{ screen.FRAGMENTS.skillRequired }} 碎片</span><span v-else class="skill-source">{{ screen.selection.skillPool.includes(id) ? '局内升级时可获得' : '可加入本次技能池' }}</span><span class="skill-select"><input type="checkbox" :data-skill="id" :checked="screen.selection.skillPool.includes(id)" :disabled="!screen.skillUnlocked(id)" @change="screen.selectSkill(id, $event.target.checked)"><LockKeyhole v-if="!screen.skillUnlocked(id)" :size="17" />{{ screen.skillUnlocked(id) ? '加入出战配方' : '收集碎片解锁' }}</span></div></label></div><div class="research-footer"><span v-for="evolution in screen.evolutions" :key="evolution.name"><Sparkles :size="16" />{{ evolution.name }}<b>{{ evolution.reachable ? '组合可达' : '缺少搭配' }}</b></span></div></main>

        <main v-else-if="screen.view === 'stores'" class="map-layout"><button v-for="(store, index) in screen.stores" :key="store.id" class="map-choice" :class="{ active: store.id === screen.map.id }" :data-store="store.id" :aria-pressed="store.id === screen.map.id" @click="screen.selectStore(store.id)"><span class="map-art striped" :class="['gold', 'sky', 'mint'][index]"><component :is="[Coffee, Waves, Flower2][index]" :size="64" /><span>0{{ index + 1 }}</span></span><h3>{{ store.name }}</h3><p>{{ store.subtitle }}</p><b>{{ store.boss.name }}</b><p>{{ store.boss.hint }}</p><small>{{ screen.SKINS[store.reward.skin].name }}碎片 +3<br>{{ screen.SKILLS[store.reward.skill].name }}碎片 +2</small><span class="map-selected"><Check v-if="store.id === screen.map.id" :size="18" />{{ store.id === screen.map.id ? '已选择' : '选择门店' }}</span></button></main>

        <main v-else class="records-layout"><h3><Trophy :size="24" />冒险记录 <span>{{ screen.profile.wins }} 次通关</span></h3><div v-if="!screen.profile.receipts.length" class="records-empty"><Coffee :size="48" /><h3>第一杯灵感，等你开启。</h3><button class="menu-button" @click="screen.navigate('lobby')">返回大厅<ArrowRight :size="18" /></button></div><ol v-else class="record-list"><li v-for="record in [...screen.profile.receipts].reverse()" :key="record.id"><span class="record-icon"><Trophy v-if="record.result === 'win'" :size="24" /><Coffee v-else :size="24" /></span><span><b>{{ screen.stores.find(store => store.id === record.mapId)?.name ?? '门店冒险' }}</b><small>{{ record.result === 'win' ? '挑战成功' : record.result === 'quit' ? '主动结束' : '下次再来' }}</small></span><strong><Gem :size="17" />+{{ record.materials }}</strong></li></ol></main>

        <footer v-if="screen.view !== 'lobby'" class="menu-footer"><span role="status">{{ screen.valid ? `出战就绪 · ${screen.map.name}` : `技能池 ${screen.selection.skillPool.length}/5 · 请选择恰好 5 个技能` }}</span><button class="menu-button" data-nav="lobby" @click="screen.navigate('lobby')">返回大厅<ArrowRight :size="18" /></button></footer>
        <div v-if="settingsOpen" class="menu-settings"><div><h3>设置</h3><button class="menu-button" @click="settingsOpen = false">完成<Check :size="16" /></button></div><label><input id="menu-sound" type="checkbox" :checked="screen.sound" @change="screen.changeSound($event.target.checked)">开启轻音效</label><p>本地存档仅限当前设备与浏览器。</p></div>
      </div>
    </template>
    <template v-else-if="screen.kind === 'error'">
      <h2>无法启动游戏</h2><p>请使用支持 WebGL 的现代浏览器，并开启硬件加速。详细错误已记录到控制台。</p>
    </template>
    <template v-else-if="screen.kind === 'pause'">
      <div class="eyebrow">TAKE A COFFEE BREAK</div><h2>{{ screen.title }}</h2><p>{{ screen.description }}</p>
      <div class="chips"><span>时间 {{ screen.time }}</span><span>击败 {{ screen.kills }}</span><span>Lv. {{ screen.level }}</span></div>
      <div class="actions"><button id="resume" class="primary" @click="screen.resume">继续冒险</button><button id="quit" class="secondary" @click="screen.quit">结束并结算</button></div>
    </template>
    <template v-else-if="screen.kind === 'confirm'">
      <h2>{{ screen.title }}</h2><p>{{ screen.description }}</p>
      <div class="actions"><button :id="screen.confirmId" class="primary" @click="screen.confirm">{{ screen.confirmLabel }}</button><button :id="screen.cancelId" class="secondary" @click="screen.cancel">{{ screen.cancelLabel }}</button></div>
    </template>
    <template v-else-if="screen.kind === 'upgrade'">
      <div class="eyebrow">A LITTLE INSPIRATION</div><h2>灵感，刚刚好。</h2>
      <p>世界已暂停 · Lv. {{ screen.level }}{{ screen.pending > 1 ? ` · 还有 ${screen.pending - 1} 次待选` : '' }}</p>
      <div class="cards"><button v-for="(choice, index) in screen.choices" :key="index" class="card" :data-choice="index" @click="screen.choose(index)"><small>{{ choice.category }}</small><b>{{ choice.name }}</b><span>{{ choice.description }}</span></button></div>
      <p class="fine">奶泡 Lv.5 + 冰晶 Lv.5 → 雪顶回旋<br>浓缩 Lv.5 + 焦糖 Lv.5 → 焦糖脉冲</p>
    </template>
    <template v-else-if="screen.kind === 'result'">
      <div class="eyebrow">{{ screen.run.result === 'win' ? 'CHAPTER COMPLETE' : 'COFFEE BREAK' }}</div><h2>{{ screen.title }}</h2>
      <p>{{ screen.run.result === 'win' ? `${screen.map.boss.name}已平静下来，你守住了${screen.map.name}。` : '本局已结束。尝试更早选择冰晶控制或浓缩贯穿，换一套搭配再出发。' }}</p>
      <div class="chips"><span>{{ screen.time }}</span><span>击败 {{ screen.run.kills }}</span><span>Lv. {{ screen.run.level }}</span><span>本局材料 +{{ screen.run.materials }}</span></div>
      <p>{{ screen.summary }}<template v-if="screen.evolutions"><br>{{ screen.evolutions }}</template></p>
      <div class="chips"><span v-for="reward in screen.rewards" :key="reward">{{ reward }}</span></div>
      <p v-if="screen.receipt?.unlocked.length">本次解锁：{{ screen.receipt.unlocked.join(' / ') }} · 返回首页即可使用</p>
      <p v-if="screen.run.legacy" class="fine">本局来自旧版存档：保留原四技能规则，不补发新增碎片。</p>
      <p class="fine">{{ screen.savedMessage }}</p>
      <div class="actions"><button id="again" class="primary" @click="screen.again">再来一局</button><button id="home" class="secondary" @click="screen.home">返回首页</button></div>
    </template>
    <div v-if="screen.kind === 'pause'" class="settings">
      <label><input id="sound" type="checkbox" :checked="screen.sound" @change="screen.changeSound($event.target.checked)"> 开启轻音效</label><span>本原型无背景音乐</span>
    </div>
  </template>
    </div>
  </section>
</template>

<style src="./menu.css"></style>