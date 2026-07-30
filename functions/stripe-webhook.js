export async function onRequestPost({ request, env }) {
  try {
    assertEnv(env, ["STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const signature = request.headers.get("stripe-signature") || "";
    const payload = await request.text();
    const verified = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!verified) return new Response("Invalid signature", { status: 400 });

    const event = JSON.parse(payload);
  //  const accepted = await recordWebhookEvent(env, event);
  // if (!accepted) return new Response("Duplicate event", { status: 200 });

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(env, event.data.object);
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Webhook error", { status: 400 });
  }
}

function assertEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
  if (!parts.t || !parts.v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (age > 300) return false;
  const signedPayload = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  return timingSafeEqual(hex(signature), parts.v1);
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function recordWebhookEvent(env, event) {
  const response = await supabaseFetch(env, "/rest/v1/webhook_events", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify({ event_id: event.id, type: event.type, payload: event })
  });
  return response.status === 201;
}

// async function handleCheckoutCompleted(env, session) {
//   const cart = JSON.parse(session.metadata?.cart || "[]");
//   const orderResponse = await supabaseFetch(env, "/rest/v1/orders", {
//     method: "POST",
//     headers: { Prefer: "return=representation" },
//     body: JSON.stringify({
//       stripe_session_id: session.id,
//       status: "paid",
//       email: session.customer_details?.email,
//       total_cents: session.amount_total,
//       currency: session.currency
//     })
//   });
  
//   if (!orderResponse.ok) throw new Error("Could not store order.");
//   const [order] = await orderResponse.json();

//   const items = cart.map((item) => ({
//     order_id: order.id,
//     product_id: item.id,
//     quantity: item.quantity
//   }));
//   if (items.length) {
//     const itemResponse = await supabaseFetch(env, "/rest/v1/order_items", {
//       method: "POST",
//       body: JSON.stringify(items)
//     });
//     if (!itemResponse.ok) throw new Error("Could not store order items.");
//   }

//   await Promise.all(cart.map((item) => supabaseFetch(env, "/rest/v1/rpc/decrement_inventory", {
//     method: "POST",
//     body: JSON.stringify({ product_id_input: item.id, quantity_input: item.quantity })
//   })));
// }
async function handleCheckoutCompleted(env, session) {
  console.log("=== handleCheckoutCompleted started ===");
  console.log("Session ID:", session.id);
  console.log("Metadata:", JSON.stringify(session.metadata));

  const cart = JSON.parse(session.metadata?.cart || "[]");
  console.log("Cart:", JSON.stringify(cart));

  // Create order
  const orderResponse = await supabaseFetch(env, "/rest/v1/orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      stripe_session_id: session.id,
      status: "paid",
      email: session.customer_details?.email || null,
      total_cents: session.amount_total || 0,
      currency: session.currency || "usd"
    })
  });

  const orderText = await orderResponse.text();
  console.log("Order response status:", orderResponse.status);
  console.log("Order response body:", orderText);

  if (!orderResponse.ok) {
    throw new Error(`Order insert failed: ${orderText}`);
  }

  const [order] = JSON.parse(orderText);

  if (!order) {
    throw new Error("No order returned from Supabase");
  }

  console.log("Order created:", order.id);

  // Create order items
  const items = cart.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    quantity: item.quantity
  }));

  console.log("Order items:", JSON.stringify(items));

  if (items.length) {
    const itemResponse = await supabaseFetch(env, "/rest/v1/order_items", {
      method: "POST",
      body: JSON.stringify(items)
    });

    const itemText = await itemResponse.text();
    console.log("Order items response:", itemResponse.status, itemText);

    if (!itemResponse.ok) {
      throw new Error(`Order items insert failed: ${itemText}`);
    }
  }

  // Decrement inventory
  for (const item of cart) {
    const rpcResponse = await supabaseFetch(env, "/rest/v1/rpc/decrement_inventory", {
      method: "POST",
      body: JSON.stringify({
        product_id_input: item.id,
        quantity_input: item.quantity
      })
    });

    const rpcText = await rpcResponse.text();
    console.log(`Inventory RPC for ${item.id}:`, rpcResponse.status, rpcText);

    if (!rpcResponse.ok) {
      throw new Error(`Inventory decrement failed for ${item.id}: ${rpcText}`);
    }
  }

  console.log("=== handleCheckoutCompleted completed successfully ===");
}
function supabaseFetch(env, path, options = {}) {
  return fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}
