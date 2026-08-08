import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Create client only if valid credentials are provided.
// During build/prerender or before env vars are set, returns a dummy client
// that logs warnings instead of crashing.
function createSafeClient(): SupabaseClient {
  if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (typeof window !== 'undefined') {
    console.warn(
      '[Supabase] Variáveis de ambiente não configuradas. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local'
    );
  }

  // Return a proxy that safely handles calls during build/dev without crashing
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === 'from') {
        return () =>
          new Proxy(
            {},
            {
              get() {
                return () =>
                  Promise.resolve({
                    data: null,
                    error: {
                      message: 'Supabase não configurado. Verifique o .env.local',
                      code: 'NOT_CONFIGURED',
                    },
                  });
              },
            }
          );
      }
      return () => {};
    },
  });
}

export const supabase = createSafeClient();
