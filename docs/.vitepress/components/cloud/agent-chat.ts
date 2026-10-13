import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export type AgentScript = { ask: string; working: string; done: string; reply: string; link?: string; caption: string };

export const Stage = { Idle: 0, Typing: 1, Send: 2, Sent: 3, Thinking: 4, Working: 5, Done: 6, Reply: 7, Reset: 8 } as const;

export function useAgentChat(root: Ref<HTMLElement | undefined>, ask: string) {
  const stage = ref<number>(Stage.Reply);
  const typed = ref(ask.length);
  const animated = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = 0;
  let inView = false;
  let observer: IntersectionObserver | undefined;

  const charDelay = (char: string) => 45 + Math.random() * 70 + (char === ' ' && Math.random() < 0.3 ? 120 : 0);

  function advance(): number {
    switch (stage.value) {
      case Stage.Idle:
        stage.value = Stage.Typing;
        typed.value = 0;
        return 200;
      case Stage.Typing:
        if (typed.value < ask.length) {
          typed.value += 1;
          return typed.value === ask.length ? 450 : charDelay(ask[typed.value]);
        }
        stage.value = Stage.Send;
        return 260;
      case Stage.Send:
        stage.value = Stage.Sent;
        return 700;
      case Stage.Sent:
        stage.value = Stage.Thinking;
        return 1100;
      case Stage.Thinking:
        stage.value = Stage.Working;
        return 1500;
      case Stage.Working:
        stage.value = Stage.Done;
        return 650;
      case Stage.Done:
        stage.value = Stage.Reply;
        return 3400;
      case Stage.Reply:
        stage.value = Stage.Reset;
        return 600;
      default:
        stage.value = Stage.Idle;
        typed.value = 0;
        return 700;
    }
  }

  const active = () => inView && document.visibilityState === 'visible';

  function schedule(ms: number) {
    if (!active()) {
      pending = ms;
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      schedule(advance());
    }, ms);
  }

  function sync() {
    if (active() && !timer) schedule(pending);
    if (!active() && timer) {
      clearTimeout(timer);
      timer = undefined;
      pending = 400;
    }
  }

  onMounted(() => {
    if (!root.value || !('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animated.value = true;
    stage.value = Stage.Idle;
    typed.value = 0;
    pending = 500;
    observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting && (inView || entry.intersectionRatio >= 0.29));
      sync();
    }, { threshold: [0, 0.3] });
    observer.observe(root.value);
    document.addEventListener('visibilitychange', sync);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    if (timer) clearTimeout(timer);
  });

  return { stage, typed, animated };
}
