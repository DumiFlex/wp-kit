/**
 * One shared "measure, then change" pass per frame for layout work.
 *
 * Reading a size (`scrollHeight`, `getBoundingClientRect`, `getComputedStyle`
 * of a box) after a DOM write makes the browser lay the page out right then.
 * One read is cheap; a list of fields that each read and then write forces one
 * full layout PER FIELD. That is what made the 151-option wildcard editor take
 * ~470 ms to settle: every growable field measured itself and set its height
 * in turn, and every measurement after the first re-laid-out a 20k-node page.
 *
 * Here every queued task runs in three steps, each one for ALL tasks before
 * the next starts:
 *
 *   1. `prepare`: writes that must land before measuring (`height: auto`,
 *      dropping an attribute that changes padding);
 *   2. `measure`: reads only;
 *   3. `apply`: writes from what was read (heights, attributes, reactive state).
 *
 * so a frame costs one layout however many tasks it holds. A task queued
 * during a pass (say a follow-up measurement after `apply` changed a height)
 * runs in another round of the same frame, so it still lands before paint.
 *
 * Tasks are keyed: queueing the same key again before the frame runs keeps one
 * task, so a field that asks five times in a frame is measured once.
 *
 * Without `requestAnimationFrame` (tests, SSR) the work runs at once.
 */

export interface LayoutTask {
  /** DOM writes that must happen before the measurement. */
  prepare?: (() => void) | undefined;
  /** Layout reads. Write nothing here. */
  measure?: (() => void) | undefined;
  /** Writes based on what `measure` read. May queue more work. */
  apply?: (() => void) | undefined;
}

/** Rounds one frame may run before the rest waits for the next frame, so a
 *  task that keeps re-queueing itself cannot hang the page. */
const MAX_ROUNDS = 4;

const queue = new Map<object, LayoutTask>();
let scheduled = false;
let running = false;

function report(err: unknown): void {
  // One broken task must not strand everyone else's; surface it afterwards.
  setTimeout(() => { throw err; });
}

function each(tasks: LayoutTask[], step: "prepare" | "measure" | "apply"): void {
  for (const t of tasks) {
    const fn = t[step];
    if (!fn) continue;
    try { fn(); } catch (err) { report(err); }
  }
}

/** Run everything queued now, in prepare / measure / apply order. The frame
 *  calls it; tests (and code that must read a settled size) may too. */
export function flushLayout(): void {
  if (running) return;
  scheduled = false;
  running = true;
  try {
    for (let round = 0; round < MAX_ROUNDS && queue.size > 0; round++) {
      const tasks = [...queue.values()];
      queue.clear();
      each(tasks, "prepare");
      each(tasks, "measure");
      each(tasks, "apply");
    }
  } finally {
    running = false;
  }
  if (queue.size > 0) schedule();
}

function schedule(): void {
  if (scheduled || running) return;
  if (typeof requestAnimationFrame !== "function") {
    flushLayout();
    return;
  }
  scheduled = true;
  requestAnimationFrame(flushLayout);
}

/** Queue `task` under `key` for the next layout pass (this frame's, when one
 *  is running). Queueing a key that is already waiting replaces its task. */
export function queueLayout(key: object, task: LayoutTask): void {
  queue.set(key, task);
  schedule();
}

/** Drop `key`'s waiting task, e.g. when its element goes away. */
export function cancelLayout(key: object): void {
  queue.delete(key);
}

/** Number of tasks waiting. For tests. */
export function pendingLayout(): number {
  return queue.size;
}
