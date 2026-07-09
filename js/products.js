import { getSupabase, hasSupabaseConfig } from "./supabase.js";

export const SAMPLE_PRODUCTS = [
  {
    id: "luna-pendant",
    title: "Luna Pendant",
    category: "necklaces",
    price: 12800,
    badge: "Best Seller",
    featured: true,
    newest: true,
    availability: "in_stock",
    inventory: 24,
    images: ["assets/images/luna-pendant.png", "assets/images/category-necklaces.png"],
    description: "A softly rounded pendant suspended from a fine adjustable chain, designed for subtle daily light.",
    materials: "18k gold vermeil over recycled sterling silver",
    dimensions: "16-18 in adjustable chain, 10 mm pendant"
  },
  {
    id: "sol-chain",
    title: "Sol Chain",
    category: "necklaces",
    price: 15600,
    badge: "New",
    featured: true,
    newest: true,
    availability: "in_stock",
    inventory: 18,
    images: ["assets/images/sol-chain.png", "assets/images/category-necklaces.png"],
    description: "A fluid box chain with mirror-bright links that layers beautifully without tangling.",
    materials: "Gold vermeil, polished finish",
    dimensions: "18 in chain, 2.4 mm link"
  },
  {
    id: "celeste-layer",
    title: "Celeste Layer",
    category: "necklaces",
    price: 18400,
    badge: "Featured",
    featured: true,
    newest: false,
    availability: "in_stock",
    inventory: 11,
    images: ["assets/images/celeste-layer.png", "assets/images/category-necklaces.png"],
    description: "Two fine chains joined at the clasp for an effortless layered look.",
    materials: "Recycled sterling silver with gold vermeil",
    dimensions: "15-17 in and 18-20 in adjustable layers"
  },
  {
    id: "mira-pearl",
    title: "Mira Pearl",
    category: "necklaces",
    price: 14200,
    badge: "",
    featured: true,
    newest: false,
    availability: "in_stock",
    inventory: 14,
    images: ["assets/images/mira-pearl.png", "assets/images/category-necklaces.png"],
    description: "A single freshwater pearl on a delicate chain, chosen for soft luster and organic shape.",
    materials: "Freshwater pearl, gold vermeil",
    dimensions: "17 in chain, 7-8 mm pearl"
  },
  {
    id: "noor-choker",
    title: "Noor Choker",
    category: "necklaces",
    price: 11800,
    badge: "New",
    featured: false,
    newest: true,
    availability: "in_stock",
    inventory: 16,
    images: ["assets/images/noor-choker.png", "assets/images/category-necklaces.png"],
    description: "A fine choker with a low-profile clasp and tiny reflective stations.",
    materials: "Gold vermeil over sterling silver",
    dimensions: "14-16 in adjustable length"
  },
  {
    id: "isla-drop",
    title: "Isla Drop",
    category: "necklaces",
    price: 16600,
    badge: "",
    featured: false,
    newest: false,
    availability: "low_stock",
    inventory: 5,
    images: ["assets/images/isla-drop.png", "assets/images/category-necklaces.png"],
    description: "A slender drop pendant inspired by clean lines and quiet movement.",
    materials: "Gold vermeil, white topaz accent",
    dimensions: "18 in chain, 18 mm drop"
  },
  {
    id: "ora-cuff",
    title: "Ora Cuff",
    category: "bracelets",
    price: 14800,
    badge: "Best Seller",
    featured: true,
    newest: false,
    availability: "in_stock",
    inventory: 21,
    images: ["assets/images/ora-cuff.png", "assets/images/category-bracelets.png"],
    description: "A sculptural open cuff with a soft oval profile and comfortable rounded ends.",
    materials: "Gold vermeil over recycled sterling silver",
    dimensions: "Adjustable, 6.2 in inner circumference"
  },
  {
    id: "venice-chain",
    title: "Venice Chain Bracelet",
    category: "bracelets",
    price: 13200,
    badge: "Featured",
    featured: true,
    newest: false,
    availability: "in_stock",
    inventory: 20,
    images: ["assets/images/venice-chain.png", "assets/images/category-bracelets.png"],
    description: "A graceful chain bracelet with subtle weight and an easy lobster clasp.",
    materials: "Gold vermeil, polished finish",
    dimensions: "6.5-7.5 in adjustable length"
  },
  {
    id: "dune-bangle",
    title: "Dune Bangle",
    category: "bracelets",
    price: 16800,
    badge: "",
    featured: false,
    newest: true,
    availability: "in_stock",
    inventory: 13,
    images: ["assets/images/dune-bangle.png", "assets/images/category-bracelets.png"],
    description: "A gently waved bangle that catches light without overwhelming the wrist.",
    materials: "Recycled sterling silver with gold vermeil",
    dimensions: "2.4 in inner diameter"
  },
  {
    id: "aura-tennis",
    title: "Aura Tennis Bracelet",
    category: "bracelets",
    price: 21400,
    badge: "New",
    featured: true,
    newest: true,
    availability: "low_stock",
    inventory: 4,
    images: ["assets/images/aura-tennis.png", "assets/images/category-bracelets.png"],
    description: "A refined line bracelet with white topaz stones and a secure box clasp.",
    materials: "Sterling silver, white topaz, gold vermeil",
    dimensions: "7 in length, 2 mm stones"
  },
  {
    id: "lyra-link",
    title: "Lyra Link Bracelet",
    category: "bracelets",
    price: 13800,
    badge: "",
    featured: false,
    newest: false,
    availability: "in_stock",
    inventory: 19,
    images: ["assets/images/lyra-link.png", "assets/images/category-bracelets.png"],
    description: "A modern paperclip link bracelet with a balanced, polished finish.",
    materials: "Gold vermeil over sterling silver",
    dimensions: "7.25 in length"
  },
  {
    id: "sera-wrap",
    title: "Sera Wrap Bracelet",
    category: "bracelets",
    price: 12400,
    badge: "",
    featured: false,
    newest: false,
    availability: "out_of_stock",
    inventory: 0,
    images: ["assets/images/sera-wrap.png", "assets/images/category-bracelets.png"],
    description: "A delicate wrap bracelet with a gliding extender chain and soft shine.",
    materials: "Gold vermeil, recycled sterling silver",
    dimensions: "Double wrap, adjustable"
  }
];

export function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
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
