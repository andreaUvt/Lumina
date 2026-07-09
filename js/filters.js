import { productCard, showSkeletons } from "./ui.js";

const PAGE_SIZE = 8;
let visibleCount = PAGE_SIZE;
let currentProducts = [];

export function initFilters(products, category = "all") {
  currentProducts = products.filter((product) => category === "all" || product.category === category);
  visibleCount = PAGE_SIZE;
  renderFilterPanel(category);
  bindFilterEvents();
  renderFilteredProducts();
}

function renderFilterPanel(category) {
  const panel = document.getElementById("filters-panel");
  if (!panel) return;
  panel.innerHTML = `
    <button class="icon-button filters__close" type="button" aria-label="Inchide filtre" data-close-filters>×</button>
    <div class="filter-group">
      <h3>Categorie</h3>
      <label class="check-row"><input type="checkbox" name="category" value="necklaces" ${category === "necklaces" ? "checked" : ""}> Coliere</label>
      <label class="check-row"><input type="checkbox" name="category" value="bracelets" ${category === "bracelets" ? "checked" : ""}> Br\u0103\u021b\u0103ri</label>
    </div>
    <div class="filter-group">
      <h3>Interval de pret</h3>
      <div class="range-row">
        <label>Min<input type="number" name="min" min="0" placeholder="$0"></label>
        <label>Max<input type="number" name="max" min="0" placeholder="$250"></label>
      </div>
    </div>
    <div class="filter-group">
      <h3>Disponibilitate</h3>
      <label class="check-row"><input type="checkbox" name="availability" value="in_stock"> In stoc</label>
      <label class="check-row"><input type="checkbox" name="availability" value="low_stock"> Stoc mic</label>
    </div>
    <div class="filter-group">
      <h3>Evidenti\u0103ri</h3>
      <label class="check-row"><input type="checkbox" name="featured" value="featured"> Recomandate</label>
      <label class="check-row"><input type="checkbox" name="newest" value="newest"> Cel mai nou</label>
    </div>
    <button class="button button--ghost button--full" type="button" data-clear-filters>Golire Filtre</button>`;
}

function bindFilterEvents() {
  document.getElementById("filters-panel")?.addEventListener("input", () => {
    visibleCount = PAGE_SIZE;
    renderFilteredProducts();
  });
  document.getElementById("sort-select")?.addEventListener("change", renderFilteredProducts);
  document.getElementById("load-more")?.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderFilteredProducts();
  });
  document.querySelector("[data-open-filters]")?.addEventListener("click", () => {
    document.getElementById("filters-panel").classList.add("is-open");
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-filters]")) document.getElementById("filters-panel")?.classList.remove("is-open");
    if (event.target.closest("[data-clear-filters]")) {
      document.querySelectorAll("#filters-panel input").forEach((input) => {
        if (input.type === "checkbox") input.checked = false;
        if (input.type === "number") input.value = "";
      });
      renderFilteredProducts();
    }
  });
}

function renderFilteredProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  showSkeletons(grid, 4);
  window.setTimeout(() => {
    const filtered = sortProducts(applyFilters(currentProducts));
    const visible = filtered.slice(0, visibleCount);
    grid.innerHTML = visible.map(productCard).join("");
    document.getElementById("product-count").textContent = `${filtered.length} ${filtered.length === 1 ? "pies\u0103" : "piese"}`;
    document.getElementById("load-more").hidden = visible.length >= filtered.length;
  }, 140);
}

function applyFilters(products) {
  const form = document.getElementById("filters-panel");
  const categories = checkedValues(form, "category");
  const availability = checkedValues(form, "availability");
  const min = Number(form.querySelector('[name="min"]')?.value || 0) * 100;
  const maxRaw = Number(form.querySelector('[name="max"]')?.value || 0) * 100;
  const featured = form.querySelector('[name="featured"]')?.checked;
  const newest = form.querySelector('[name="newest"]')?.checked;

  return products.filter((product) => {
    if (categories.length && !categories.includes(product.category)) return false;
    if (availability.length && !availability.includes(product.availability)) return false;
    if (min && product.price < min) return false;
    if (maxRaw && product.price > maxRaw) return false;
    if (featured && !product.featured) return false;
    if (newest && !product.newest) return false;
    return true;
  });
}

function sortProducts(products) {
  const sort = document.getElementById("sort-select")?.value || "newest";
  return [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "featured") return Number(b.featured) - Number(a.featured);
    return Number(b.newest) - Number(a.newest);
  });
}

function checkedValues(form, name) {
  return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((input) => input.value);
}
