import { initLayout, productCard, showSkeletons, toast } from "./ui.js";
import { initCart } from "./cart.js";
import { initCheckout } from "./checkout.js";
import { initAuth } from "./auth.js";
import { initAnimations } from "./animations.js";
import { initFilters } from "./filters.js";
import { formatMoney, getFeaturedProducts, getProduct, getRelatedProducts, loadProducts, loadVariants } from "./products.js";
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
  const variants = await loadVariants(product.id);
  renderProductDetail(product, variants);
  renderProductSchema(product);
  const related = await getRelatedProducts(product);
  document.getElementById("related-products").innerHTML = related.map(productCard).join("");
}

function renderProductDetail(product, variants = []) {
  const detail = document.getElementById("product-detail");
  const imageButtons = product.images.map((image, index) => `
    <button type="button" class="${index === 0 ? "is-active" : ""}" data-gallery-image="${image}" aria-label="Arată imagine ${index + 1}">
      <img src="${image}" alt="${product.title} vizualizare ${index + 1}" loading="lazy">
    </button>`).join("");

  const inStockVariants = variants.filter((variant) => variant.inventory > 0);
  const defaultVariant = inStockVariants[0] || variants[0] || null;
  const hasVariants = variants.length > 0;

  const colorPicker = hasVariants ? `
    <div class="color-picker" data-color-picker>
      <p><strong>Culoare:</strong> <span data-selected-color>${defaultVariant?.color_name || ""}</span></p>
      <div class="color-swatches">
        ${variants.map((variant) => `
          <button type="button"
            class="swatch ${variant.id === defaultVariant?.id ? "is-active" : ""} ${variant.inventory <= 0 ? "swatch--disabled" : ""}"
            data-variant-id="${variant.id}"
            data-color-name="${variant.color_name}"
            data-inventory="${variant.inventory}"
            style="background:${variant.color_hex || "#ccc"}"
            ${variant.inventory <= 0 ? "disabled" : ""}
            aria-label="${variant.color_name}${variant.inventory <= 0 ? " (stoc epuizat)" : ""}"
            aria-pressed="${variant.id === defaultVariant?.id}"></button>
        `).join("")}
      </div>
    </div>` : "";

  const noStock = hasVariants ? !defaultVariant || defaultVariant.inventory <= 0 : product.availability === "out_of_stock";

  detail.innerHTML = `
    <div class="product-gallery">
      <div class="product-gallery__main"><img id="main-product-image" src="${product.images[0]}" alt="${product.title}"></div>
      <div class="product-thumbs">${imageButtons}</div>
    </div>
    <div class="product-info">
      <p class="eyebrow">${product.category === "necklaces" ? "Colier" : "Brățară"}</p>
      <h1>${product.title}</h1>
      <p class="product-info__price">${formatMoney(product.price)}</p>
      <p class="product-info__desc">${product.description}</p>
      <div class="product-facts">
        <p><strong>Materiale:</strong> ${product.materials}</p>
        <p><strong>Dimensiuni:</strong> ${product.dimensions}</p>
        <p><strong>Disponibilitate:</strong> <span data-availability-label>${hasVariants ? (noStock ? "Epuizat" : "In stoc") : availabilityLabel(product.availability)}</span></p>
      </div>
      ${colorPicker}
      <label>Cantitate
        <span class="quantity">
          <button type="button" data-qty-step="-1" aria-label="Micșoreaza cantitatea">-</button>
          <input id="product-quantity" type="number" min="1" max="9" value="1">
          <button type="button" data-qty-step="1" aria-label="Crește cantitatea">+</button>
        </span>
      </label>
      <div class="product-actions">
        <button class="button button--primary" type="button"
          data-add-to-cart="${product.id}"
          data-variant-id="${defaultVariant?.id || ""}"
          data-product-action
          ${noStock ? "disabled" : ""}>Adaugă la Coș</button>
        <button class="button button--ghost" type="button"
          data-buy-now="${product.id}"
          data-variant-id="${defaultVariant?.id || ""}"
          data-product-action
          ${noStock ? "disabled" : ""}>Cumpără Acum</button>
      </div>
      <div class="accordion">
        <details open><summary>Livrare</summary><p>Comenzile se expediază în 1-2 zile lucrătoare cu urmărire. Livrarea expresă poate fi configurată în Stripe Checkout.</p></details>
        <details><summary>Retururi</summary><p>Piesele nedrăgate pot fi returnate în 30 de zile în ambalajul original. Articolele cu vânzare finală sunt notate înainte de checkout.</p></details>
        <details><summary>Instrucțiuni de îngrijire</summary><p>Păstrează separat, evită parfumul și apa, și polezăușor cu o cărpă moale și uscată.</p></details>
      </div>
    </div>`;

  detail.addEventListener("click", (event) => {
    const galleryButton = event.target.closest("[data-gallery-image]");
    const qtyButton = event.target.closest("[data-qty-step]");
    const productAction = event.target.closest("[data-product-action]");
    const swatchButton = event.target.closest("[data-variant-id][data-color-name]");

    if (galleryButton) {
      document.getElementById("main-product-image").src = galleryButton.dataset.galleryImage;
      detail.querySelectorAll("[data-gallery-image]").forEach((button) => button.classList.remove("is-active"));
      galleryButton.classList.add("is-active");
    }
    if (qtyButton) {
      const input = document.getElementById("product-quantity");
      input.value = Math.max(1, Math.min(9, Number(input.value) + Number(qtyButton.dataset.qtyStep)));
    }
    if (swatchButton && !swatchButton.disabled) {
      detail.querySelectorAll("[data-variant-id][data-color-name]").forEach((button) => {
        button.classList.remove("is-active");
        button.setAttribute("aria-pressed", "false");
      });
      swatchButton.classList.add("is-active");
      swatchButton.setAttribute("aria-pressed", "true");
      detail.querySelector("[data-selected-color]").textContent = swatchButton.dataset.colorName;

      const selectedInStock = Number(swatchButton.dataset.inventory) > 0;
      detail.querySelectorAll("[data-add-to-cart], [data-buy-now]").forEach((button) => {
        button.dataset.variantId = swatchButton.dataset.variantId;
        button.disabled = !selectedInStock;
      });
      detail.querySelector("[data-availability-label]").textContent = selectedInStock ? "In stoc" : "Epuizat";
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
    document.getElementById("contact-note").textContent = "Mulțumesc. Acest formular demo este gata să se conecteze la o Funcție Cloudflare.";
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