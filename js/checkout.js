import { getCartPayload } from "./cart.js";
import { toast } from "./ui.js";

export function initCheckout() {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-checkout]")) await startCheckout();
  });
  document.addEventListener("aurelia:checkout", startCheckout);
}

async function startCheckout() {
  const items = await getCartPayload();
  if (!items.length) {
    toast("Co\u0219ul dvs. este gol.");
    return;
  }

  try {
    const response = await fetch("/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.error || text || "Checkout nu a putut fi creat.";
      throw new Error(`Status ${response.status}: ${detail}`);
    }

    if (!data?.url) {
      throw new Error(`Răspuns invalid de checkout: ${text || "fără URL"}`);
    }

    window.location.assign(data.url);
  } catch (error) {
    console.error(error);
    const detail = error?.message || "Nu s-a putut crea sesiunea de checkout.";
    toast(`Checkout nu a putut fi pornit: ${detail}`);
  }
}
