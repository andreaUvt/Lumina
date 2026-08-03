import { formatMoney, loadProducts } from "./products.js";

export const icons = {
  search: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>',
  cart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h15l-2 10H7L5 3H2"></path><circle cx="9" cy="21" r="1"></circle><circle cx="18" cy="21" r="1"></circle></svg>',
  account: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>',
  heart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z"></path></svg>'
};

export function initLayout() {
  renderHeader();
  renderFooter();
  renderSearchPanel();
  renderAuthPanel();
}

function renderHeader() {
  const current = document.body.dataset.category || document.body.dataset.page;
  document.getElementById("site-header").innerHTML = `
    <header class="site-header">
      <nav class="nav" aria-label="Navigare principal\u0103">
        <button class="icon-button menu-toggle" type="button" aria-label="Deschide meniu" data-menu-toggle>${icons.menu}</button>
        <a class="logo" href="index.html" aria-label="Lumina Cu Tine acas\u0103"><img src="assets/images/logo.png" alt="Lumina Cu Tine" height="40"></a>
        <div class="nav__links" id="nav-links">
          <a href="index.html" ${current === "home" ? 'aria-current="page"' : ""}>Acas\u0103</a>
          <a href="necklaces.html" ${current === "necklaces" ? 'aria-current="page"' : ""}>Coliere</a>
          <a href="bracelets.html" ${current === "bracelets" ? 'aria-current="page"' : ""}>Br\u0103\u021b\u0103ri</a>
          <a href="about.html" ${document.body.dataset.page === "content" && location.pathname.includes("about") ? 'aria-current="page"' : ""}>Despre</a>
        </div>
        <div class="nav__actions">
          <button class="icon-button" type="button" aria-label="C\u0103uta produse" data-search-toggle>${icons.search}</button>
          <button class="icon-button" type="button" aria-label="Deschide co\u0219ul" data-cart-open>${icons.cart}<span class="cart-count" data-cart-count>0</span></button>
          <button class="icon-button" type="button" aria-label="Cont" data-auth-toggle>${icons.account}</button>
        </div>
      </nav>
    </header>`;

  document.querySelector("[data-menu-toggle]").addEventListener("click", () => {
    document.getElementById("nav-links").classList.toggle("is-open");
  });
}

function renderFooter() {
  document.getElementById("site-footer").innerHTML = `
    <footer class="site-footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <strong>Lumina Cu Tine</strong>
          <p>Coliere \u0219i br\u0103\u021b\u0103ri realizate manual cu luciu discret, materiale premium \u0219i ușurință zilnic\u0103.</p>
        </div>
        <div class="footer__group">
          <strong>Colec\u021bii</strong>
          <a href="necklaces.html">Coliere</a>
          <a href="bracelets.html">Br\u0103\u021b\u0103ri</a>
          <a href="collection.html">Toat\u0103 Bijuteria</a>
        </div>
        <div class="footer__group">
          <strong>Companie</strong>
          <a href="about.html">Despre</a>
          <a href="contact.html">Contact</a>
          <a href="https://instagram.com" rel="noopener">Instagram</a>
        </div>
        <div class="footer__group">
          <strong>Politic\u0103</strong>
          <a href="#">Politic\u0103 de Confiden\u021bialitate</a>
          <a href="#">Termeni</a>
          <a href="#">Livrare</a>
        </div>
      </div>
      <p class="footer__bottom">&copy; ${new Date().getFullYear()} Lumina Cu Tine. Vitrin\u0103 demo gat\u0103 pentru configura\u021bie Supabase \u0219i Stripe.</p>
    </footer>`;
}

function renderSearchPanel() {
  document.body.insertAdjacentHTML("beforeend", `
    <section class="search-panel" id="search-panel" aria-label="Panou de c\u0103utare">
      <form role="search">
        <label class="sr-only" for="site-search">C\u0103uta bijuterie</label>
        <input id="site-search" type="search" placeholder="C\u0103uta coliere \u0219i br\u0103\u021b\u0103ri" autocomplete="off">
      </form>
      <div class="search-results" id="search-results"></div>
    </section>`);

  const panel = document.getElementById("search-panel");
  const input = document.getElementById("site-search");
  const results = document.getElementById("search-results");

  document.querySelector("[data-search-toggle]").addEventListener("click", () => {
    panel.classList.toggle("is-open");
    if (panel.classList.contains("is-open")) input.focus();
  });

  input.addEventListener("input", async () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      results.innerHTML = "";
      return;
    }
    const matches = (await loadProducts()).filter((product) =>
      `${product.title} ${product.category} ${product.materials}`.toLowerCase().includes(query)
    ).slice(0, 6);
    results.innerHTML = matches.map((product) => `
      <a class="search-result" href="product.html?id=${product.id}">
        <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
        <span>${product.title}</span>
        <strong>${formatMoney(product.price)}</strong>
      </a>`).join("");
  });
}

function renderAuthPanel() {
  document.body.insertAdjacentHTML("beforeend", `
    <section class="auth-panel" id="auth-panel" aria-label="Conectare cont">
      <form id="auth-form">
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <button class="button button--primary" type="submit">Trimite Legatur\u0103 Magic</button>
        <p class="form-note" id="auth-note">Configura\u021bi Supabase pentru a ac\u021biva conectarea f\u0103r\u0103 parol\u0103 \u0219i sincronizarea co\u0219ului.</p>
      </form>
    </section>`);

  document.querySelector("[data-auth-toggle]").addEventListener("click", () => {
    document.getElementById("auth-panel").classList.toggle("is-open");
  });
}

export function productCard(product) {
  const disabled = product.availability === "out_of_stock";
  return `
    <article class="product-card">
      <button class="wishlist" type="button" aria-label="Adaug\u0103 ${product.title} la list\u0103 de dorințe" data-wishlist="${product.id}">${icons.heart}</button>
      <a class="product-card__media" href="product.html?id=${product.id}">
        ${product.badge ? `<span class="product-card__badge">${product.badge}</span>` : ""}
        <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
      </a>
      <div class="product-card__body">
        <h3><a href="product.html?id=${product.id}">${product.title}</a></h3>
        <div class="product-card__meta">
          <span>${product.category === "necklaces" ? "Colier" : "Br\u0103\u021b\u0103r\u0103"}</span>
          <strong>${formatMoney(product.price)}</strong>
        </div>
        <button class="quick-add" type="button" data-add-to-cart="${product.id}" ${disabled ? "disabled" : ""}>${disabled ? "Stoc epuizat" : "Adaug\u0103 Rapid"}</button>
      </div>
    </article>`;
}

export function showSkeletons(container, count = 4) {
  container.innerHTML = Array.from({ length: count }, () => '<div class="skeleton"></div>').join("");
}

export function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("is-visible");
  window.setTimeout(() => node.classList.remove("is-visible"), 2200);
}
