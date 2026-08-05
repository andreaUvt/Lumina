import { getSupabase, hasSupabaseConfig } from "./supabase.js";

export function formatMoney(cents) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON"
  }).format(cents / 100);
}

function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product.price || product.price_cents || 0),
    images: Array.isArray(product.images) ? product.images : [product.image_url].filter(Boolean),
    availability: product.availability || (product.inventory > 0 ? "in_stock" : "out_of_stock")
  };
}

export async function loadProducts() {
  if (!hasSupabaseConfig()) return SAMPLE_PRODUCTS;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Supabase product load failed; using local sample data.", error);
    return SAMPLE_PRODUCTS;
  }
  return data.map(normalizeProduct);
}

export async function getProduct(id) {
  const products = await loadProducts();
  return products.find((product) => product.id === id) || products[0];
}

export async function getRelatedProducts(product, limit = 4) {
  const products = await loadProducts();
  return products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, limit);
}

export function getFeaturedProducts(products, limit = 4) {
  return products.filter((product) => product.featured).slice(0, limit);
}

// Color variants — each row is one color option for a product, with its own stock.
export async function loadVariants(productId) {
  if (!hasSupabaseConfig()) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("color_name", { ascending: true });
  if (error) {
    console.warn("Supabase variant load failed.", error);
    return [];
  }
  return data;
}

export async function getVariant(productId, variantId) {
  if (!variantId) return null;
  const variants = await loadVariants(productId);
  return variants.find((variant) => variant.id === variantId) || null;
}