# Aurelia Atelier Jewelry Store

A production-oriented vanilla HTML, CSS, and JavaScript e-commerce storefront for a premium jewelry brand selling necklaces and bracelets.

## Stack

- HTML5, CSS3, vanilla JavaScript ES modules
- Supabase for products, auth, storage-ready image URLs, wishlist, newsletter, profiles, and orders
- Stripe Checkout for payments
- Cloudflare Pages for hosting
- Cloudflare Pages Functions for secure Stripe and webhook operations

No frontend frameworks, build tools, jQuery, Bootstrap, Tailwind, or card collection on the website.

## Local Development

Serve the files from the project root:

```bash
python -m http.server 8788
```

Open `http://localhost:8788`.

The storefront works immediately with local sample products. Supabase and Stripe become active after the environment variables and schema are configured.

## File Map

- `index.html` - homepage
- `collection.html`, `necklaces.html`, `bracelets.html` - product listing pages
- `product.html` - product detail page using `?id=luna-pendant`
- `cart.html` - dedicated cart page
- `about.html`, `contact.html`, `success.html` - content and post-checkout pages
- `css/` - modular styling by concern
- `js/` - modular ES modules for products, cart, filters, UI, auth, checkout, and animations
- `functions/` - Cloudflare Pages Functions for Stripe
- `supabase/` - schema and sample seed data
- `assets/images/` - local bitmap jewelry assets

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Run `supabase/sample-data.sql`.
4. Create a public storage bucket if you want to replace the local demo images with uploaded product photography.
5. Add your frontend config before `js/app.js`, or edit `js/supabase.js`:

```html
<script>
  window.AURELIA_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
  };
</script>
```

The anon key is safe for the browser when RLS policies are enabled. Do not expose the service role key.

## Stripe and Cloudflare Setup

Set these Cloudflare Pages environment variables:

```text
SITE_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_... 
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Cloudflare Pages Functions expose:

- `POST /create-checkout`
- `POST /stripe-webhook`

In Stripe, create a webhook endpoint pointing to:

```text
https://your-domain.com/stripe-webhook
```

Subscribe to:

```text
checkout.session.completed
```

## Payments Flow

1. The cart is stored in `localStorage` for guests.
2. Logged-in carts are synced to the Supabase `profiles.cart` JSON field.
3. Checkout sends product IDs and quantities to `/create-checkout`.
4. The Cloudflare Function revalidates products and prices from Supabase using the service role key.
5. Stripe Checkout collects payment securely.
6. Stripe redirects to `success.html`.
7. Stripe calls `/stripe-webhook`.
8. The webhook verifies the signature, stores the order, stores purchased items, reduces inventory, and ignores duplicate events.

## SEO and Accessibility

- Page-level meta descriptions, Open Graph, and Twitter cards
- Product JSON-LD injected on product pages
- `robots.txt` and `sitemap.xml`
- Semantic headings, keyboard-friendly controls, visible focus states, and ARIA labels

Update `sitemap.xml` and `robots.txt` with your production domain before launch.

## Image Notes

The included PNG assets are generated local demo visuals. For production, replace them with optimized product and lifestyle photography in `assets/images/` or Supabase Storage, keeping the same image paths or updating product records.
