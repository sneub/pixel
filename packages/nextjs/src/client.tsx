'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';

const DEFAULT_EVENTS_PATH = '/api/events';
const JWT_STORAGE_KEY = 'pixel-jwt';

interface PixelProviderProps {
  children: React.ReactNode;
  eventsPath?: string;
  debugMode?: boolean;
  routerType?: 'app' | 'pages';
}

interface IdentifyProps {
  email: string;
  name?: string;
  image?: string;
  userId?: string;
  data?: any;
}

type PixelContextType = {
  identify: (id: IdentifyProps) => Promise<void>;
  forget: () => void;
  track: (event?: string, data?: any) => void;
};

const PixelContext = createContext<PixelContextType>({} as PixelContextType);

export const PixelProvider: React.FC<PixelProviderProps> = ({
  children,
  eventsPath = DEFAULT_EVENTS_PATH,
  debugMode = false,
}) => {
  const pathname = usePathname();
  const params = useParams();

  const log = {
    normal: (...args: any[]) => {
      if (debugMode) {
        console.log('[Pixel]', ...args);
      }
    },
    error: (...args: any[]) => {
      if (debugMode) {
        console.error('[Pixel]', ...args);
      }
    },
  };

  const identify = async ({
    email,
    name,
    image,
    userId,
    data,
  }: IdentifyProps): Promise<void> => {
    const response = await fetch(`${window.location.origin}${eventsPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'identify',
        event: '-',
        data: {
          email,
          name,
          image,
          userId,
          data,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const { jwt } = data;
      storage.set(JWT_STORAGE_KEY, jwt);
      log.normal('Successfully identified user.');
    } else {
      const responseText = await response.text();
      log.error('Failed to identify user:', responseText);
      throw new Error(responseText);
    }
  };

  const forget = (): void => {
    storage.delete(JWT_STORAGE_KEY);
    log.normal('Session ended');
  };

  const track = async (event: any, data?: any) => {
    log.normal('Track event:', event, data);
    const jwt = storage.get(JWT_STORAGE_KEY);

    await fetch(`${window.location.origin}/${eventsPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: jwt,
        action: 'track',
        event,
        data,
      }),
    });
  };

  useEffect(() => {
    track('pageview', {
      path: pathname,
      params: params,
      route: formRouteString(pathname, params),
    });
  }, [pathname, params]);

  const formRouteString = (path: string, params: any) => {
    if (!params) return path;

    let newPath = path;
    Object.keys(params).forEach((key) => {
      newPath = newPath.replace(`${params[key]}`, `[${key}]`);
    });
    return newPath;
  };

  return (
    <PixelContext.Provider
      value={{
        identify,
        forget,
        track,
      }}
    >
      {children}
    </PixelContext.Provider>
  );
};

export const usePixel = (): PixelContextType => {
  const context = useContext(PixelContext);
  if (context === undefined) {
    throw new Error('usePixel must be used within a PixelProvider');
  }
  return context;
};

export default usePixel;

// helpers

const storage = {
  set: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  get: (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
  },
  delete: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};
