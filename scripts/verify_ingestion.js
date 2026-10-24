const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const checkIds = ['SIN-200-001', 'SIN-200-050', 'SIN-200-100', 'SIN-200-150', 'SIN-200-200'];
  for (const cid of checkIds) {
    const p = await prisma.product.findUnique({
      where: { catalogId: cid },
      include: { manufacturer: true, category: true }
    });
    console.log({
      catalogId: p.catalogId,
      name: p.name,
      price: p.unitPriceINR,
      category: p.category.name,
      manufacturer: p.manufacturer.name,
      location: p.manufacturer.location,
      country: p.manufacturer.country,
      verified: p.manufacturer.verified,
      specsPreview: p.specifications?.substring(0, 80) + '...'
    });
  }
}

verify()
  .then(() => prisma.$disconnect())
  .catch(console.error);
