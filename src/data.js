/* ============================================================
   Site copy + project data — sourced from Ahmad Shah Donishyar's CV
   ============================================================ */

export const SITE = {
  name: 'Ahmad Shah Donishyar',
  brand: 'DONISHYAR',
  role: 'Graphic Designer',
  email: 'ahdonishyar@gmail.com',
  phone: '+93 796 206 515',
  intro:
    'DONISHYAR IS A MULTIDISCIPLINARY GRAPHIC DESIGNER CRAFTING IDENTITIES, CAMPAIGNS & MOTION FOR AMBITIOUS BRANDS.',
  cities: [
    { label: 'KABUL, AF', tz: 'Asia/Kabul' },
    { label: 'DUBAI, AE', tz: 'Asia/Dubai' },
  ],
  summary:
    'Creative graphic designer with over 7 years of experience creating impactful visual content — logos, flyers, branding, motion graphics and 3D design. Skilled in transforming ideas into clean, effective designs that support brand growth and marketing goals.',
  experience: [
    {
      years: '2025 — NOW',
      role: 'Graphic Designer',
      co: 'Pamir Cola Group of Companies',
      note: 'Billboards, social campaigns, 3D commercials in Blender, AI-powered product films. Official poster & film for Dubai Gulfood 2026. Grew social engagement from ~1K to 8.2K+ interactions.',
    },
    {
      years: '2023 — 2025',
      role: 'Graphic Designer',
      co: 'CyborgTech Creative Agency',
      note: 'Complete branding strategies, social campaigns, motion graphics and video for dental & food-industry clients.',
    },
    {
      years: '2018 — 2023',
      role: 'Co-Founder & CCO',
      co: 'Azin Travel Agency',
      note: 'Built the brand from scratch — logo, full visual identity, print, motion and social presence.',
    },
  ],
  education: [
    { year: '2023', title: 'Graphic Design Diploma' },
    { year: '2022', title: 'Adobe Illustrator Diploma' },
    { year: '2021', title: 'B.Sc. Computer Science' },
  ],
  skills: [
    'Logo & Brand Design', 'Poster & Flyer', 'Social Media Design', 'Motion Graphics',
    '3D Design', 'UI / UX', 'AI Prompting', 'Illustrator', 'Photoshop', 'After Effects',
    'Premiere Pro', 'Blender', 'Figma', 'Canva',
  ],
};

