const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const FREE_SHIPPING_THRESHOLD_CENTS = 20000; // 200.00 RON
const STANDARD_SHIPPING_CENTS = 1500; // 15.00 RON

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  try {
    assertEnv(env, ["STRIPE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SITE_URL"]);
    const { items = [] } = await request.json();
    if (!Array.isArray(items) || !items.length) return json({ error: "Cart is empty." }, 400);

    const cleanItems = items.map((item) => ({
      id: String(item.id || ""),
      quantity: Math.max(1, Math.min(9, Number(item.quantity || 1)))
    })).filter((item) => item.id);

    const products = await fetchProducts(env, cleanItems.map((item) => item.id));
    const lineItems = cleanItems.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product || product.inventory < item.quantity) throw new Error(`Unavailable item: ${item.id}`);
      const image = firstImage(product);
      return {
        quantity: item.quantity,
        price_data: {
          currency: "ron",
          unit_amount: product.price_cents,
          product_data: {
            name: product.title,
            description: product.description || undefined,
            images: image ? [new URL(image, env.SITE_URL).href] : undefined
          }
        }
      };
    });

    const subtotalCents = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );
    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;

    const session = await createStripeSession(env, lineItems, cleanItems, shippingCents);
    return json({ url: session.url });
  } catch (error) {
    console.error(error);
    return json({ error: error.message || "Unable to create checkout session." }, 400);
  }
}

function assertEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

async function fetchProducts(env, ids) {
  const quoted = ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(",");
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/products?id=in.(${quoted})&select=*`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!response.ok) throw new Error("Could not validate products.");
  return response.json();
}

async function createStripeSession(env, lineItems, cartItems, shippingCents) {
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${env.SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${env.SITE_URL}/cart.html`);
  //form.set("automatic_tax[enabled]", "true");
  form.set("shipping_address_collection[allowed_countries][0]", "RO");
  form.set("metadata[cart]", JSON.stringify(cartItems));

  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shippingCents));
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "ron");
  form.set(
    "shipping_options[0][shipping_rate_data][display_name]",
    shippingCents === 0 ? "Livrare gratuită" : "Livrare standard"
  );

  lineItems.forEach((item, index) => {
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
    form.set(`line_items[${index}][price_data][currency]`, item.price_data.currency);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(item.price_data.unit_amount));
    form.set(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
    if (item.price_data.product_data.description) {
      form.set(`line_items[${index}][price_data][product_data][description]`, item.price_data.product_data.description);
    }
    item.price_data.product_data.images?.forEach((image, imageIndex) => {
      form.set(`line_items[${index}][price_data][product_data][images][${imageIndex}]`, image);
    });
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe session failed.");
  return data;
}

function firstImage(product) {
  if (Array.isArray(product.images)) return product.images[0];
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);
      return parsed[0];
    } catch {
      return product.images;
    }
  }
  return product.image_url;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}