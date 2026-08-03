import { formatMoney, getProduct } from "./products.js";
import { icons, toast } from "./ui.js";
import { getCurrentUser, getSupabase } from "./supabase.js";

const CART_KEY = "luminacutine_cart";
const SHIPPING_THRESHOLD = 25000;
const SHIPPING_AMOUNT = 1500;
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
  const products = await Promise.all(state.items.map((item) => getProduct(item.id)));
  return state.items.map((item, index) => ({
    id: item.id,
    quantity: item.quantity,
    title: products[index].title,
    price: products[index].price
  }));
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

function bindCartEvents() {
  document.addEventListener("click", async (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    const buyButton = event.target.closest("[data-buy-now]");
    const openButton = event.target.closest("[data-cart-open]");
    const closeButton = event.target.closest("[data-cart-close]");
    const qtyButton = event.target.closest("[data-cart-qty]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (addButton) {
      await addToCart(addButton.dataset.addToCart, Number(addButton.dataset.quantity || 1));
    }
    if (buyButton) {
      await addToCart(buyButton.dataset.buyNow, Number(buyButton.dataset.quantity || 1), false);
      document.dispatchEvent(new CustomEvent("aurelia:checkout"));
    }
    if (openButton) openCart();
    if (closeButton) closeCart();
    if (qtyButton) updateQuantity(qtyButton.dataset.cartQty, Number(qtyButton.dataset.delta));
    if (removeButton) removeFromCart(removeButton.dataset.cartRemove);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
  });
}

export async function addToCart(id, quantity = 1, shouldOpen = true) {
  const product = await getProduct(id);
  if (!product || product.availability === "out_of_stock") {
    toast("Aceasta pies\u0103 este \u00een prezent epuizat\u0103.");
    return;
  }
  const existing = state.items.find((item) => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.items.push({ id, quantity });
  }
  persistAndRender();
  toast(`${product.title} adaugat la co\u0219. `);
  if (shouldOpen) openCart();
}

function updateQuantity(id, delta) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }
  persistAndRender();
}

function removeFromCart(id) {
  state.items = state.items.filter((item) => item.id !== id);
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
    <aside class="cart-drawer" id="cart-drawer" aria-label="Sertar cu co\u0219ul de cump\u0103r\u0103turi" aria-modal="true">
      <div class="cart-drawer__overlay" data-cart-close></div>
      <div class="cart-drawer__panel">
        <header class="cart-drawer__header">
          <h2>Co\u0219ul dvs.</h2>
          <button class="icon-button" type="button" aria-label="Inchide co\u0219" data-cart-close>${icons.close}</button>
        </header>
        <div class="cart-list" id="cart-drawer-items"></div>
        <footer class="cart-drawer__footer">
          <div class="summary-row"><span>Subtotal</span><strong data-cart-subtotal>0.00 lei</strong></div>
          <div class="summary-row"><span>Livrare estimat\u0103</span><strong data-cart-shipping>0.00 lei</strong></div>
          <div class="summary-row summary-row--total"><span>Total</span><strong data-cart-total>0.00 lei</strong></div>
          <button class="button button--primary button--full" type="button" data-checkout>Checkout</button>
          <a class="button button--ghost button--full" href="cart.html">Vezi Co\u0219ul</a>
        </footer>
      </div>
    </aside>`);
}

async function updateCartViews() {
  const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });

  const productPairs = await Promise.all(state.items.map(async (item) => ({
    item,
    product: await getProduct(item.id)
  })));
  const subtotal = productPairs.reduce((sum, pair) => sum + pair.product.price * pair.item.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_AMOUNT;

  document.querySelectorAll("[data-cart-subtotal]").forEach((node) => node.textContent = formatMoney(subtotal));
  document.querySelectorAll("[data-cart-shipping]").forEach((node) => node.textContent = formatMoney(shipping));
  document.querySelectorAll("[data-cart-total]").forEach((node) => node.textContent = formatMoney(subtotal + shipping));

  const markup = productPairs.length ? productPairs.map(renderCartItem).join("") : emptyCartMarkup();
  document.getElementById("cart-drawer-items").innerHTML = markup;
  const pageItems = document.getElementById("cart-page-items");
  if (pageItems) pageItems.innerHTML = markup;
}

function renderCartItem({ item, product }) {
  return `
    <article class="cart-item">
      <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
      <div class="cart-item__body">
        <div class="cart-item__title"><span>${product.title}</span><strong>${formatMoney(product.price * item.quantity)}</strong></div>
        <p class="cart-item__meta">${formatMoney(product.price)} fiecare</p>
        <div class="cart-item__controls">
          <span class="mini-qty" aria-label="Cantitate pentru ${product.title}">
            <button type="button" data-cart-qty="${item.id}" data-delta="-1" aria-label="Micșoreaza cantitatea">-</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-qty="${item.id}" data-delta="1" aria-label="Crește cantitatea">+</button>
          </span>
          <button class="remove-button" type="button" data-cart-remove="${item.id}">Șterge</button>
        </div>
      </div>
    </article>`;
}

function emptyCartMarkup() {
  return `
    <div class="empty-cart">
      <img src="assets/images/empty-cart.png" alt="" loading="lazy">
      <h3>Co\u0219ul dvs. este gol.</h3>
      <p class="form-note">Adaug\u0103 o colier\u0103 sau o br\u0103\u021b\u0103r\u0103 pentru a \u00eencepe.</p>
      <a class="button button--primary" href="collection.html">Cump\u0103r\u0103 Colec\u021bia</a>
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
