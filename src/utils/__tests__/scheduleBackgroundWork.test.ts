import assert from "node:assert/strict";
import test from "node:test";
import { scheduleBackgroundWork } from "../scheduleBackgroundWork";

function withWindow(value: Window, run: () => void): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value });
  try {
    run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("runs scheduled work in an idle callback after the initial delay", () => {
  const timers = new Map<number, () => void>();
  let idleTask: (() => void) | undefined;
  let nextId = 0;
  let calls = 0;
  const fakeWindow = {
    setTimeout: (callback: () => void) => { const id = ++nextId; timers.set(id, callback); return id; },
    clearTimeout: (id: number) => { timers.delete(id); },
    requestIdleCallback: (callback: () => void) => { idleTask = callback; return ++nextId; },
    cancelIdleCallback: () => {},
  } as unknown as Window;

  withWindow(fakeWindow, () => {
    scheduleBackgroundWork(() => { calls += 1; }, 250, 800);
    assert.equal(calls, 0);
    timers.get(1)?.();
    assert.equal(calls, 0);
    idleTask?.();
    assert.equal(calls, 1);
  });
});

test("cancels idle callbacks with the matching API and does not clear their timer IDs", () => {
  const timers = new Map<number, () => void>();
  const clearedTimers: number[] = [];
  const cancelledIdle: number[] = [];
  let idleTask: (() => void) | undefined;
  let calls = 0;
  const fakeWindow = {
    setTimeout: (callback: () => void) => { timers.set(1, callback); return 1; },
    clearTimeout: (id: number) => { clearedTimers.push(id); },
    requestIdleCallback: (callback: () => void) => { idleTask = callback; return 1; },
    cancelIdleCallback: (id: number) => { cancelledIdle.push(id); },
  } as unknown as Window;

  withWindow(fakeWindow, () => {
    const cancel = scheduleBackgroundWork(() => { calls += 1; }, 0, 500);
    timers.get(1)?.();
    cancel();
    idleTask?.();
  });

  assert.deepEqual(cancelledIdle, [1]);
  assert.deepEqual(clearedTimers, []);
  assert.equal(calls, 0);
});
