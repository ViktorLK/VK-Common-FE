// [AP.01] Resource management interfaces

export interface VKDisposable {
  readonly dispose: () => void;
  [Symbol.dispose]?: () => void;
}

export interface VKAsyncDisposable {
  readonly disposeAsync: () => Promise<void>;
  [Symbol.asyncDispose]?: () => Promise<void>;
}

export interface VKCombineDisposablesOptions {
  readonly onError?: (error: unknown) => void;
}
