// [AP.01] Strict TypeScript mode
// [AP.02] Composition over prop drilling
// [MB.03] Typed context with fail-fast validation
// [MB.05] Typed config interfaces and timezone options

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import type {
  VKTimezoneContextValue,
  VKTimezoneProviderProps,
} from './timezone.types.js';
import { createVKTimezonePipeline } from './pipeline.js';
import { getVKUserTimeZone } from '../datetime/formatters.js';

const VKTimezoneContext = createContext<VKTimezoneContextValue | null>(null);

export const VKTimezoneProvider: React.FC<VKTimezoneProviderProps> = ({
  userTimezone: controlledUserTz,
  serverTimezone: controlledServerTz,
  defaultUserTimezone,
  defaultServerTimezone = 'UTC',
  storageKey = 'vk-timezone-user-preference',
  locale = 'default',
  children,
}) => {
  // Read persisted user timezone preference safely for SSR
  const [internalUserTz, setInternalUserTz] = useState<string>(() => {
    if (typeof window === 'undefined' || !storageKey) {
      return defaultUserTimezone ?? getVKUserTimeZone();
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored.trim().length > 0) {
        return stored;
      }
    } catch {
      // Storage access blocked or unavailable
    }
    return defaultUserTimezone ?? getVKUserTimeZone();
  });

  const [internalServerTz, setInternalServerTz] = useState<string>(
    defaultServerTimezone,
  );

  const activeUserTz = controlledUserTz !== undefined ? controlledUserTz : internalUserTz;
  const activeServerTz = controlledServerTz !== undefined ? controlledServerTz : internalServerTz;

  const handleSetUserTimezone = useCallback(
    (tz: string) => {
      setInternalUserTz(tz);
      if (typeof window !== 'undefined' && storageKey) {
        try {
          localStorage.setItem(storageKey, tz);
        } catch {
          // Ignore storage write failures
        }
      }
    },
    [storageKey],
  );

  const handleSetServerTimezone = useCallback((tz: string) => {
    setInternalServerTz(tz);
  }, []);

  // Sync controlled props changes
  useEffect(() => {
    if (controlledUserTz !== undefined) {
      setInternalUserTz(controlledUserTz);
    }
  }, [controlledUserTz]);

  useEffect(() => {
    if (controlledServerTz !== undefined) {
      setInternalServerTz(controlledServerTz);
    }
  }, [controlledServerTz]);

  const pipeline = useMemo(() => {
    return createVKTimezonePipeline({
      userTimezone: activeUserTz,
      serverTimezone: activeServerTz,
      locale,
    });
  }, [activeUserTz, activeServerTz, locale]);

  const contextValue = useMemo<VKTimezoneContextValue>(() => {
    return {
      userTimezone: activeUserTz,
      serverTimezone: activeServerTz,
      setUserTimezone: handleSetUserTimezone,
      setServerTimezone: handleSetServerTimezone,
      pipeline,
    };
  }, [activeUserTz, activeServerTz, handleSetUserTimezone, handleSetServerTimezone, pipeline]);

  return (
    <VKTimezoneContext.Provider value={contextValue}>
      {children}
    </VKTimezoneContext.Provider>
  );
};

VKTimezoneProvider.displayName = 'VKTimezoneProvider';

/**
 * Accesses active timezone context and timezone shift pipeline.
 * [MB.03] Fails fast when used outside VKTimezoneProvider.
 */
export function useVKTimezone(): VKTimezoneContextValue {
  const context = useContext(VKTimezoneContext);
  if (!context) {
    throw new Error('useVKTimezone must be used within a <VKTimezoneProvider>');
  }
  return context;
}
