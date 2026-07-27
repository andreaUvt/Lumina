import { onRequestOptions as createCheckoutOptions, onRequestPost as createCheckoutPost } from "./functions/create-checkout.js";
import { onRequestPost as stripeWebhookPost } from "./functions/stripe-webhook.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/create-checkout") {
      if (request.method === "OPTIONS") {
        return createCheckoutOptions();
      }

      if (request.method === "POST") {
        return createCheckoutPost({ request, env });
      }
    }

    if (url.pathname === "/stripe-webhook" && request.method === "POST") {
      return stripeWebhookPost({ request, env });
    }

    if (env.ASSETS?.fetch) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse && assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain;charset=UTF-8" } });
  }
};
