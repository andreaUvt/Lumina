insert into categories (id, name, slug) values
  ('necklaces', 'Necklaces', 'necklaces'),
  ('bracelets', 'Bracelets', 'bracelets')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into products (id, category, title, description, materials, dimensions, price_cents, images, badge, featured, newest, inventory) values
  ('luna-pendant', 'necklaces', 'Luna Pendant', 'A softly rounded pendant suspended from a fine adjustable chain, designed for subtle daily light.', '18k gold vermeil over recycled sterling silver', '16-18 in adjustable chain, 10 mm pendant', 12800, '["assets/images/luna-pendant.png","assets/images/category-necklaces.png"]', 'Best Seller', true, true, 24),
  ('sol-chain', 'necklaces', 'Sol Chain', 'A fluid box chain with mirror-bright links that layers beautifully without tangling.', 'Gold vermeil, polished finish', '18 in chain, 2.4 mm link', 15600, '["assets/images/sol-chain.png","assets/images/category-necklaces.png"]', 'New', true, true, 18),
  ('celeste-layer', 'necklaces', 'Celeste Layer', 'Two fine chains joined at the clasp for an effortless layered look.', 'Recycled sterling silver with gold vermeil', '15-17 in and 18-20 in adjustable layers', 18400, '["assets/images/celeste-layer.png","assets/images/category-necklaces.png"]', 'Featured', true, false, 11),
  ('mira-pearl', 'necklaces', 'Mira Pearl', 'A single freshwater pearl on a delicate chain, chosen for soft luster and organic shape.', 'Freshwater pearl, gold vermeil', '17 in chain, 7-8 mm pearl', 14200, '["assets/images/mira-pearl.png","assets/images/category-necklaces.png"]', null, true, false, 14),
  ('noor-choker', 'necklaces', 'Noor Choker', 'A fine choker with a low-profile clasp and tiny reflective stations.', 'Gold vermeil over sterling silver', '14-16 in adjustable length', 11800, '["assets/images/noor-choker.png","assets/images/category-necklaces.png"]', 'New', false, true, 16),
  ('isla-drop', 'necklaces', 'Isla Drop', 'A slender drop pendant inspired by clean lines and quiet movement.', 'Gold vermeil, white topaz accent', '18 in chain, 18 mm drop', 16600, '["assets/images/isla-drop.png","assets/images/category-necklaces.png"]', null, false, false, 5),
  ('ora-cuff', 'bracelets', 'Ora Cuff', 'A sculptural open cuff with a soft oval profile and comfortable rounded ends.', 'Gold vermeil over recycled sterling silver', 'Adjustable, 6.2 in inner circumference', 14800, '["assets/images/ora-cuff.png","assets/images/category-bracelets.png"]', 'Best Seller', true, false, 21),
  ('venice-chain', 'bracelets', 'Venice Chain Bracelet', 'A graceful chain bracelet with subtle weight and an easy lobster clasp.', 'Gold vermeil, polished finish', '6.5-7.5 in adjustable length', 13200, '["assets/images/venice-chain.png","assets/images/category-bracelets.png"]', 'Featured', true, false, 20),
  ('dune-bangle', 'bracelets', 'Dune Bangle', 'A gently waved bangle that catches light without overwhelming the wrist.', 'Recycled sterling silver with gold vermeil', '2.4 in inner diameter', 16800, '["assets/images/dune-bangle.png","assets/images/category-bracelets.png"]', null, false, true, 13),
  ('aura-tennis', 'bracelets', 'Aura Tennis Bracelet', 'A refined line bracelet with white topaz stones and a secure box clasp.', 'Sterling silver, white topaz, gold vermeil', '7 in length, 2 mm stones', 21400, '["assets/images/aura-tennis.png","assets/images/category-bracelets.png"]', 'New', true, true, 4),
  ('lyra-link', 'bracelets', 'Lyra Link Bracelet', 'A modern paperclip link bracelet with a balanced, polished finish.', 'Gold vermeil over sterling silver', '7.25 in length', 13800, '["assets/images/lyra-link.png","assets/images/category-bracelets.png"]', null, false, false, 19),
  ('sera-wrap', 'bracelets', 'Sera Wrap Bracelet', 'A delicate wrap bracelet with a gliding extender chain and soft shine.', 'Gold vermeil, recycled sterling silver', 'Double wrap, adjustable', 12400, '["assets/images/sera-wrap.png","assets/images/category-bracelets.png"]', null, false, false, 0)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  materials = excluded.materials,
  dimensions = excluded.dimensions,
  price_cents = excluded.price_cents,
  images = excluded.images,
  badge = excluded.badge,
  featured = excluded.featured,
  newest = excluded.newest,
  inventory = excluded.inventory,
  updated_at = now();
