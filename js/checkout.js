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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Checkout nu a putut fi creat.");
    window.location.assign(data.url);
  } catch (error) {
    console.error(error);
    toast("Checkout este gata dup\u0103 ce cheile Cloudflare \u0219i Stripe sunt configurate.");
  }
}
