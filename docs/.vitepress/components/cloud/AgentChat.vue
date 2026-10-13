<script setup lang="ts">
import { computed, ref } from 'vue';
import LandingFrame from '../landing/LandingFrame.vue';
import LucideIcon from '../landing/LucideIcon.vue';
import { Stage, useAgentChat, type AgentScript } from './agent-chat';

const props = defineProps<{ script: AgentScript }>();
const root = ref<HTMLElement>();
const { stage, typed, animated } = useAgentChat(root, props.script.ask);

const between = (from: number, to: number) => stage.value >= from && stage.value < to;
const typing = computed(() => between(Stage.Typing, Stage.Sent));
const done = computed(() => stage.value >= Stage.Done);
</script>

<template>
  <figure ref="root" class="agent-chat">
    <figcaption class="visually-hidden">{{ props.script.caption }}</figcaption>
    <LandingFrame class="agent-chat__frame" label="AI Agent" aria-hidden="true" inert>
      <div :class="['chat', { 'chat--animated': animated }]">
        <p :class="['user', 'step', { off: !between(Stage.Sent, Stage.Reset) }]">{{ props.script.ask }}</p>
        <div class="agent">
          <span :class="['dots', 'step', { off: stage !== Stage.Thinking }]"><i /><i /><i /></span>
          <p :class="['tool', 'step', { off: !between(Stage.Working, Stage.Reset) }]">
            <LucideIcon v-if="done" class="tool__check" name="check" />
            <span v-else class="tool__spinner" />
            {{ done ? props.script.done : props.script.working }}
          </p>
        </div>
        <p :class="['reply', 'step', { off: !between(Stage.Reply, Stage.Reset) }]">
          {{ props.script.reply }}
          <template v-if="props.script.link"><br /><span class="reply__link">{{ props.script.link }}</span></template>
        </p>
        <div :class="['input', { 'input--filled': typing && typed > 0, 'input--sending': stage === Stage.Send }]">
          <span class="input__text">
            <span v-if="typing" class="input__typed">{{ props.script.ask.slice(0, typed) }}<span class="input__caret" /></span>
            <span v-else class="input__placeholder">Ask your agent anything</span>
            <span class="input__spacer" />
          </span>
          <span class="input__send"><LucideIcon name="arrow-up" /></span>
        </div>
      </div>
    </LandingFrame>
  </figure>
</template>

<style scoped>
.agent-chat { max-width: 760px; margin: 0 auto; }
.agent-chat__frame { pointer-events: none; user-select: none; -webkit-user-select: none; cursor: default; }
.chat { display: flex; flex-direction: column; gap: 28px; padding: 32px; font-size: 16px; line-height: 26px; }
.chat p { margin: 0; }
.user { align-self: flex-end; max-width: 440px; padding: 16px 20px; border-radius: 16px 16px 4px 16px; background: var(--vp-c-bg-soft); }
.agent { position: relative; min-height: 26px; }
.tool { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--vp-c-text-2); white-space: nowrap; }
.tool__spinner { flex: none; width: 14px; height: 14px; margin: 1px; border: 2px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; }
.tool__check { width: 16px; height: 16px; color: var(--vp-c-brand-1); }
.dots { position: absolute; top: 0; left: 0; display: flex; align-items: center; gap: 5px; height: 26px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--vp-c-text-3); }
.reply { max-width: 580px; }
.reply__link { color: var(--vp-c-brand-1); text-decoration: none; overflow-wrap: anywhere; }
.input { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 8px 0 16px; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-soft); }
.input__text { display: flex; justify-content: flex-end; flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
.input__typed, .input__placeholder { flex: none; }
.input__placeholder { color: var(--vp-c-text-3); }
.input__spacer { flex: 1 0 0; }
.input__caret { display: inline-block; width: 2px; height: 18px; margin-left: 1px; vertical-align: -3px; background: var(--vp-c-brand-1); }
.input__send { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 8px; color: var(--vp-c-text-3); background: var(--vp-c-default-soft); }
.input--filled .input__send { color: var(--vp-c-white); background: var(--vp-c-brand-1); }

.chat--animated .step { transition: opacity 0.35s ease, transform 0.35s ease; }
.chat--animated .user { transition-duration: 0.45s; }
.chat--animated .off { opacity: 0; transform: translateY(8px); }
.chat--animated .user.off { transform: translateY(20px); }
.chat--animated .dots { transition-duration: 0.2s; }
.chat--animated .dots.off { transform: none; }
.chat--animated .tool:not(.off) { transition-delay: 0.2s; }
.chat--animated .input__send { transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease; }
.chat--animated .input--sending .input__send { transform: scale(0.88); }
.chat--animated .input__caret { animation: blink 1s steps(1) infinite; }
.chat--animated .tool__spinner { animation: spin 0.8s linear infinite; }
.chat--animated .dots:not(.off) i { animation: bob 1.1s ease-in-out infinite; }
.chat--animated .dots i:nth-child(2) { animation-delay: 0.15s; }
.chat--animated .dots i:nth-child(3) { animation-delay: 0.3s; }

@keyframes blink { 50% { opacity: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bob { 0%, 60%, 100% { opacity: 0.35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }

@media (max-width: 767px) {
  .chat { padding: 20px; gap: 24px; }
}
</style>
