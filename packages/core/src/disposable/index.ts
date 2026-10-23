// [MB.02] Explicit barrel export
export type {
  VKDisposable,
  VKAsyncDisposable,
  VKCombineDisposablesOptions,
} from './disposable.types.js';
export { toDisposable } from './to-disposable.js';
export { combineDisposables } from './combine-disposables.js';
export {
  DisposableStore,
  type DisposableStoreOptions,
  VKDisposableStack,
  type VKDisposableStackOptions,
} from './disposable-store.js';

