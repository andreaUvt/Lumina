import { initLayout, productCard, showSkeletons, toast } from "./ui.js";
import { initCart } from "./cart.js";
import { initCheckout } from "./checkout.js";
import { initAuth } from "./auth.js";
import { initAnimations } from "./animations.js";
import { initFilters } from "./filters.js";
import { formatMoney, getFeaturedProducts, getProduct, getRelatedProducts, loadProducts } from "./products.js";
import { insertNewsletterSubscriber } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page === "success") localStorage.removeItem("luminacutine_cart");
  initLayout();
  initCart();
  initCheckout();
  initAuth();
  initSharedForms();
  bindWishlist();

  const page = document.body.dataset.page;
  if (page === "home") await initHomePage();
  if (page === "collection") await initCollectionPage();
  if (page === "product") await initProductPage();

  initAnimations();
});

async function initHomePage() {
  const container = document.getElementById("featured-products");
  showSkeletons(container, 4);
  const products = await loadProducts();
  container.innerHTML = getFeaturedProducts(products).map(productCard).join("");
}

async function initCollectionPage() {
  const products = await loadProducts();
  initFilters(products, document.body.dataset.category || "all");
}

async function initProductPage() {
  const id = new URLSearchParams(window.location.search).get("id") || "luna-pendant";
  const product = await getProduct(id);
  document.title = `${product.title} | Lumina Cu Tine`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", product.description);
  renderProductDetail(product);
  renderProductSchema(product);
  const related = await getRelatedProducts(product);
  document.getElementById("related-products").innerHTML = related.map(productCard).join("");
}

function renderProductDetail(product) {
  const detail = document.getElementById("product-detail");
  const imageButtons = product.images.map((image, index) => `
    <button type="button" class="${index === 0 ? "is-active" : ""}" data-gallery-image="${image}" aria-label="Arat\u0103 imagine ${index + 1}">
      <img src="${image}" alt="${product.title} vizualizare ${index + 1}" loading="lazy">
    </button>`).join("");

  detail.innerHTML = `
    <div class="product-gallery">
      <div class="product-gallery__main"><img id="main-product-image" src="${product.images[0]}" alt="${product.title}"></div>
      <div class="product-thumbs">${imageButtons}</div>
    </div>
    <div class="product-info">
      <p class="eyebrow">${product.category === "necklaces" ? "Colier" : "Br\u0103\u021b\u0103r\u0103"}</p>
      <h1>${product.title}</h1>
      <p class="product-info__price">${formatMoney(product.price)}</p>
      <p class="product-info__desc">${product.description}</p>
      <div class="product-facts">
        <p><strong>Materiale:</strong> ${product.materials}</p>
        <p><strong>Dimensiuni:</strong> ${product.dimensions}</p>
        <p><strong>Disponibilitate:</strong> ${availabilityLabel(product.availability)}</p>
      </div>
      <label>Cantitate
        <span class="quantity">
          <button type="button" data-qty-step="-1" aria-label="Micșoreaza cantitatea">-</button>
          <input id="product-quantity" type="number" min="1" max="9" value="1">
          <button type="button" data-qty-step="1" aria-label="Crește cantitatea">+</button>
        </span>
      </label>
      <div class="product-actions">
        <button class="button button--primary" type="button" data-add-to-cart="${product.id}" data-product-action>Adaug\u0103 la Co\u0219</button>
        <button class="button button--ghost" type="button" data-buy-now="${product.id}" data-product-action>Cump\u0103r\u0103 Acum</button>
      </div>
      <div class="accordion">
        <details open><summary>Livrare</summary><p>Comenzile se expediaz\u0103 \u00een 1-2 zile lucr\u0103toare cu urm\u0103rire. Livrarea expres\u0103 poate fi configurat\u0103 \u00een Stripe Checkout.</p></details>
        <details><summary>Retururi</summary><p>Piesele nedrăgate pot fi returnate \u00een 30 de zile \u00een ambalajul original. Articolele cu vânzare final\u0103 sunt notate \u00eenainte de checkout.</p></details>
        <details><summary>Instruc\u021biuni de \u00cengrijire</summary><p>P\u0103streaz\u0103 separat, evit\u0103 parfumul \u0219i apa, \u0219i polez\u0103 ușor cu o cărpă moale și uscat\u0103.</p></details>
      </div>
    </div>`;

  detail.addEventListener("click", (event) => {
    const galleryButton = event.target.closest("[data-gallery-image]");
    const qtyButton = event.target.closest("[data-qty-step]");
    const productAction = event.target.closest("[data-product-action]");

    if (galleryButton) {
      document.getElementById("main-product-image").src = galleryButton.dataset.galleryImage;
      detail.querySelectorAll("[data-gallery-image]").forEach((button) => button.classList.remove("is-active"));
      galleryButton.classList.add("is-active");
    }
    if (qtyButton) {
      const input = document.getElementById("product-quantity");
      input.value = Math.max(1, Math.min(9, Number(input.value) + Number(qtyButton.dataset.qtyStep)));
    }
    if (productAction) {
      productAction.dataset.quantity = document.getElementById("product-quantity").value;
    }
  });
}

function renderProductSchema(product) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((image) => new URL(image, window.location.href).href),
    description: product.description,
    brand: { "@type": "Brand", name: "Lumina Cu Tine" },
    offers: {
      "@type": "Offer",
      priceCurrency: "RON",
      price: (product.price / 100).toFixed(2),
      availability: product.availability === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  });
  document.head.appendChild(script);
}

function availabilityLabel(value) {
  if (value === "out_of_stock") return "Epuizat";
  if (value === "low_stock") return "Stoc mic";
  return "In stoc";
}

function initSharedForms() {
  document.getElementById("newsletter-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    const note = document.getElementById("newsletter-note");
    try {
      await insertNewsletterSubscriber(email);
      note.textContent = "Ești pe lista.";
      event.currentTarget.reset();
    } catch (error) {
      note.textContent = error.message;
    }
  });

  document.getElementById("contact-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    document.getElementById("contact-note").textContent = "Mulțumesc. Acest formular demo este gata s\u0103 se conecteze la o Funcție Cloudflare.";
    event.currentTarget.reset();
  });
}

function bindWishlist() {
  const key = "luminacutine_wishlist";
  const read = () => JSON.parse(localStorage.getItem(key) || "[]");
  const write = (items) => localStorage.setItem(key, JSON.stringify(items));

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wishlist]");
    if (!button) return;
    const items = read();
    const id = button.dataset.wishlist;
    const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
    write(next);
    button.classList.toggle("is-active", next.includes(id));
    toast(next.includes(id) ? "Adaugat la lista de dorințe." : "Șters din lista de dorințe.");
  });
}
