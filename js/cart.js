import { formatMoney, getProduct, getVariant } from "./products.js";
import { icons, toast } from "./ui.js";
import { getCurrentUser, getSupabase } from "./supabase.js";

const CART_KEY = "luminacutine_cart";
const SHIPPING_THRESHOLD = 20000; // keep in sync with FREE_SHIPPING_THRESHOLD_CENTS in functions/create-checkout.js
const SHIPPING_AMOUNT = 1500; // keep in sync with STANDARD_SHIPPING_CENTS in functions/create-checkout.js
let state = { items: [] };

export function initCart() {
  state = loadCart();
  renderCartDrawer();
  bindCartEvents();
  updateCartViews();
  syncCartToSupabase();
}

export function getCartItems() {
  return state.items;
}

export async function getCartPayload() {
  const rows = await Promise.all(state.items.map(async (item) => {
    const product = await getProduct(item.id);
    const variant = item.variantId ? await getVariant(item.id, item.variantId) : null;
    return {
      id: item.id,
      variantId: item.variantId || null,
      quantity: item.quantity,
      title: variant ? `${product.title} — ${variant.color_name}` : product.title,
      price: product.price
    };
  }));
  return rows;
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state));
}

function findItem(id, variantId) {
  return state.items.find((item) => item.id === id && (item.variantId || null) === (variantId || null));
}

function bindCartEvents() {
  document.addEventListener("click", async (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    const buyButton = event.target.closest("[data-buy-now]");
    const openButton = event.target.closest("[data-cart-open]");
    const closeButton = event.target.closest("[data-cart-close]");
    const qtyButton = event.target.closest("[data-cart-qty]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (addButton) {
      await addToCart(
        addButton.dataset.addToCart,
        Number(addButton.dataset.quantity || 1),
        true,
        addButton.dataset.variantId || null
      );
    }
    if (buyButton) {
      await addToCart(
        buyButton.dataset.buyNow,
        Number(buyButton.dataset.quantity || 1),
        false,
        buyButton.dataset.variantId || null
      );
      document.dispatchEvent(new CustomEvent("aurelia:checkout"));
    }
    if (openButton) openCart();
    if (closeButton) closeCart();
    if (qtyButton) updateQuantity(qtyButton.dataset.cartQty, qtyButton.dataset.variantId || null, Number(qtyButton.dataset.delta));
    if (removeButton) removeFromCart(removeButton.dataset.cartRemove, removeButton.dataset.variantId || null);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
  });
}

export async function addToCart(id, quantity = 1, shouldOpen = true, variantId = null) {
  const product = await getProduct(id);
  if (!product) return;

  if (variantId) {
    const variant = await getVariant(id, variantId);
    if (!variant || variant.inventory <= 0) {
      toast("Această culoare este în prezent epuizată.");
      return;
    }
  } else if (product.availability === "out_of_stock") {
    toast("Această piesă este în prezent epuizată.");
    return;
  }

  const existing = findItem(id, variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.items.push({ id, variantId: variantId || null, quantity });
  }
  persistAndRender();
  toast(`${product.title} adaugat la coș. `);
  if (shouldOpen) openCart();
}

function updateQuantity(id, variantId, delta) {
  const item = findItem(id, variantId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id, variantId);
    return;
  }
  persistAndRender();
}

function removeFromCart(id, variantId) {
  state.items = state.items.filter((item) => !(item.id === id && (item.variantId || null) === (variantId || null)));
  persistAndRender();
}

function persistAndRender() {
  saveCart();
  updateCartViews();
  syncCartToSupabase();
}

function openCart() {
  document.getElementById("cart-drawer")?.classList.add("is-open");
  document.body.classList.add("is-locked");
}

function closeCart() {
  document.getElementById("cart-drawer")?.classList.remove("is-open");
  document.body.classList.remove("is-locked");
}

function renderCartDrawer() {
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="cart-drawer" id="cart-drawer" aria-label="Sertar cu coșul de cumpărături" aria-modal="true">
      <div class="cart-drawer__overlay" data-cart-close></div>
      <div class="cart-drawer__panel">
        <header class="cart-drawer__header">
          <h2>Coșul dvs.</h2>
          <button class="icon-button" type="button" aria-label="Inchide coș" data-cart-close>${icons.close}</button>
        </header>
        <div class="cart-list" id="cart-drawer-items"></div>
        <footer class="cart-drawer__footer">
          <div class="summary-row"><span>Subtotal</span><strong data-cart-subtotal>0.00 lei</strong></div>
          <div class="summary-row"><span>Livrare estimată</span><strong data-cart-shipping>0.00 lei</strong></div>
          <div class="summary-row summary-row--total"><span>Total</span><strong data-cart-total>0.00 lei</strong></div>
          <button class="button button--primary button--full" type="button" data-checkout>Checkout</button>
          <a class="button button--ghost button--full" href="cart.html">Vezi Coșul</a>
        </footer>
      </div>
    </aside>`);
}

async function updateCartViews() {
  const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });

  const rows = await Promise.all(state.items.map(async (item) => ({
    item,
    product: await getProduct(item.id),
    variant: item.variantId ? await getVariant(item.id, item.variantId) : null
  })));
  const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.item.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_AMOUNT;

  document.querySelectorAll("[data-cart-subtotal]").forEach((node) => node.textContent = formatMoney(subtotal));
  document.querySelectorAll("[data-cart-shipping]").forEach((node) => node.textContent = formatMoney(shipping));
  document.querySelectorAll("[data-cart-total]").forEach((node) => node.textContent = formatMoney(subtotal + shipping));

  const markup = rows.length ? rows.map(renderCartItem).join("") : emptyCartMarkup();
  document.getElementById("cart-drawer-items").innerHTML = markup;
  const pageItems = document.getElementById("cart-page-items");
  if (pageItems) pageItems.innerHTML = markup;
}

function renderCartItem({ item, product, variant }) {
  const variantIdAttr = item.variantId || "";
  return `
    <article class="cart-item">
      <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
      <div class="cart-item__body">
        <div class="cart-item__title"><span>${product.title}${variant ? ` — ${variant.color_name}` : ""}</span><strong>${formatMoney(product.price * item.quantity)}</strong></div>
        <p class="cart-item__meta">${formatMoney(product.price)} fiecare</p>
        <div class="cart-item__controls">
          <span class="mini-qty" aria-label="Cantitate pentru ${product.title}">
            <button type="button" data-cart-qty="${item.id}" data-variant-id="${variantIdAttr}" data-delta="-1" aria-label="Micșoreaza cantitatea">-</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-qty="${item.id}" data-variant-id="${variantIdAttr}" data-delta="1" aria-label="Crește cantitatea">+</button>
          </span>
          <button class="remove-button" type="button" data-cart-remove="${item.id}" data-variant-id="${variantIdAttr}">Șterge</button>
        </div>
      </div>
    </article>`;
}

function emptyCartMarkup() {
  return `
    <div class="empty-cart">
      <img src="assets/images/empty-cart.png" alt="" loading="lazy">
      <h3>Coșul dvs. este gol.</h3>
      <p class="form-note">Adaugă o colieră sau o brățară pentru a începe.</p>
      <a class="button button--primary" href="collection.html">Cumpără Colecția</a>
    </div>`;
}

async function syncCartToSupabase() {
  const supabase = await getSupabase();
  const user = await getCurrentUser();
  if (!supabase || !user) return;
  await supabase
    .from("profiles")
    .upsert({ id: user.id, cart: state, updated_at: new Date().toISOString() });
}