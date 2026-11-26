import { whenIdle } from './when-idle';

describe('whenIdle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('runs the task when the browser is idle, with a deadline, and can be cancelled', () => {
    const queued: (() => void)[] = [];
    const request = vi.fn((cb: () => void) => queued.push(cb));
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', request);
    vi.stubGlobal('cancelIdleCallback', cancel);
    const task = vi.fn();
    const stop = whenIdle(window, task, 1500);
    expect(request).toHaveBeenCalledWith(task, { timeout: 1500 });
    expect(task).not.toHaveBeenCalled();
    queued[0]();
    expect(task).toHaveBeenCalledOnce();
    stop();
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it('falls back to a timeout without requestIdleCallback (Safari), and does nothing on the server', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const task = vi.fn();
    whenIdle(window, task);
    expect(task).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(task).toHaveBeenCalledOnce();
    const never = vi.fn();
    whenIdle(null, never)();
    expect(never).not.toHaveBeenCalled();
  });
});
