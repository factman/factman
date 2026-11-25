/**
 * Where the decision is kept: a first-party cookie named by site.json (`fm_consent`), or
 * localStorage under the same key when cookies are blocked. Every access can throw (privacy modes,
 * sandboxed frames, disabled storage); failures mean "nothing stored", and the choice still holds
 * for the page view.
 */
export interface ConsentStore {
  read(): string | null;
  /** Returns where the value went, or `null` when nothing could store it. */
  write(value: string, maxAgeDays: number): 'cookie' | 'localStorage' | null;
  clear(): void;
}

export function createConsentStore(doc: Document, name: string): ConsentStore {
  const storage = (): Storage | undefined => {
    try {
      return doc.defaultView?.localStorage ?? undefined;
    } catch {
      return undefined;
    }
  };

  const readCookie = (): string | null => {
    try {
      const prefix = `${name}=`;
      const hit = doc.cookie.split('; ').find((c) => c.startsWith(prefix));
      return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
    } catch {
      return null;
    }
  };

  const setCookie = (value: string, maxAgeSeconds: number): void => {
    try {
      const secure = doc.location?.protocol === 'https:' ? '; Secure' : '';
      doc.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
    } catch {
      // Cookies blocked: the caller falls back to localStorage.
    }
  };

  const removeLocal = (): void => {
    try {
      storage()?.removeItem(name);
    } catch {
      // Nothing to clear.
    }
  };

  return {
    read() {
      const cookie = readCookie();
      if (cookie !== null) return cookie;
      try {
        return storage()?.getItem(name) ?? null;
      } catch {
        return null;
      }
    },
    write(value, maxAgeDays) {
      setCookie(value, Math.round(maxAgeDays * 24 * 60 * 60));
      if (readCookie() === value) {
        removeLocal();
        return 'cookie';
      }
      try {
        const s = storage();
        if (!s) return null;
        s.setItem(name, value);
        return 'localStorage';
      } catch {
        return null;
      }
    },
    clear() {
      setCookie('', 0);
      removeLocal();
    },
  };
}
