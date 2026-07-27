const DEFAULT_CONFIG = {
  supabaseUrl: "https://sbcttqfncxlzocuanypc.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiY3R0cWZuY3hsem9jdWFueXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTY2NjUsImV4cCI6MjA5OTE5MjY2NX0.2jGf_1xVARUJtQyfrHUCgs5oneQGyJFRt5tzgZ738AA"
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.AURELIA_CONFIG || window.LUMINACUTINE_CONFIG || {})
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
