<script setup>
import { computed } from 'vue';
import { CloudLightning, Coffee, Flame, Flower2, Leaf, Pause, Plus, Snowflake, Sparkles, Users, Waves, Zap } from 'lucide-vue-next';

const props = defineProps({ state: { type: Object, required: true }, notice: { type: Object, required: true }, stick: { type: Object, required: true } });
const emit = defineEmits(['pause']);
const hud = computed(() => props.state.value);
const notification = computed(() => props.notice.value);
const stickPosition = computed(() => props.stick.value);
const skillIcons = { foam: Coffee, ice: Snowflake, espresso: Zap, caramel: Waves, matcha: Leaf, cocoa: Sparkles, storm: CloudLightning, blossom: Flower2, roast: Flame };
</script>

<template>
  <div class="gameplay-hud" :hidden="!hud.visible">
    <header class="hud">
      <section class="player-card" aria-label="角色状态">
        <span class="character-emblem">{{ hud.characterName?.slice(0, 1) }}</span>
        <div class="player-copy"><small>{{ hud.characterTitle }}</small><b>{{ hud.characterName }}</b><span class="player-level">Lv. {{ hud.level }}</span></div>
        <div class="health"><div class="health-line"><span>HP</span><b id="hp-text">{{ hud.healthText }}</b></div><div class="track"><i id="hp" :style="{ width: `${hud.health}%` }"></i></div></div>
      </section>
      <section class="run-card" aria-label="门店与计时">
        <div class="map-info"><small>当前门店</small><b id="store-name">{{ hud.mapName }}</b></div>
        <div class="clock"><strong id="clock">{{ hud.clock }}</strong><span id="phase">{{ hud.phase }}</span></div>
      </section>
      <div class="hud-actions"><span class="kill-count"><Users :size="15" /><b id="kills">{{ hud.kills }}</b></span><button id="pause" class="icon" aria-label="暂停游戏" title="暂停游戏" @click="emit('pause')"><Pause :size="19" /></button></div>
    </header>
    <div class="status"><span id="boss-hint">{{ hud.bossHint }}</span></div>
    <div id="boss-bar" :hidden="!hud.boss"><span id="boss-name">{{ hud.bossName }}</span><div class="track"><i id="boss-hp" :style="{ width: `${hud.bossHealth}%` }"></i></div></div>
    <div id="joystick" aria-label="移动摇杆"><div id="stick" :style="{ transform: `translate(${stickPosition.x}px, ${stickPosition.z}px)` }"></div><span>拖动走位</span></div>
    <footer class="dock">
      <div class="experience"><b id="level">Lv. {{ hud.level }}</b><span id="xp-text">{{ hud.experienceText }}</span></div>
      <div class="track xp"><i id="xp" :style="{ width: `${hud.experience}%` }"></i></div>
    </footer>
    <aside id="skills" class="skill-rail" aria-label="技能">
      <div v-for="skill in hud.skills" :key="skill.id" class="skill" :class="{ evolved: skill.evolved }" :aria-label="`${skill.name}，等级 ${skill.level}${skill.evolved ? '，已进阶' : ''}`">
        <div class="skill-icon" :class="skill.id"><component :is="skillIcons[skill.id] || Sparkles" :size="19" :stroke-width="2.5" /><i class="skill-shade" :style="{ transform: `scaleY(${Math.max(0, Math.min(1, (100 - skill.cooldown) / 100))})` }"></i><small>{{ skill.level }}</small></div>
        <div class="skill-copy"><b>{{ skill.name }}</b><span>{{ skill.evolved ? '已进阶' : '自动技能' }}</span></div>
        <i :id="`cd-${skill.id}`" class="cooldown" :style="{ width: `${skill.cooldown}%` }"></i>
      </div>
      <div v-for="slot in hud.emptySlots" :key="`empty-${slot}`" class="skill empty" aria-label="技能空位，升级解锁"><div class="skill-icon"><Plus :size="18" /></div><div class="skill-copy"><b>空位</b><span>升级解锁</span></div></div>
    </aside>
  </div>
  <div id="notice" role="alert" :hidden="!notification"><template v-if="notification">{{ notification.message }}<button v-if="notification.retry" @click="notification.retry">重试保存</button></template></div>
</template>

<style src="./gameplay.css"></style>