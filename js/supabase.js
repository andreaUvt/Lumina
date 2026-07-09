const DEFAULT_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.LUMINACUTINE_CONFIG || {})
};

let supabaseClientPromise;

export function hasSupabaseConfig() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

export async function getSupabase() {
  if (!hasSupabaseConfig()) return null;
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(({ createClient }) => createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      }));
  }
  return supabaseClientPromise;
}

export async function getCurrentUser() {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function insertNewsletterSubscriber(email) {
  const supabase = await getSupabase();
  if (!supabase) return { ok: true, localOnly: true };
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });
  if (error && error.code !== "23505") throw error;
  return { ok: true };
}
