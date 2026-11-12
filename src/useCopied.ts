import { getCurrentScope, onScopeDispose, ref, type Ref } from "vue";
import { copyText } from "./clipboard";

/**
 * Copy text and remember for a moment that it was copied: the state behind
 * CopyButton, for places that draw their own button (a row's icon button, a
 * "Copy debug" text button, one button per message).
 *
 *   const copy = useCopied();
 *   <Button :icon="copy.is(row.id) ? 'pi-check' : 'pi-copy'" @click="copy.copy(row.text, row.id)">…</Button>
 *
 * `copy(text, key?)` copies through `copyText` (plain-http pages too) and
 * returns whether it worked. `key` says which of many buttons copied (a row
 * id, `"md"` vs `"json"`); leave it out when there is one. For `ms` after it
 * `copied` holds that key (or `failed` does), then both go back to null, so
 * every button flips back on the same beat. The timer stops with the
 * component.
 */
export interface Copied<K> {
  /** The key of the last copy that worked, for `ms` after it. */
  copied: Ref<K | null>;
  /** The key of the last copy that failed, for `ms` after it. */
  failed: Ref<K | null>;
  /** True while `key` (or the only button) shows "Copied". */
  is: (key?: K) => boolean;
  copy: (text: string | (() => string | Promise<string>), key?: K) => Promise<boolean>;
}

/** How long "Copied" stays up, the same everywhere. */
export const COPIED_MS = 1600;

export function useCopied<K = true>(ms: number = COPIED_MS): Copied<K> {
  const copied = ref<K | null>(null) as Ref<K | null>;
  const failed = ref<K | null>(null) as Ref<K | null>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string | (() => string | Promise<string>), key?: K): Promise<boolean> {
    const k = (key === undefined ? true : key) as K;
    let value = "";
    try {
      value = typeof text === "function" ? await text() : text;
    } catch {
      value = "";
    }
    const ok = value !== "" && await copyText(value);
    copied.value = ok ? k : null;
    failed.value = ok ? null : k;
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = null; failed.value = null; }, ms);
    return ok;
  }

  function is(key?: K): boolean {
    const k = key === undefined ? true : key;
    return copied.value !== null && Object.is(copied.value, k);
  }

  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer));
  return { copied, failed, is, copy };
}
