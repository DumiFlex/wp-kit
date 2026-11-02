import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/** Words for the WorkingLine demos: a few playful ones and the real status
 *  in between, as the extension's AI line says them. */
const WORDS = ["Shuffling", "Reading the prompt", "Drawing wildcards", "Thinking", "Weaving", "Writing · 420 tokens"];

/** A word that changes every few seconds and a running time, like a request
 *  in flight. */
export function useWorkingDemo(everyMs = 2600): { word: Ref<string>; time: Ref<string> } {
  const word = ref(WORDS[0] ?? "Working");
  const time = ref("0s");
  let i = 0;
  let s = 0;
  let wordTimer: ReturnType<typeof setInterval> | undefined;
  let clock: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    wordTimer = setInterval(() => { i = (i + 1) % WORDS.length; word.value = WORDS[i] ?? "Working"; }, everyMs);
    clock = setInterval(() => { s += 1; time.value = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`; }, 1000);
  });
  onBeforeUnmount(() => { clearInterval(wordTimer); clearInterval(clock); });
  return { word, time };
}
