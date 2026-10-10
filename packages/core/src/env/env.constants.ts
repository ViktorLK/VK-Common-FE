// [CS.07] Safe static runtime environment detection constants (No side-effects on import)
import { vkDetectEnv } from './vk-detect-env.js';

const initialEnv = vkDetectEnv();

export const isBrowser: boolean = initialEnv.isBrowser;
export const isWorker: boolean = initialEnv.isWorker;
export const isServer: boolean = initialEnv.isServer;
export const isTauri: boolean = initialEnv.isTauri;
export const isEdge: boolean = initialEnv.isEdge;
export const isReactServer: boolean = initialEnv.isReactServer;

/**
 * Pure dynamic getters avoiding stale module-level evaluations across SSR hydration.
 */
export const getIsBrowser = (): boolean => vkDetectEnv().isBrowser;
export const getIsServer = (): boolean => vkDetectEnv().isServer;
export const getIsWorker = (): boolean => vkDetectEnv().isWorker;
export const getIsTauri = (): boolean => vkDetectEnv().isTauri;
export const getIsEdge = (): boolean => vkDetectEnv().isEdge;
export const getIsReactServer = (): boolean => vkDetectEnv().isReactServer;

