import { getSupabase, hasSupabaseConfig } from "./supabase.js";

export function initAuth() {
  const form = document.getElementById("auth-form");
  const note = document.getElementById("auth-note");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = new FormData(form).get("email");
    if (!hasSupabaseConfig()) {
      note.textContent = "Adaug\u0103 URL-ul și cheia anon Supabase \u00een js/supabase.js sau window.LUMINACUTINE_CONFIG pentru a ac\u021biva conectarea.";
      return;
    }
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    note.textContent = error ? error.message : "Legatur\u0103 magic trimis\u0103. Verific\u0103-ți emailul.";
  });
}
