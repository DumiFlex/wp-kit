/**
 * Lets a floating piece (a Select's list, a menu, a nested Popover) that is
 * opened from inside a Popover count as part of it. Those pieces teleport to
 * <body>, outside the Popover's panel, so without this a click on one is a
 * click outside the Popover (which closes it) and the Popover's Escape
 * handler, listening first, closes it before the inner list can.
 *
 * A Popover calls `provideFloatingLayer()`; a floating piece calls
 * `useFloatingChild(() => el)` with its floating element (null while shut).
 */
import { inject, onBeforeUnmount, provide, type InjectionKey } from "vue";

type Getter = () => HTMLElement | null;

interface FloatingLayer {
  add(get: Getter): () => void;
}

const FLOATING_LAYER: InjectionKey<FloatingLayer> = Symbol("wp-floating-layer");

export interface OwnedFloating {
  /** True when the event path runs through an open child. */
  owns(path: readonly EventTarget[]): boolean;
  /** True while any child has its floating element open. */
  childOpen(): boolean;
}

export function provideFloatingLayer(): OwnedFloating {
  const children = new Set<Getter>();
  provide(FLOATING_LAYER, {
    add(get) {
      children.add(get);
      return () => { children.delete(get); };
    },
  });
  const open = (): HTMLElement[] => [...children].map((g) => g()).filter((el): el is HTMLElement => el !== null);
  return {
    owns: (path) => open().some((el) => path.includes(el)),
    childOpen: () => open().length > 0,
  };
}

export function useFloatingChild(get: Getter): void {
  const layer = inject(FLOATING_LAYER, null);
  if (!layer) return;
  const remove = layer.add(get);
  onBeforeUnmount(remove);
}
