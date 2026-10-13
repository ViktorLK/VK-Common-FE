// [CS.03] Concurrency and async primitive contracts

export interface VKMutex {
  readonly run: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
  * Alias conforming to VK prefix convention (Item 20).
  */
export type VKAsyncLock = VKMutex;

export interface VKKeyedSingleFlight {
  readonly run: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
}

