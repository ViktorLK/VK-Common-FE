// [AP.01] DisposableStore collection container
import type { VKDisposable } from './disposable.types.js';

export interface DisposableStoreOptions {
  readonly onError?: (error: unknown) => void;
}

/**
 * Manages a collection of disposables, disposing all of them at once.
 */
export class DisposableStore implements VKDisposable {
  private readonly _toDispose = new Set<VKDisposable>();
  private _isDisposed = false;
  private readonly _onError?: (error: unknown) => void;

  constructor(options?: DisposableStoreOptions) {
    this._onError = options?.onError;
  }

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Adds a disposable to the store. If the store is already disposed, the disposable is disposed immediately.
   */
  public add<T extends VKDisposable>(disposable: T): T {
    if (!disposable) {
      return disposable;
    }
    if (this._isDisposed) {
      disposable.dispose();
      return disposable;
    }
    this._toDispose.add(disposable);
    return disposable;
  }

  /**
   * Disposes all tracked disposables and clears the store.
   */
  public clear(): void {
    if (this._toDispose.size === 0) {
      return;
    }
    const disposables = Array.from(this._toDispose);
    this._toDispose.clear();
    const errors: unknown[] = [];

    for (const d of disposables) {
      try {
        d.dispose();
      } catch (err) {
        if (this._onError) {
          this._onError(err);
        } else {
          errors.push(err);
        }
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 1) {
      if (typeof AggregateError !== 'undefined') {
        throw new AggregateError(errors, 'Multiple errors occurred while clearing DisposableStore.');
      } else {
        throw errors[0];
      }
    }
  }

  /**
   * Disposes the store and marks it as permanently disposed.
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this.clear();
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }
}

/**
 * Conforms to VK naming convention and Explicit Resource Management paradigm (Item 25).
 */
export const VKDisposableStack = DisposableStore;
export type VKDisposableStack = DisposableStore;
export type VKDisposableStackOptions = DisposableStoreOptions;