/*
  cat ∈ IDENTITY · PRINT · SOCIAL · MOTION · DIGITAL · TYPE
  arch ∈ typePoster · bauhaus · swiss · orb · halftone · specimen ·
         editorial · waves · bottle · phone
  aspect = artwork width / height · h = world-space height of the card
*/
export const PROJECTS = [
  {
    id: 'gulfood-2026', title: 'Gulfood 2026', client: 'Pamir Cola', year: '2026',
    cat: 'PRINT', tags: ['PRINT', 'POSTER', 'EXHIBITION'],
    arch: 'typePoster', pal: 2, aspect: 0.75, h: 4.8,
    role: 'Art Direction · Design', tools: 'Illustrator · Photoshop',
    blurb: [
      'Official exhibition poster and promotional film for Pamir Cola at Gulfood Dubai 2026 — the world\'s largest food & beverage sourcing event.',
      'A loud, typography-first system built to survive a 40-metre exhibition hall: one voice, one colour field, zero noise.',
    ],
  },
  {
    id: 'pamir-rebrand', title: 'Pamir Cola Rebrand', client: 'Pamir Cola', year: '2025',
    cat: 'IDENTITY', tags: ['IDENTITY', 'CAMPAIGN', 'BILLBOARD'],
    arch: 'bottle', pal: 9, aspect: 0.8, h: 5.0,
    role: 'Brand Design', tools: 'Illustrator · Photoshop',
    blurb: [
      'High-impact billboard and brand-visual system for one of the region\'s best-known beverage groups — consistent across print, packaging and digital.',
      'The refreshed visual language put the bottle back at the centre: bold silhouette, condensation-cold colour, headlines that read at highway speed.',
    ],
  },
  {
    id: 'fizz-social', title: 'Fizz Season', client: 'Pamir Cola', year: '2025',
    cat: 'SOCIAL', tags: ['SOCIAL', 'CAMPAIGN', 'CONTENT'],
    arch: 'phone', pal: 3, aspect: 0.56, h: 4.6,
    role: 'Design · Content', tools: 'Photoshop · After Effects',
    blurb: [
      'A year-round social content system that lifted engagement from roughly one thousand interactions to more than 8,200 per campaign.',
      'Templates, motion stickers and a colour calendar let the brand post daily without ever looking off-brand.',
    ],
  },
  {
    id: 'bottle-motion', title: 'Bottle in Motion', client: 'Pamir Cola', year: '2025',
    cat: 'MOTION', tags: ['3D', 'MOTION', 'COMMERCIAL'],
    arch: 'orb', pal: 4, aspect: 1.5, h: 3.6,
    role: '3D · Animation', tools: 'Blender · After Effects',
    blurb: [
      'Full-CG commercial spots produced in Blender — liquid simulation, studio lighting and product choreography for broadcast and LED billboards.',
      'Sixty seconds of fizz rendered overnight on a single workstation. Constraint breeds style.',
    ],
  },
  {
    id: 'ai-product-films', title: 'Synthetic Films', client: 'Pamir Cola', year: '2026',
    cat: 'MOTION', tags: ['AI', 'VIDEO', 'CONTENT'],
    arch: 'waves', pal: 0, aspect: 1.78, h: 3.4,
    role: 'AI Direction · Edit', tools: 'AI Pipeline · Premiere Pro',
    blurb: [
      'AI-powered photoreal product films and animated content — prompt-engineered, art-directed and cut for paid social.',
      'A hybrid pipeline: generative footage graded and composited by hand, so the machine never gets the last word.',
    ],
  },
  {
    id: 'cyborgtech-id', title: 'CyborgTech Identity', client: 'CyborgTech', year: '2023',
    cat: 'IDENTITY', tags: ['IDENTITY', 'LOGO', 'GUIDELINES'],
    arch: 'specimen', pal: 8, aspect: 1, h: 4.0,
    role: 'Brand Design', tools: 'Illustrator · Figma',
    blurb: [
      'Identity for a creative agency that sells the future — wordmark, type system and a monochrome kit of parts that flexes from pitch deck to neon sign.',
      'One letterform carries the whole brand. Everything else stays out of its way.',
    ],
  },
  {
    id: 'lumina-dental', title: 'Lumina Dental', client: 'Lumina Clinics', year: '2024',
    cat: 'MOTION', tags: ['MOTION', 'HEALTHCARE', 'SOCIAL'],
    arch: 'swiss', pal: 1, aspect: 1.33, h: 3.5,
    role: 'Motion Design', tools: 'After Effects · Illustrator',
    blurb: [
      'Motion-graphics package and social toolkit for a chain of dental clinics — explainer loops, before/after reveals and appointment CTAs.',
      'Clinical without being cold: a Swiss grid, one blue, and animation timed to a resting heartbeat.',
    ],
  },
  {
    id: 'saffron-kitchen', title: 'Saffron Kitchen', client: 'Saffron Group', year: '2024',
    cat: 'IDENTITY', tags: ['IDENTITY', 'PACKAGING', 'FOOD'],
    arch: 'bauhaus', pal: 6, aspect: 0.8, h: 4.4,
    role: 'Brand & Packaging', tools: 'Illustrator · Photoshop',
    blurb: [
      'Brand and packaging system for a food-industry client — menus, delivery packaging and a pattern language built from the geometry of the saffron crocus.',
      'Appetite is a colour problem. We solved it in oxide red and cream.',
    ],
  },
  {
    id: 'street-food-fest', title: 'Kabul Food Fest', client: 'City Events', year: '2023',
    cat: 'PRINT', tags: ['PRINT', 'POSTER', 'EVENT'],
    arch: 'halftone', pal: 5, aspect: 0.72, h: 4.6,
    role: 'Poster Design', tools: 'Illustrator · Photoshop',
    blurb: [
      'Poster series for a street-food festival — halftone heat, stacked type and a wayfinding system that doubled as merch.',
      'Printed in two colours on the cheapest stock available. The posters disappeared off the walls within a day — the highest compliment.',
    ],
  },
  {
    id: 'nawroz-greetings', title: 'Nawroz Stories', client: 'CyborgTech', year: '2024',
    cat: 'SOCIAL', tags: ['SOCIAL', 'CONTENT', 'SEASONAL'],
    arch: 'phone', pal: 4, aspect: 0.56, h: 4.2,
    role: 'Design · Content', tools: 'Photoshop · After Effects',
    blurb: [
      'Seasonal social campaign for the new-year season — animated greeting cards, story templates and countdown stickers shipped to a dozen client accounts at once.',
      'One master system, twelve brand skins, zero missed deadlines.',
    ],
  },
  {
    id: 'logofolio-02', title: 'Logofolio Vol.02', client: 'Various', year: '2024',
    cat: 'TYPE', tags: ['LOGO', 'IDENTITY', 'COLLECTION'],
    arch: 'specimen', pal: 3, aspect: 1, h: 3.4,
    role: 'Logo Design', tools: 'Illustrator',
    blurb: [
      'A collected volume of marks, monograms and wordmarks designed across two agency years — retail, tech, food and travel.',
      'A logo is a promise compressed to a glyph. Here are twenty-four promises.',
    ],
  },
  {
    id: 'azin-identity', title: 'Azin Travel Identity', client: 'Azin Travel', year: '2018',
    cat: 'IDENTITY', tags: ['IDENTITY', 'LOGO', 'PRINT'],
    arch: 'swiss', pal: 7, aspect: 1.33, h: 4.2,
    role: 'Co-Founder · CCO', tools: 'Illustrator · Photoshop',
    blurb: [
      'The brand I co-founded and built from zero — logo, full visual identity, stationery, signage and every customer touchpoint for a travel agency.',
      'Five years as CCO taught me the long game: an identity is not a launch, it\'s a maintenance contract with the public.',
    ],
  },
  {
    id: 'fly-beyond', title: 'Fly Beyond', client: 'Azin Travel', year: '2021',
    cat: 'PRINT', tags: ['PRINT', 'BROCHURE', 'CAMPAIGN'],
    arch: 'editorial', pal: 1, aspect: 0.75, h: 4.4,
    role: 'Design · Print', tools: 'Illustrator · InDesign',
    blurb: [
      'Poster, brochure and business-card campaign selling long-haul packages — duotone skies, ticket-stub die-cuts and departure-board typography.',
      'Print for people who still keep boarding passes. Tactility is the point.',
    ],
  },
  {
    id: 'silk-road', title: 'Silk Road Stories', client: 'Azin Travel', year: '2022',
    cat: 'SOCIAL', tags: ['SOCIAL', 'CONTENT', 'TRAVEL'],
    arch: 'orb', pal: 5, aspect: 1, h: 3.8,
    role: 'Content Design', tools: 'Photoshop · Premiere Pro',
    blurb: [
      'Social content promoting travel packages along the old silk road — landscape grading, route maps and serialized story design.',
      'Every destination got a sun: one gradient, shifted by latitude.',
    ],
  },
  {
    id: 'azin-motion', title: 'Azin in Motion', client: 'Azin Travel', year: '2020',
    cat: 'MOTION', tags: ['MOTION', '3D', 'PROMO'],
    arch: 'waves', pal: 7, aspect: 1.78, h: 3.2,
    role: 'Motion · 3D', tools: 'After Effects · Blender',
    blurb: [
      'Promotional videos and 3D animation for travel packages — logo stings, route fly-throughs and airport-screen loops.',
      'The early 3D work that started everything: jet streams as brushstrokes.',
    ],
  },
  {
    id: 'type-studies', title: 'Bilingual Type Studies', client: 'Self-Initiated', year: '2022',
    cat: 'TYPE', tags: ['TYPE', 'EXPERIMENT', 'PRINT'],
    arch: 'typePoster', pal: 0, aspect: 0.72, h: 4.5,
    role: 'Type Design', tools: 'Illustrator · Glyphs',
    blurb: [
      'A self-initiated series exploring Latin and Perso-Arabic letterforms sharing one grid — posters where two scripts argue and agree.',
      'Two directions of reading, one direction of thought.',
    ],
  },
  {
    id: 'ui-booking', title: 'Safar Booking App', client: 'Concept', year: '2023',
    cat: 'DIGITAL', tags: ['UI/UX', 'APP', 'PRODUCT'],
    arch: 'phone', pal: 8, aspect: 0.56, h: 4.4,
    role: 'UI / UX Design', tools: 'Figma',
    blurb: [
      'Concept UI for a flight & tour booking app — search-first flow, dark cabin mode and a checkout that fits one thumb.',
      'Designed in Figma from research to clickable prototype; born from five years of hearing real travellers complain at a real counter.',
    ],
  },
  {
    id: 'poster-archive', title: 'Poster Archive 36', client: 'Self-Initiated', year: '2021',
    cat: 'PRINT', tags: ['PRINT', 'POSTER', 'SERIES'],
    arch: 'bauhaus', pal: 2, aspect: 0.72, h: 4.3,
    role: 'Design', tools: 'Illustrator · Photoshop',
    blurb: [
      'Thirty-six posters in thirty-six days — one shape system, daily constraints, no client, no mercy.',
      'The sketchbook that became a style. Several later commissions started as a day in this archive.',
    ],
  },
];

export const CATEGORIES = ['ALL', 'IDENTITY', 'PRINT', 'SOCIAL', 'MOTION', 'DIGITAL', 'TYPE'];
