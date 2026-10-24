const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ingest() {
  const catalogPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Harshita', '.gemini', 'antigravity', 'brain', '4e8e4ad3-4721-4bde-98c3-378820f24880', 'scratch', 'catalog_all_200.json');
  console.log(`Reading catalog from: ${catalogPath}`);
  
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog file not found at ${catalogPath}`);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`Loaded ${catalog.length} products from catalog JSON.`);

  if (catalog.length !== 200) {
    throw new Error(`Expected exactly 200 products, found ${catalog.length}`);
  }

  // 1. Collect all unique categories
  const categoriesMap = new Map();
  for (const item of catalog) {
    let catName = item.category.trim();
    if (catName.toLowerCase().includes('cor')) {
      catName = 'Home Décor';
    }
    const slug = slugify(catName);
    categoriesMap.set(slug, catName);
  }

  console.log(`Upserting ${categoriesMap.size} categories...`);
  const categoryDbMap = new Map();
  for (const [slug, name] of categoriesMap.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    categoryDbMap.set(slug, cat.id);
  }

  // 2. Collect and upsert all unique manufacturers
  const manufacturersMap = new Map(); // name -> location
  for (const item of catalog) {
    for (const cand of item.candidates) {
      const name = cand.name.trim();
      const loc = cand.location.trim();
      if (!manufacturersMap.has(name) || loc) {
        manufacturersMap.set(name, loc);
      }
    }
  }

  console.log(`Upserting ${manufacturersMap.size} unique manufacturers...`);
  const manufacturerDbMap = new Map();
  let mIndex = 0;
  for (const [name, location] of manufacturersMap.entries()) {
    mIndex++;
    const m = await prisma.manufacturer.upsert({
      where: { name },
      update: {
        location: location || undefined,
        country: "China",
        verified: true,
      },
      create: {
        name,
        location: location || null,
        country: "China",
        verified: true,
        rating: 4.8,
        qualityScore: 90,
        reliabilityScore: 92,
        leadTimeDays: 14,
      },
    });
    manufacturerDbMap.set(name, m.id);
  }

  // 3. Upsert all 200 products
  console.log(`Upserting 200 products into database...`);
  let pIndex = 0;
  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const catalogId = `SIN-200-${String(i + 1).padStart(3, '0')}`;
    let catName = item.category.trim();
    if (catName.toLowerCase().includes('cor')) {
      catName = 'Home Décor';
    }
    const catSlug = slugify(catName);
    const categoryId = categoryDbMap.get(catSlug);

    // Primary manufacturer is candidate #1
    const primaryCandidate = item.candidates[0];
    const manufacturerId = manufacturerDbMap.get(primaryCandidate.name.trim());

    if (!manufacturerId) {
      throw new Error(`Manufacturer ID not found for primary candidate: ${primaryCandidate.name}`);
    }

    // Format specifications with candidate options
    const candidateListStr = item.candidates
      .map((c, idx) => `${idx + 1}. ${c.name} (${c.location})`)
      .join(' | ');
    const specifications = `Planning estimate: ₹${item.price}. Verified candidate manufacturers: ${candidateListStr}`;

    const sourceUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(item.product)}`;

    await prisma.product.upsert({
      where: { catalogId },
      update: {
        name: item.product,
        unitPriceINR: Number(item.price),
        categoryId,
        manufacturerId,
        specifications,
        sourceUrl,
        photoStatus: "Embedded real photo",
      },
      create: {
        catalogId,
        name: item.product,
        unitPriceINR: Number(item.price),
        categoryId,
        manufacturerId,
        specifications,
        sourceUrl,
        photoStatus: "Embedded real photo",
        moq: null,
        leadTimeDays: null,
      },
    });
    pIndex++;
  }

  console.log(`Successfully ingested ${pIndex} products!`);

  // Verification counts
  const [totalCategories, totalManufacturers, totalProducts, totalRfqs, totalOrders] = await Promise.all([
    prisma.category.count(),
    prisma.manufacturer.count(),
    prisma.product.count(),
    prisma.rfq.count(),
    prisma.order.count(),
  ]);

  console.log('=== Ingestion Summary ===');
  console.log(`- Categories in DB: ${totalCategories}`);
  console.log(`- Manufacturers in DB: ${totalManufacturers}`);
  console.log(`- Products in DB: ${totalProducts}`);
  console.log(`- Total RFQs (preserved): ${totalRfqs}`);
  console.log(`- Total Orders (preserved): ${totalOrders}`);
}

ingest()
  .catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
