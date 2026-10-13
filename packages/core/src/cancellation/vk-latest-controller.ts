// [CS.03] Latest-request priority controller preventing race conditions
/**
 * Lightweight local controller ensuring that newer requests automatically cancel prior incomplete ones.
 * Prevents race condition overwrites in rapid input, search, or parameter switching scenarios.
 */
export class VKLatestController {
  private _controller: AbortController = new AbortController();

  /**
   * The current active AbortSignal.
   */
  public get signal(): AbortSignal {
    return this._controller.signal;
  }

  /**
   * Whether the currently active signal has been aborted.
   */
  public get isAborted(): boolean {
    return this._controller.signal.aborted;
  }

  /**
   * Aborts the previous in-flight operation and produces a new, fresh AbortSignal.
   */
  public next(reason?: unknown): AbortSignal {
    if (!this._controller.signal.aborted) {
      let abortReason = reason;
      if (abortReason === undefined) {
        const err = new Error('Operation superseded by a newer invocation (VKLatestController)');
        err.name = 'AbortError';
        abortReason = err;
      }
      this._controller.abort(abortReason);
    }
    this._controller = new AbortController();
    return this._controller.signal;
  }

  /**
   * Explicitly aborts the currently active signal without immediately cycling to a new one.
   */
  public abort(reason?: unknown): void {
    if (!this._controller.signal.aborted) {
      let abortReason = reason;
      if (abortReason === undefined) {
        const err = new Error('Operation aborted (VKLatestController)');
        err.name = 'AbortError';
        abortReason = err;
      }
      this._controller.abort(abortReason);
    }
  }

  /**
   * Runs an asynchronous operation with a freshly cycled AbortSignal,
   * automatically aborting any previously running operation started via this controller.
   */
  public async run<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const signal = this.next();
    return fn(signal);
  }
}

/**
 * Factory helper for creating an instance of VKLatestController.
 */
export function createVKLatestController(): VKLatestController {
  return new VKLatestController();
}
